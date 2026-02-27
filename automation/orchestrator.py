#!/usr/bin/env python3
import os
import json
import subprocess
from pathlib import Path
from typing import List

from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / "automation" / "reports"

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_API_KEY = os.environ.get("OLLAMA_API_KEY", "ollama")
MODEL = os.environ.get("MODEL_NAME", "qwen2.5-coder:32b")

GH_TOKEN = os.environ.get("GITHUB_TOKEN")
REPO_SLUG = os.environ.get("REPO_SLUG")
FAST_MODE = os.environ.get("FAST_MODE") == "1"

client = OpenAI(
    base_url=f"{OLLAMA_BASE_URL}/v1",
    api_key=OLLAMA_API_KEY,
)


def run(cmd: List[str], cwd: Path = ROOT, check: bool = True) -> str:
    res = subprocess.run(
        cmd,
        cwd=str(cwd),
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )
    if check and res.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\n{res.stdout}")
    return res.stdout


def load_reports() -> str:
    chunks = []
    for p in REPORT_DIR.glob("*.json"):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        text = json.dumps(data, indent=2)
        if FAST_MODE:
            text = text[:4000]
        chunks.append(f"=== REPORT: {p.name} ===\n{text}\n")
    return "\n".join(chunks)


def get_git_diff() -> str:
    """Return full git diff for tracked files."""
    return run(["git", "diff"], check=False)


def working_tree_has_uncommitted_changes(ignore_gitignore: bool = False) -> bool:
    """
    Check if there are uncommitted changes.
    If ignore_gitignore=True, changes only to .gitignore are ignored.
    """
    names_raw = run(["git", "diff", "--name-only"], check=False)
    names = [n.strip() for n in names_raw.splitlines() if n.strip()]
    if ignore_gitignore:
        names = [n for n in names if n != ".gitignore"]
    return bool(names)


def get_file_content(path: str) -> str:
    p = ROOT / path
    if not p.exists():
        return ""
    content = p.read_text(encoding="utf-8", errors="ignore")
    if FAST_MODE and len(content) > 8000:
        return content[:8000]
    return content


def normalize_patch(raw: str) -> str:
    """Strip markdown fences and whitespace from model output."""
    if not raw:
        return ""
    text = raw.strip()

    if "```" in text:
        parts = text.split("```")
        candidates = [p for p in parts if "diff --git" in p]
        if candidates:
            text = candidates[0].strip()
        elif len(parts) >= 3:
            text = parts[1].strip()

    return text


def ask_model(system: str, user: str) -> str:
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.0,
        max_tokens=400,
    )
    return resp.choices[0].message.content or ""


def generate_and_apply_patches():
    reports_text = load_reports()
    if not reports_text.strip():
        print("No reports to work with.")
        return

    # For now, restrict changes to a single safe file.
    allowed_file = "apps/api/src/main.ts"

    system = f"""
You are a senior full-stack engineer.

You are given:
- One or more scanner reports (JSON-like text).
- The current contents of {allowed_file}.

Your job in this run:
- Pick 1–2 small, concrete improvements (logging clarity, robustness, minor bugfix) in {allowed_file}.
- Generate ONE unified git patch in diff format.

Hard constraints:
- You may ONLY modify the file: {allowed_file}
- You MUST NOT touch any other file.
- The patch MUST be minimal but still compile / run.
- Only modify existing lines / blocks. Do NOT create or delete files.

Output requirements (IMPORTANT):
- Your ENTIRE response MUST be a valid unified git diff.
- It MUST start with at least one line beginning with: diff --git
- Do NOT include explanations, comments, prose, or markdown fences.
- Do NOT wrap the diff in ``` blocks.
- Just the raw diff.
"""

    key_files = [
        allowed_file,
    ]

    context_parts = [reports_text]
    for f in key_files:
        content = get_file_content(f)
        if not content:
            continue
        context_parts.append(f"\n\n===== FILE: {f} =====\n{content}")

    user = "\n".join(context_parts)

    print("Sending to model…")
    raw_patch = ask_model(system, user)
    patch = normalize_patch(raw_patch)

    patch_file = ROOT / "automation" / "llm.patch"
    patch_file.write_text(patch, encoding="utf-8")

    if "diff --git" not in patch:
        print("Did not receive a 'diff --git' patch. First 400 chars:")
        print(patch[:400])
        return

    # Enforce that only the allowed file is touched.
    bad_files = []
    for line in patch.splitlines():
        if line.startswith("diff --git "):
            # line looks like: diff --git a/path b/path
            parts = line.split()
            if len(parts) >= 4:
                a_path = parts[2].removeprefix("a/")
                b_path = parts[3].removeprefix("b/")
                if a_path != allowed_file or b_path != allowed_file:
                    bad_files.append((a_path, b_path))

    if bad_files:
        print("Patch tries to modify unsupported files, skipping.")
        print("Offending paths:", bad_files)
        print("First 400 chars of patch:")
        print(patch[:400])
        return

    try:
        run(["git", "apply", str(patch_file)])
    except Exception as e:
        print("Failed to apply patch:", e)
        print("First 400 chars of patch for debugging:")
        print(patch[:400])
        return

    print("Patch applied.")


def run_tests() -> bool:
    try:
        run(["pnpm", "test"], check=True)
        return True
    except Exception as e:
        print("Tests failed:", e)
        return False


def create_pr():
    diff = get_git_diff()
    if not diff.strip():
        print("No changes after patch, no PR.")
        return

    branch_name = "bot/nightly-" + run(
        ["date", "+%Y%m%d-%H%M%S"],
        check=False,
    ).strip()

    run(["git", "checkout", "-b", branch_name])
    run(["git", "add", "."], check=False)
    run(["git", "commit", "-m", "chore: nightly bot improvements"])

    env = os.environ.copy()
    if GH_TOKEN:
        env["GITHUB_TOKEN"] = GH_TOKEN

    subprocess.run(
        ["git", "push", "origin", branch_name],
        cwd=str(ROOT),
        env=env,
        check=True,
    )

    title = "Nightly bot: small improvements"
    body = (
        "Automatically generated PR from nightly bot (Ollama + Qwen).\n"
        "Please review before merging."
    )

    subprocess.run(
        ["gh", "pr", "create", "--title", title, "--body", body, "--base", "main"],
        cwd=str(ROOT),
        env=env,
        check=True,
    )
    print("PR created.")


def main():
    # 1) Ensure clean working tree (ignoring .gitignore only)
    if working_tree_has_uncommitted_changes(ignore_gitignore=True):
        print("Working tree is not clean (excluding .gitignore) – aborting.")
        return

    # 2) Update main
    run(["git", "checkout", "main"])
    run(["git", "pull", "--ff-only"])

    # 3) Run scanners
    print("Running scanners…")
    subprocess.run(
        ["bash", "automation/scanners/run_scanners.sh"],
        cwd=str(ROOT),
        check=False,
    )

    # 4) Generate and apply patches
    generate_and_apply_patches()

    # 5) Run tests
    if not run_tests():
        print("Changes exist but tests failed – no PR.")
        return

    # 6) Create PR
    create_pr()


if __name__ == "__main__":
    main()