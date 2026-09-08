#!/usr/bin/env bash
set -euo pipefail

# Assemble le plugin Claude Code depuis src/ :
#   skills/candidature/   contenu versionné, lu depuis le cache plugin
#
# Copie pure, sans transformation. L'artefact ne porte plus de numéro de
# version : il dérivait à chaque release, la version vit dans
# .claude-plugin/plugin.json, la source de vérité. Le manifeste n'est pas
# généré ici, et le build ne tague pas : la release passe par
# `just release {patch|minor|major}` (toolkit plugin-dev).
#
# Usage :
#   ./build/build.sh   assemble skills/candidature/

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC_DIR="$REPO_DIR/src"
SKILLS_DIR="$REPO_DIR/skills/candidature"

# Copie un arbre src/ (SKILL.md + references/) vers un répertoire de sortie.
# $1 répertoire de sortie. Préserve la hiérarchie references/sites/.
process_skill_tree() {
    local out="$1" f rel
    mkdir -p "$out"
    cp "$SRC_DIR/SKILL.md" "$out/SKILL.md"
    while IFS= read -r -d '' f; do
        rel="${f#"$SRC_DIR"/}"
        mkdir -p "$out/$(dirname "$rel")"
        cp "$f" "$out/$rel"
    done < <(find "$SRC_DIR/references" -name '*.md' -print0)
}

# --- Cible Claude Code (versionnée) ---
# Le dispatcher invoque les scripts d'outillage par leur chemin sous ce
# skill, ils sont donc embarqués dans skills/candidature/scripts/. Aucun
# script de vérification de version, les mises à jour passent par la marketplace.

rm -rf "$SKILLS_DIR"
process_skill_tree "$SKILLS_DIR"

mkdir -p "$SKILLS_DIR/scripts"
cp "$SRC_DIR/scripts/init_repo.py" "$SRC_DIR/scripts/validate.py" "$SRC_DIR/scripts/dispatch.py" "$SKILLS_DIR/scripts/"

echo "$SKILLS_DIR"
