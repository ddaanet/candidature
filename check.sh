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
  src/SKILL.md
  src/references/profil.md
  src/references/preparation.md
  src/references/soumission.md
  src/references/relecture.md
  src/references/suivi.md
  src/references/backend-write.md
  src/references/notion-setup.md
  src/references/modele-notion.md
  src/references/cover-letter.md
  src/references/adaptation-cv.md
  src/references/etayage.md
  src/references/preparation-entretien.md
  src/references/recruitment-science.md
  src/references/decoupage-relecture.md
  src/references/site-ouverture.md
  src/references/site-ouverture-playwright.md
  src/references/site-cloture.md
  src/references/consolidation.md
  src/references/sites/*.md
)

echo "Contamination de style"

style_errors=0
for f in "${content_files[@]}"; do
  [ -f "$f" ] || continue
  # Tirets cadratins (U+2014)
  if grep -qP '\x{2014}' "$f"; then
    fail "$f contient des tirets cadratins"
    style_errors=$((style_errors + 1))
  fi
  # Tirets demi-cadratins (U+2013)
  if grep -qP '\x{2013}' "$f"; then
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

# --- Preprocesseur ---

echo "Préprocesseur"
if preprocess_output=$(bash build/preprocess.test.sh 2>&1); then
  pass "preprocess.test.sh OK"
else
  fail "preprocess.test.sh a échoué"
  echo "$preprocess_output"
fi

# --- References internes ---

echo "References internes"

ref_errors_before=$errors
for source in src/SKILL.md CLAUDE.md src/references/*.md; do
  [ -f "$source" ] || continue
  for ref in $(grep -oE '(^|[^/])references/[a-z/_-]+\.md' "$source" | grep -oE 'references/[a-z/_-]+\.md' | sort -u); do
    # Les references sont runtime-relatives (references/foo.md). La source
    # canonique vit sous src/, donc verifier l'existence sous src/.
    if [ ! -f "src/$ref" ]; then
      fail "$source reference $ref (introuvable)"
    fi
  done
done

if [ "$errors" -eq "$ref_errors_before" ]; then
  pass "toutes les references internes existent"
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

# --- Derive des artefacts versionnes ---

echo "Dérive des artefacts versionnés"
if git diff --quiet -- skills .claude-plugin/plugin.json; then
  pass "skills/ et plugin.json à jour avec src/"
else
  fail "skills/ ou plugin.json divergent de src/ (lancer ./build/build.sh et committer)"
  git --no-pager diff --stat -- skills .claude-plugin/plugin.json
fi

# --- VERSION ---

echo "Version"

version=$(cat VERSION | tr -d '[:space:]')
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
