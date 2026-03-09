#!/usr/bin/env python3
import difflib
import os
import json
import subprocess
import re
from pathlib import Path
from typing import List
import shutil

from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / "automation" / "reports"

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_API_KEY = os.environ.get("OLLAMA_API_KEY", "ollama")
MODEL = os.environ.get("MODEL_NAME", "qwen2.5-coder:32b")

GH_TOKEN = os.environ.get("GITHUB_TOKEN")
REPO_SLUG = os.environ.get("REPO_SLUG")
FAST_MODE = os.environ.get("FAST_MODE") == "1"

MAX_FILE_CHARS = 6000 if FAST_MODE else 12000
MAX_REPORT_CHARS = 3000 if FAST_MODE else 8000

AI_ISSUES_FILE = "ai-issues.json"

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


def get_source_files() -> list[str]:
    """Discover all non-spec TypeScript source files in the API."""
    src_dir = ROOT / "apps" / "api" / "src"
    if not src_dir.exists():
        return []
    files = []
    for p in src_dir.rglob("*.ts"):
        if ".spec." in p.name:
            continue
        if "node_modules" in str(p):
            continue
        files.append(str(p.relative_to(ROOT)))
    return sorted(files)


def load_reports() -> str:
    chunks = []
    for p in sorted(REPORT_DIR.glob("*.json")):
        if p.name == AI_ISSUES_FILE:
            continue
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        text = json.dumps(data, indent=2)
        if len(text) > MAX_REPORT_CHARS:
            text = text[:MAX_REPORT_CHARS] + "\n... (truncated)"
        chunks.append(f"=== REPORT: {p.name} ===\n{text}\n")
    return "\n".join(chunks)


def get_git_diff() -> str:
    return run(["git", "diff"], check=False)


def working_tree_has_uncommitted_changes(ignore_gitignore: bool = False) -> bool:
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
    if len(content) > MAX_FILE_CHARS:
        return content[:MAX_FILE_CHARS] + "\n... (truncated)"
    return content


def _strip_fences(raw: str) -> str:
    """Remove markdown code fences from model output, preserving inner content."""
    text = raw.strip()
    if "```" not in text:
        return text
    parts = text.split("```")
    if len(parts) < 3:
        return text
    inner = parts[1].strip()
    # Drop optional language tag (e.g. "typescript\n...")
    if "\n" in inner:
        first_line, rest = inner.split("\n", 1)
        if re.match(r"^[a-z]+$", first_line):
            inner = rest
    return inner.strip()


def ask_model(system: str, user: str, max_tokens: int = 16000) -> str:
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        temperature=0.15,
        max_tokens=max_tokens,
    )
    return resp.choices[0].message.content or ""


def _parse_issues(raw: str) -> list[dict]:
    """Extract and validate a JSON issue list from a raw model response."""
    try:
        match = re.search(r"\[[\s\S]*\]", raw)
        blob = match.group() if match else raw.strip()
        issues = json.loads(blob)
    except Exception as e:
        print(f"Failed to parse analysis JSON: {e}")
        print("Raw response (first 500 chars):", raw[:500])
        return []
    if not isinstance(issues, list):
        print("Unexpected analysis format (not a list).")
        return []
    return issues


def _save_analysis(issues: list[dict]) -> None:
    """Persist issues as JSON + human-readable markdown."""
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    (REPORT_DIR / AI_ISSUES_FILE).write_text(
        json.dumps(issues, indent=2, ensure_ascii=False), encoding="utf-8"
    )

    md_lines = ["# AI Nightly Analysis\n\n"]
    if not issues:
        md_lines.append("No issues found.\n")
    else:
        for i, issue in enumerate(issues, 1):
            sev = issue.get("severity", "?").upper()
            title = issue.get("title", "Untitled")
            file_ = issue.get("file", "")
            line = issue.get("line", "")
            desc = issue.get("description", "")
            sugg = issue.get("suggestion", "")
            loc = f"{file_}:{line}" if line else file_
            md_lines += [
                f"## {i}. [{sev}] {title}\n\n",
                f"**Location:** `{loc}`\n\n",
                f"**Issue:** {desc}\n\n",
                f"**Suggestion:** {sugg}\n\n",
                "---\n\n",
            ]

    (ROOT / "automation" / "ai-suggestions.md").write_text(
        "".join(md_lines), encoding="utf-8"
    )


