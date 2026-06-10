#!/usr/bin/env bash
set -euo pipefail

# Construit les deux cibles depuis src/ via le préprocesseur :
#   skills/candidature/        cible Claude Code, versionnée, lue depuis le cache plugin
#   .claude-plugin/plugin.json manifeste plugin, versionné
#   dist/candidature.skill     cible Claude.ai, zip non versionné, release GitHub
#   dist/candidature-dev.skill stub dev Claude.ai, non versionné
#
# Usage :
#   ./build/build.sh                  construit les deux cibles à la version courante
#   ./build/build.sh --bump patch     construit, incrémente, tague, release
#   ./build/build.sh --bump minor       (seul candidature.skill est releasé)
#   ./build/build.sh --bump major

PACKAGE="ddaanet/candidature"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SRC_DIR="$REPO_DIR/src"
PREPROCESS="$SCRIPT_DIR/preprocess.awk"
SKILLS_DIR="$REPO_DIR/skills/candidature"
PLUGIN_JSON="$REPO_DIR/.claude-plugin/plugin.json"
DIST_DIR="$REPO_DIR/dist"
BUILD_DIR="$(mktemp -d)"
trap 'rm -rf "$BUILD_DIR"' EXIT

read_version() {
    local raw
    raw="$(cat "$REPO_DIR/VERSION")"
    if [[ "$raw" =~ $PACKAGE\ ([0-9]+\.[0-9]+\.[0-9]+) ]]; then
        echo "${BASH_REMATCH[1]}"
    else
        echo "VERSION file format invalid, expected: $PACKAGE X.Y.Z" >&2
        exit 1
    fi
}

write_version() {
    echo "$PACKAGE $1" > "$REPO_DIR/VERSION"
}

# Compile un arbre src/ (SKILL.md + references/) vers un répertoire de sortie.
# $1 cible, $2 répertoire de sortie. Préserve la hiérarchie references/sites/.
process_skill_tree() {
    local target="$1" out="$2" f rel
    mkdir -p "$out"
    awk -v target="$target" -v version="$VERSION" -f "$PREPROCESS" "$SRC_DIR/SKILL.md" > "$out/SKILL.md"
    while IFS= read -r -d '' f; do
        rel="${f#"$SRC_DIR"/}"
        mkdir -p "$out/$(dirname "$rel")"
        awk -v target="$target" -v version="$VERSION" -f "$PREPROCESS" "$f" > "$out/$rel"
    done < <(find "$SRC_DIR/references" -name '*.md' -print0)
}

# --- Résolution de la version ---
# Sans --bump on construit à la version courante (artefacts versionnés
# déterministes, exigé par le garde-fou de dérive de check.sh).

if [[ "${1:-}" == "--bump" ]]; then
    BUMP="${2:?Usage: ./build/build.sh --bump major|minor|patch}"
    CURRENT="$(read_version)"
    IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
    case "$BUMP" in
        major) VERSION="$((MAJOR + 1)).0.0" ;;
        minor) VERSION="$MAJOR.$((MINOR + 1)).0" ;;
        patch) VERSION="$MAJOR.$MINOR.$((PATCH + 1))" ;;
        *) echo "bump must be major, minor, or patch, got: $BUMP" >&2; exit 1 ;;
    esac
    write_version "$VERSION"
else
    VERSION="$(read_version)"
fi

# --- Cible Claude Code (versionnée) ---
# Pas de scripts/version_check.py : la vérification de version est supprimée
# sur Claude Code (mises à jour gérées par la marketplace).

rm -rf "$SKILLS_DIR"
process_skill_tree claude-code "$SKILLS_DIR"

mkdir -p "$(dirname "$PLUGIN_JSON")"
awk -v target=claude-code -v version="$VERSION" -f "$PREPROCESS" "$SRC_DIR/plugin.json.tmpl" > "$PLUGIN_JSON"
echo "$SKILLS_DIR ($VERSION)"

# --- Cible Claude.ai (.skill, non versionnée) ---

mkdir -p "$DIST_DIR"
CAND_DIR="$BUILD_DIR/candidature"
CAND_OUTPUT="$DIST_DIR/candidature.skill"

process_skill_tree claude-ai "$CAND_DIR"
mkdir -p "$CAND_DIR/scripts"
cp "$SRC_DIR/scripts/version_check.py" "$CAND_DIR/scripts/"

(cd "$BUILD_DIR" && zip -rq "$CAND_OUTPUT" candidature/ -x '*.DS_Store')
echo "$CAND_OUTPUT ($VERSION)"

# --- Stub dev Claude.ai (non versionné) ---

DEV_DIR="$BUILD_DIR/candidature-dev"
DEV_OUTPUT="$DIST_DIR/candidature-dev.skill"
mkdir -p "$DEV_DIR"
cp "$SCRIPT_DIR/dev-stub.md" "$DEV_DIR/SKILL.md"
(cd "$BUILD_DIR" && zip -rq "$DEV_OUTPUT" candidature-dev/ -x '*.DS_Store')
echo "$DEV_OUTPUT (dev stub)"

# --- Release (optionnelle, candidature.skill uniquement) ---

if [[ "${1:-}" == "--bump" ]]; then
    TAG="v$VERSION"
    cd "$REPO_DIR"
    git add VERSION skills .claude-plugin/plugin.json
    # Le hook commit-msg gitmoji réécrit le préfixe release: en 🔖.
    git commit -m "release: v$VERSION"
    git tag "$TAG"
    git push origin main --tags
    echo "Creating release $TAG..."
    gh release create "$TAG" "$CAND_OUTPUT" \
        --title "candidature $VERSION" \
        --notes "Build from $(git rev-parse --short HEAD)." \
        --latest
    echo "Released: https://github.com/ddaanet/candidature/releases/tag/$TAG"
fi
