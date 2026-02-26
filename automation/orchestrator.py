#!/usr/bin/env python3
import os
import json
import re
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

print(GH_TOKEN)

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
        chunks.append(f"=== REPORT: {p.name} ===\n{json.dumps(data, indent=2)}\n")
    return "\n".join(chunks)


def get_git_diff() -> str:
    diff = run(["git", "diff"], check=False)
    if not diff.strip():
        return ""

    lines = diff.splitlines()
    filtered_lines: list[str] = []
    skip_block = False

    for line in lines:
        if line.startswith("diff --git "):
            # New block – check if it concerns .gitignore
            skip_block = " a/.gitignore " in line or " b/.gitignore " in line

        if not skip_block:
            filtered_lines.append(line)

    return "\n".join(filtered_lines).strip()


def get_file_content(path: str) -> str:
    p = ROOT / path
    if not p.exists():
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")


def ask_model(system: str, user: str) -> str:
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.2,
        max_tokens=2048,
    )
    return resp.choices[0].message.content or ""


def extract_diff(raw: str) -> str | None:
    if not raw:
        return None

    text = raw.strip()
    if not text:
        return None

    # 1) Look for ```diff```/```-blocks
    fence_match = re.search(r"```(?:diff)?\s*(.*?)```", text, re.S)
    if fence_match:
        block = fence_match.group(1).strip()
        if "diff --git" in block:
            # If the block is already a clean diff, use it
            return block[block.index("diff --git") :].strip()

    # 2) Otherwise: find the first 'diff --git' and take everything from there
    if "diff --git" in text:
        idx = text.index("diff --git")
        return text[idx:].strip()

    return None


def generate_and_apply_patches():
    reports_text = load_reports()
    if not reports_text.strip():
        print("No reports to work with.")
        return

    system = """
      You are a senior full-stack developer. You will receive:
        - reports from code scanners
        - relevant code files

      Task:
        - Identify 1–3 concrete, small improvements (security, bug, clarity) to fix in this round.
        - Generate ONE combined ‘git diff’ patch in unified diff format.
        - The patch must be minimal but must compile/run.
        - Modify existing files only – do not add or delete files.

      RESPONSE FORMAT (IMPORTANT):
        - Respond ONLY with a valid git diff.
        - The first line must start with: diff --git
        - No explanation, no markdown wrapper.
"""

    # Fetch some code context (hardcode some key files)
    key_files = [
        "apps/api/src/main.ts",
        "apps/api/src/app.module.ts",
        "apps/api/src/persons.controller.ts",
        "apps/web/src/Home.svelte",
        "package.json",
        "pnpm-lock.yaml",
    ]

    context_parts = [reports_text]
    for f in key_files:
        content = get_file_content(f)
        if not content:
            continue
        context_parts.append(f"\n\n===== FILE: {f} =====\n{content[:20000]}")

    user = "\n".join(context_parts)

    print("Sending to model…")
    raw_patch = ask_model(system, user)

    patch = extract_diff(raw_patch)
    if not patch:
        print("Did not receive a diff back, skipping.")
        return

    # Skriv patch til fil og apply
    patch_file = ROOT / "automation" / "llm.patch"
    patch_file.write_text(patch, encoding="utf-8")

    try:
        run(["git", "apply", str(patch_file)])
    except Exception as e:
        print("Failed to apply patch:", e)
        return

    print("Patch applied.")


def run_tests() -> bool:
    try:
        # tilpass til prosjektet ditt
        run(["pnpm", "test"], check=True)
        return True
    except Exception as e:
        print("Tester feilet:", e)
        return False


def create_pr():
    diff = get_git_diff()
    if not diff.strip():
        print("No changes after patch, no PR.")
        return

    branch_name = "bot/nightly-" + run(
        ["date", "+%Y%m%d-%H%M%S"], check=False
    ).strip()
    run(["git", "checkout", "-b", branch_name])
    run(["git", "add", "."], check=False)
    run(["git", "commit", "-m", "chore: nightly bot improvements"])

    # Push + create PR med gh CLI
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
        "Automatically generated PR from nightly bot. "
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
    # 1) ensure clean working tree before starting (ignore .gitignore noise)
    if get_git_diff().strip():
        print("Working tree is not clean – aborting.")
        return

    # 2) update main
    run(["git", "checkout", "main"])
    run(["git", "pull", "--ff-only"])

    # 3) run scanners
    print("Running scanners…")
    subprocess.run(
        ["bash", "automation/scanners/run_scanners.sh"],
        cwd=str(ROOT),
        check=False,
    )

    # 4) generate and apply patches
    generate_and_apply_patches()

    # 5) run tests
    if not run_tests():
        print("Changes but tests failed – no PR.")
        return

    # 6) create PR
    create_pr()


if __name__ == "__main__":
    main()