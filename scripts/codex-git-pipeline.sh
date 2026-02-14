#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   scripts/codex-git-pipeline.sh -m "feat: message" [--push]
#   scripts/codex-git-pipeline.sh -m "feat: message" --push --remote origin
# Defaults: no push (safe)

MSG=""
DO_PUSH="false"
REMOTE="origin"

while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--message)
      MSG="${2:-}"
      shift 2
      ;;
    --push)
      DO_PUSH="true"
      shift
      ;;
    --remote)
      REMOTE="${2:-origin}"
      shift 2
      ;;
    -h|--help)
      grep '^# ' "$0" | sed 's/^# //'
      exit 0
      ;;
    *)
      echo "Unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$MSG" ]]; then
  echo "Missing commit message. Use -m \"...\"" >&2
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not inside a git repository." >&2
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" == "HEAD" ]]; then
  echo "Detached HEAD detected. Checkout a branch first." >&2
  exit 1
fi

echo "==> git status"
git status --short

echo "==> git add -A"
git add -A

if git diff --cached --quiet; then
  echo "No staged changes. Nothing to commit."
  exit 0
fi

echo "==> git commit"
git commit -m "$MSG"

if [[ "$DO_PUSH" == "true" ]]; then
  echo "==> git push $REMOTE $BRANCH"
  git push "$REMOTE" "$BRANCH"
  echo "Pushed to $REMOTE/$BRANCH"
else
  echo "Commit created on branch '$BRANCH'. Push skipped (use --push)."
fi
