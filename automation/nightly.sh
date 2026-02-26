#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export OLLAMA_BASE_URL="http://localhost:11434"
export OLLAMA_API_KEY="ollama"
export MODEL_NAME="qwen2.5-coder:32b"

./automation/orchestrator.py