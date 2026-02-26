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

client = OpenAI(
    base_url=f"{OLLAMA_BASE_URL}/v1",
    api_key=OLLAMA_API_KEY,
)


def run(cmd: List[str], cwd: Path = ROOT, check: bool = True) -> str:
    """Run a shell command and return stdout as text."""
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


def working_tree_dirty() -> bool:
    """
    Return True if working tree is not clean.
    This includes untracked files (git status --porcelain).
    """
    status = run(["git", "status", "--porcelain"], check=False)
    return bool(status.strip())


def load_reports() -> str:
    """Load all JSON scanner reports into one big text blob."""
    chunks = []
    for p in REPORT_DIR.glob("*.json"):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        chunks.append(f"=== REPORT: {p.name} ===\n{json.dumps(data, indent=2)}\n")
    return "\n".join(chunks)


def get_git_diff() -> str:
    """
    Get git diff for tracked changes, but ignore .gitignore diffs.
    We only care about actual code/config changes.
    """
    diff = run(["git", "diff"], check=False)
    lines = diff.splitlines()

    filtered_lines = []
    skip_block = False

    for line in lines:
        if line.startswith("diff --git "):
            # Start of a new file block.
            skip_block = " a/.gitignore " in line or " b/.gitignore " in line

        if not skip_block:
            filtered_lines.append(line)

    return "\n".join(filtered_lines)


def get_file_content(path: str) -> str:
    """Safely read a file relative to repo root."""
    p = ROOT / path
    if not p.exists():
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")


def ask_model(system: str, user: str) -> str:
    """Call the local Ollama-compatible model via OpenAI client."""
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


def generate_and_apply_patches():
    """Ask the model for a single unified diff, then apply it."""
    reports_text = load_reports()
    if not reports_text.strip():
        print("No reports to work with.")
        return

    system = """
You are a senior fullstack developer. You receive:
- scanner reports
- relevant code files from this repo

Your job:
- Find 1–3 small, concrete improvements (security, bug fix, clarity) to fix in this run.
- Generate ONE unified 'git diff' patch in standard format.
- The patch must be minimal but compile/run.
- Modify existing files only – do NOT add or delete files.
- No explanation, only raw diff.
"""

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
    patch = ask_model(system, user)
    if "diff --git" not in patch:
        print("Did not receive a diff back, skipping.")
        return

    patch_file = ROOT / "automation" / "llm.patch"
    patch_file.write_text(patch, encoding="utf-8")

    try:
        run(["git", "apply", str(patch_file)])
        print("Patch applied.")
    except Exception as e:
        print("Failed to apply patch:", e)
        return
    finally:
        # Do not leave the patch file as untracked noise.
        try:
            patch_file.unlink()
        except FileNotFoundError:
            pass


def run_tests() -> bool:
    """Run project tests. Adjust command if needed."""
    try:
        run(["pnpm", "test"], check=True)
        return True
    except Exception as e:
        print("Tests failed:", e)
        return False


def create_pr():
    """
    Create a branch, commit changes and open a PR using gh CLI.
    Only runs if there are tracked changes.
    """
    # Check for any changes at all (tracked or untracked).
    status = run(["git", "status", "--porcelain"], check=False)
    if not status.strip():
        print("No changes after patch, no PR.")
        return

    diff = get_git_diff()
    if not diff.strip():
        print("Only untracked/ignored changes or .gitignore diffs – no PR.")
        return

    # Create branch name based on timestamp
    branch_name = "bot/nightly-" + run(
        ["date", "+%Y%m%d-%H%M%S"], check=False
    ).strip()

    run(["git", "checkout", "-b", branch_name])

    # Only stage changes to already tracked files.
    # We told the model not to create new files.
    run(["git", "add", "-u"], check=False)

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
    # 1) Ensure a clean working tree before doing anything
    if working_tree_dirty():
        print("Working tree is not clean – aborting.")
        run(["git", "status"], check=False)
        return

    # 2) Make sure we are on up-to-date main
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

    # 5) Run tests; if they fail, bail out
    if not run_tests():
        print("Changes exist but tests failed – no PR.")
        return

    # 6) Create PR if there are tracked changes
    create_pr()


if __name__ == "__main__":
    main()