def analyze_codebase() -> list[dict]:
    """
    Phase 1: Ask the model to analyze all source files and scanner reports.
    Returns a ranked list of issues. Saves ai-suggestions.md for human review.
    """
    source_files = get_source_files()
    reports_text = load_reports()

    context_parts = []
    if reports_text.strip():
        context_parts.append("=== SCANNER REPORTS ===\n" + reports_text)

    for f in source_files:
        content = get_file_content(f)
        if content:
            context_parts.append(f"===== FILE: {f} =====\n{content}")

    if not context_parts:
        print("No source files or reports found.")
        return []

    system = """\
You are a senior full-stack engineer performing a code review of a NestJS TypeScript API.

You are given scanner reports (dependency audits, TypeScript errors, static analysis) \
and the source files of the API.

Your task: identify up to 5 concrete, actionable issues. Focus on:
- Actual bugs or logic errors
- Security problems (injection, missing auth, path traversal, unvalidated input, etc.)
- Missing error handling that would cause crashes or silent failures
- Missing input validation on API endpoints
- Logging gaps that would make production debugging hard

Severity guide:
- high: causes data loss, security breach, or crashes in production
- medium: incorrect behavior, bad error handling, or security weakness
- low: code quality, logging clarity, minor robustness

Output ONLY a valid JSON array (no prose, no markdown fences, no explanation):
[
  {
    "severity": "high|medium|low",
    "file": "apps/api/src/filename.ts",
    "line": 42,
    "title": "Short title (max 60 chars)",
    "description": "What the issue is and why it matters",
    "suggestion": "Concrete, specific fix"
  }
]"""

    user = "\n\n".join(context_parts)

    print("Analyzing codebase for issues…")
    raw = ask_model(system, user, max_tokens=4000)

    issues = _parse_issues(raw)
    _save_analysis(issues)
    print(f"Analysis saved → automation/ai-suggestions.md ({len(issues)} issues found)")

    return issues


def generate_and_apply_patch(issue: dict) -> bool:
    """
    Phase 2: Ask the model for the complete updated file, diff it locally,
    then apply with git. Avoids all model-generated diff format problems.
    """
    target_file = issue.get("file", "")
    if not target_file:
        print("Issue has no file, skipping patch.")
        return False

    if not (target_file.startswith("apps/api/src/") and target_file.endswith(".ts")):
        print(f"Skipping patch for unsupported file: {target_file}")
        return False

    original = (ROOT / target_file).read_text(encoding="utf-8")
    if not original.strip():
        print(f"File not found or empty: {target_file}")
        return False

    title = issue.get("title", "")
    description = issue.get("description", "")
    suggestion = issue.get("suggestion", "")

    system = f"""\
You are a senior full-stack engineer making a targeted, minimal fix.

Fix exactly this issue in {target_file}:
  Title: {title}
  Problem: {description}
  Fix: {suggestion}

Hard constraints:
- Make the MINIMAL change needed — do not refactor unrelated code
- The fix MUST compile and not break existing behavior
- Do NOT rename, delete, or create any files

Output rules (CRITICAL):
- Return ONLY the complete, corrected file content
- Do NOT include explanations, comments, or markdown fences — just the raw TypeScript"""

    user = f"===== CURRENT FILE: {target_file} =====\n{original}"

    print(f"Generating fix for: [{issue.get('severity','?').upper()}] {title}…")
    raw = ask_model(system, user)
    new_content = _strip_fences(raw)

    if not new_content:
        print("Empty response from model.")
        return False

    # Normalise line endings for comparison
    orig_lines = original.splitlines(keepends=True)
    new_lines = (new_content.rstrip("\n") + "\n").splitlines(keepends=True)

    if orig_lines == new_lines:
        print("Model returned identical content — no changes to apply.")
        return False

    # Generate a proper unified diff locally — no model diff format needed
    diff_lines = list(difflib.unified_diff(
        orig_lines,
        new_lines,
        fromfile=f"a/{target_file}",
        tofile=f"b/{target_file}",
    ))

    if not diff_lines:
        print("difflib found no differences.")
        return False

    patch = f"diff --git a/{target_file} b/{target_file}\n--- a/{target_file}\n+++ b/{target_file}\n"
    patch += "".join(diff_lines[2:])  # skip the --- / +++ lines difflib already added

    patch_file = ROOT / "automation" / "llm.patch"
    patch_file.write_text(patch, encoding="utf-8")

    try:
        run(["git", "apply", "--check", "--ignore-whitespace", str(patch_file)])
    except Exception as e:
        print("Patch failed 'git apply --check':", e)
        print("First 400 chars of patch:")
        print(patch[:400])
        return False

    try:
        run(["git", "apply", "--ignore-whitespace", str(patch_file)])
    except Exception as e:
        print("Failed to apply patch:", e)
        return False

    print("Patch applied successfully.")
    return True


