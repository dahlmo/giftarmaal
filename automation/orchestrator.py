#!/usr/bin/env python3
import os
import json
import subprocess
from pathlib import Path
from typing import List
import threading
import textwrap

from openai import OpenAI

ROOT = Path(__file__).resolve().parents[1]
REPORT_DIR = ROOT / "automation" / "reports"

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_API_KEY = os.environ.get("OLLAMA_API_KEY", "ollama")
MODEL = os.environ.get("MODEL_NAME", "qwen2.5-coder:32b")

GH_TOKEN = os.environ.get("GITHUB_TOKEN")
REPO_SLUG = os.environ.get("REPO_SLUG")

# Test-flagg: hvis satt, bruker vi en hardkodet diff i stedet for LLM
FAST_MODE = os.getenv("FAST_MODE") == "1"

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
    lines = diff.splitlines()

    filtered_lines = []
    skip_block = False

    for line in lines:
        if line.startswith("diff --git "):
            # start på ny fil-blokk: finn ut om dette gjelder .gitignore
            skip_block = " a/.gitignore " in line or " b/.gitignore " in line

        if not skip_block:
            filtered_lines.append(line)

    return "\n".join(filtered_lines)


def get_file_content(path: str) -> str:
    p = ROOT / path
    if not p.exists():
        return ""
    return p.read_text(encoding="utf-8", errors="ignore")


def ask_model(system: str, user: str, timeout_seconds: int = 5) -> str:
    # Rask test-modus: hopp over LLM og returner en enkel, gyldig git-diff
    if FAST_MODE:
        patch = textwrap.dedent(
            """\
            diff --git a/automation/NIGHTLY_TEST.txt b/automation/NIGHTLY_TEST.txt
            new file mode 100644
            index 0000000..1111111
            --- /dev/null
            +++ b/automation/NIGHTLY_TEST.txt
            @@ -0,0 +1,3 @@
            +Nightly bot test file.
            +Safe to delete.
            +Generated in FAST_MODE.
            """
        )
        return patch

    result = {"content": None, "error": None}

    def worker():
        try:
            resp = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=0.2,
                max_tokens=2048,
            )
            result["content"] = resp.choices[0].message.content or ""
        except Exception as e:
            result["error"] = e

    thread = threading.Thread(target=worker)
    thread.start()
    thread.join(timeout_seconds)

    if thread.is_alive():
        print(f"[LLM] Timeout etter {timeout_seconds} sekunder — avbryter kall.")
        return ""

    if result["error"]:
        print("[LLM] Modell-feil:", repr(result["error"]))
        return ""

    print(f"[LLM] Fikk respons ({len(result['content'])} bytes)")
    return result["content"] or ""


def generate_and_apply_patches():
    reports_text = load_reports()
    if not reports_text.strip():
        print("Ingen rapporter å jobbe med.")
        return

    system = """
Du er en senior fullstack-utvikler. Du får:
- rapporter fra code scanners
- relevante kodefiler

Jobb:
- Finn 1–3 konkrete, små forbedringer (security, bug, klarhet) å fikse i denne runden.
- Generer EN samlet 'git diff' patch i unified diff-format.
- Patchen må være minimal, men kompilere/kjøre.
- Endre kun eksisterende filer – ikke legg til eller slett filer.
- Ingen forklaring, bare ren diff.
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

    print("Sender til modell…")
    patch = ask_model(system, user)
    if "diff --git" not in patch:
        print("Fikk ikke diff tilbake, skipper.")
        return

    patch_file = ROOT / "automation" / "llm.patch"
    patch_file.write_text(patch, encoding="utf-8")

    try:
        run(["git", "apply", str(patch_file)])
    except Exception as e:
        print("Klarte ikke å apply patch:", e)
        return

    print("Patch appliert.")


def run_tests() -> bool:
    try:
        run(["pnpm", "test"], check=True)
        return True
    except Exception as e:
        print("Tester feilet:", e)
        return False


def create_pr():
    diff = get_git_diff()
    if not diff.strip():
        print("Ingen endringer etter patch, ingen PR.")
        return

    branch_name = "bot/nightly-" + run(
        ["date", "+%Y%m%d-%H%M%S"], check=False
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

    title = "Nightly bot: små forbedringer"
    body = (
        "Automatisk generert PR fra nattlig bot (Ollama + Qwen). "
        "Vennligst review før merge."
    )

    subprocess.run(
        ["gh", "pr", "create", "--title", title, "--body", body, "--base", "main"],
        cwd=str(ROOT),
        env=env,
        check=True,
    )
    print("PR opprettet.")


def main():
    # 1) sørg for clean working tree før vi starter
    if get_git_diff().strip():
        print("Working tree er ikke clean – avbryter.")
        return

    # 2) oppdater main
    run(["git", "checkout", "main"])
    run(["git", "pull", "--ff-only"])

    # 3) kjør scannere
    print("Kjører scannere…")
    subprocess.run(
        ["bash", "automation/scanners/run_scanners.sh"],
        cwd=str(ROOT),
        check=False,
    )

    # 4) generer og apply patches
    generate_and_apply_patches()

    # 5) kjør tester
    if not run_tests():
        print("Endringer men tester feilet – ingen PR.")
        return

    # 6) lag PR
    create_pr()


if __name__ == "__main__":
    main()