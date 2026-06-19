#!/usr/bin/env bash
set -euo pipefail

# Assemble le plugin Claude Code depuis src/ via le préprocesseur :
#   skills/candidature/   contenu versionné, lu depuis le cache plugin
#
# La version est lue depuis .claude-plugin/plugin.json, la source de vérité.
# Le manifeste n'est plus généré ici, et le build ne tague plus : la release
# passe par `just release {patch|minor|major}` (toolkit plugin-dev).
#
# Usage :
#   ./build/build.sh   assemble skills/candidature/ à la version du manifeste

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC_DIR="$REPO_DIR/src"
PREPROCESS="$SCRIPT_DIR/preprocess.awk"
SKILLS_DIR="$REPO_DIR/skills/candidature"
PLUGIN_JSON="$REPO_DIR/.claude-plugin/plugin.json"

VERSION="$(jq -r .version "$PLUGIN_JSON")"

# Compile un arbre src/ (SKILL.md + references/) vers un répertoire de sortie.
# $1 répertoire de sortie. Préserve la hiérarchie references/sites/.
process_skill_tree() {
    local out="$1" f rel
    mkdir -p "$out"
    awk -v version="$VERSION" -f "$PREPROCESS" "$SRC_DIR/SKILL.md" > "$out/SKILL.md"
    while IFS= read -r -d '' f; do
        rel="${f#"$SRC_DIR"/}"
        mkdir -p "$out/$(dirname "$rel")"
        awk -v version="$VERSION" -f "$PREPROCESS" "$f" > "$out/$rel"
    done < <(find "$SRC_DIR/references" -name '*.md' -print0)
}

# --- Cible Claude Code (versionnée) ---
# Le dispatcher invoque les scripts d'outillage par leur chemin sous ce
# skill, ils sont donc embarqués dans skills/candidature/scripts/. Aucun
# script de vérification de version, les mises à jour passent par la marketplace.

rm -rf "$SKILLS_DIR"
process_skill_tree "$SKILLS_DIR"

mkdir -p "$SKILLS_DIR/scripts"
cp "$SRC_DIR/scripts/init_repo.py" "$SRC_DIR/scripts/validate.py" "$SKILLS_DIR/scripts/"

echo "$SKILLS_DIR ($VERSION)"
