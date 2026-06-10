#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
AWK="$SCRIPT_DIR/preprocess.awk"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

fail=0
check() {
  local name="$1" expected="$2" actual="$3"
  if [[ "$actual" == "$expected" ]]; then
    printf '  OK  %s\n' "$name"
  else
    printf '  FAIL  %s\n  expected: %q\n  actual:   %q\n' "$name" "$expected" "$actual"
    fail=1
  fi
}

cat > "$TMP/in.md" <<'EOF'
commun avant
<!-- target: claude-ai -->
bloc claude-ai
<!-- /target -->
<!-- target: claude-code -->
bloc claude-code
<!-- /target -->
version {{VERSION}}
EOF

ai="$(awk -v target=claude-ai -v version=1.2.3 -f "$AWK" "$TMP/in.md")"
check "claude-ai garde son bloc"      $'commun avant\nbloc claude-ai\nversion 1.2.3' "$ai"

cc="$(awk -v target=claude-code -v version=1.2.3 -f "$AWK" "$TMP/in.md")"
check "claude-code garde son bloc"    $'commun avant\nbloc claude-code\nversion 1.2.3' "$cc"

nb="$(printf '%s\n' "$ai" | grep -c 'bloc claude-code' || true)"
check "aucun bloc claude-code dans la sortie claude-ai" "0" "$nb"

exit "$fail"
