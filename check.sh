#!/usr/bin/env bash
set -euo pipefail

# Verifications qualite pour le repo candidature.
# Utilise par le preflight avant release.

REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO_DIR"

errors=0
warnings=0

pass() { printf '  OK  %s\n' "$1"; }
fail() { printf '  FAIL  %s\n' "$1"; errors=$((errors + 1)); }
warn() { printf '  WARN  %s\n' "$1"; warnings=$((warnings + 1)); }

# --- Fichiers de contenu (ceux qui contaminent la sortie de l'agent) ---

content_files=(
  SKILL.md
  references/cover-letter.md
  references/cv-handling.md
  references/etayage.md
  references/feedback-tracking.md
  references/interview-prep.md
  references/recruitment-science.md
  references/review-items.md
  references/browser-layer.md
  references/consolidation.md
  references/sites/*.md
)

echo "Contamination de style"

style_errors=0
for f in "${content_files[@]}"; do
  [ -f "$f" ] || continue
  # Tirets cadratins (U+2014)
  if grep -qP '\x{2014}' "$f" 2>/dev/null; then
    fail "$f contient des tirets cadratins"
    style_errors=$((style_errors + 1))
  fi
  # Tirets demi-cadratins (U+2013)
  if grep -qP '\x{2013}' "$f" 2>/dev/null; then
    fail "$f contient des tirets demi-cadratins"
    style_errors=$((style_errors + 1))
  fi
  # Points-virgules
  if grep -q ';' "$f"; then
    fail "$f contient des points-virgules"
    style_errors=$((style_errors + 1))
  fi
  # Gras markdown (le modele ne voit pas le formatage, ca contamine la sortie)
  if grep -q '[*][*]' "$f"; then
    fail "$f contient du gras markdown (**)"
    style_errors=$((style_errors + 1))
  fi
done

if [ "$style_errors" -eq 0 ]; then
  pass "aucun marqueur de contamination dans ${#content_files[@]} fichiers"
fi

# --- References internes ---

echo "References internes"

ref_errors_before=$errors
for source in SKILL.md CLAUDE.md; do
  [ -f "$source" ] || continue
  for ref in $(grep -oE 'references/[a-z/_-]+\.md' "$source" 2>/dev/null | sort -u); do
    if [ ! -f "$ref" ]; then
      fail "$source reference $ref (introuvable)"
    fi
  done
done

if [ "$errors" -eq "$ref_errors_before" ]; then
  pass "toutes les references de SKILL.md et CLAUDE.md existent"
fi

# --- Build ---

echo "Build"

if build_output=$(./build/build.sh 2>&1); then
  pass "build.sh OK"
else
  fail "build.sh a echoue"
  echo "$build_output"
fi

if [ -f dist/candidature.skill ]; then
  pass "candidature.skill genere"
else
  fail "candidature.skill absent apres build"
fi

if [ -f dist/candidature-dev.skill ]; then
  pass "candidature-dev.skill genere"
else
  fail "candidature-dev.skill absent apres build"
fi

# --- VERSION ---

echo "Version"

version=$(cat VERSION 2>/dev/null | tr -d '[:space:]')
if [ -z "$version" ]; then
  fail "VERSION vide ou absent"
else
  pass "VERSION = $version"
fi

# --- Resume ---

echo ""
if [ "$errors" -gt 0 ]; then
  echo "ECHEC  $errors erreur(s), $warnings avertissement(s)"
  exit 1
elif [ "$warnings" -gt 0 ]; then
  echo "WARN  0 erreur, $warnings avertissement(s)"
  exit 0
else
  echo "OK  Tout est vert"
  exit 0
fi