def rollback_changes() -> None:
    """Restore all modified tracked files to HEAD."""
    try:
        run(["git", "checkout", "--", "."])
        print("Changes rolled back to HEAD.")
    except Exception as e:
        print(f"Rollback failed: {e}")


def run_tests() -> bool:
    try:
        run(["pnpm", "test"], check=True)
        return True
    except Exception as e:
        print("Tests failed:", e)
        return False


def create_pr(analysis_summary: str = "") -> None:
    diff = get_git_diff()
    if not diff.strip():
        print("No changes to push, no PR.")
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
    print(f"Pushed branch {branch_name} to origin.")

    if shutil.which("gh") is None:
        print(
            "GitHub CLI 'gh' not found. "
            f"Branch pushed — create a PR manually from '{branch_name}'."
        )
        return

    body_parts = [
        "Automatically generated PR from nightly bot (Ollama + Qwen).",
        "Please review before merging.\n",
    ]
    if analysis_summary:
        body_parts.append("## All Issues Found This Run\n")
        body_parts.append(analysis_summary)

    body = "\n".join(body_parts)

    try:
        subprocess.run(
            ["gh", "pr", "create", "--title", "Nightly bot: automated improvement",
             "--body", body, "--base", "main"],
            cwd=str(ROOT),
            env=env,
            check=True,
        )
        print("PR created.")
    except subprocess.CalledProcessError as e:
        print("Failed to create PR via gh CLI:", e)
        print(f"Branch '{branch_name}' is pushed — create a PR manually on GitHub.")


def main():
    # 1) Require clean working tree
    if working_tree_has_uncommitted_changes(ignore_gitignore=True):
        print("Working tree is not clean (excluding .gitignore) — aborting.")
        return

    # 2) Update main branch
    run(["git", "checkout", "main"])
    run(["git", "pull", "--ff-only"])

    # 3) Run scanners
    print("Running scanners…")
    subprocess.run(
        ["bash", "automation/scanners/run_scanners.sh"],
        cwd=str(ROOT),
        check=False,
    )

    # 4) Phase 1: Analyze codebase, produce ranked issue list + ai-suggestions.md
    issues = analyze_codebase()
    if not issues:
        print("No issues identified — nothing to patch.")
        return

    # Sort by severity and pick the top issue to fix
    severity_order = {"high": 0, "medium": 1, "low": 2}
    issues.sort(key=lambda x: severity_order.get(x.get("severity", "low"), 2))
    top_issue = issues[0]
    print(
        f"\nTop issue [{top_issue.get('severity','?').upper()}]: "
        f"{top_issue.get('title','')} in {top_issue.get('file','')}"
    )

    # Build analysis summary for the PR body
    summary_lines = []
    for issue in issues:
        sev = issue.get("severity", "?").upper()
        title = issue.get("title", "")
        file_ = issue.get("file", "")
        desc = issue.get("description", "")
        summary_lines.append(f"- **[{sev}] {title}** (`{file_}`): {desc}")
    analysis_summary = "\n".join(summary_lines)

    # 5) Phase 2: Generate and apply patch for the top issue
    patched = generate_and_apply_patch(top_issue)
    if not patched:
        print("Could not generate a valid patch. Analysis saved — check ai-suggestions.md.")
        return

    # 6) Run tests; rollback if they fail
    if not run_tests():
        print("Tests failed — rolling back patch.")
        rollback_changes()
        return

    # 7) Open PR with patch + analysis summary
    create_pr(analysis_summary)


if __name__ == "__main__":
    main()
