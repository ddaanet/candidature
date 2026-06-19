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
ligne commune
version {{VERSION}}
deux fois {{VERSION}} et {{VERSION}}
EOF

out="$(awk -v version=1.2.3 -f "$AWK" "$TMP/in.md")"
check "substitution simple de version" $'ligne commune\nversion 1.2.3\ndeux fois 1.2.3 et 1.2.3' "$out"

nb="$(printf '%s\n' "$out" | grep -c '{{VERSION}}' || true)"
check "aucun marqueur {{VERSION}} résiduel" "0" "$nb"

exit "$fail"
