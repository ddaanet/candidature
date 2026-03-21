#!/usr/bin/env bash
set -euo pipefail

# Build candidature.skill and candidate-desktop.skill from the repo sources.
#
# Usage:
#   ./build/build.sh                  — build both .skill in dist/
#   ./build/build.sh --bump patch     — build, bump version, tag, release
#   ./build/build.sh --bump minor
#   ./build/build.sh --bump major

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="$(mktemp -d)"
DIST_DIR="$REPO_DIR/dist"

cleanup() { rm -rf "$BUILD_DIR"; }
trap cleanup EXIT

# --- Resolve version ---

if [[ "${1:-}" == "--bump" ]]; then
    BUMP="${2:?Usage: ./build/build.sh --bump major|minor|patch}"
    CURRENT="$(cat "$REPO_DIR/VERSION" 2>/dev/null || echo "0.0.0")"
    IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
    case "$BUMP" in
        major) VERSION="$((MAJOR + 1)).0.0" ;;
        minor) VERSION="$MAJOR.$((MINOR + 1)).0" ;;
        patch) VERSION="$MAJOR.$MINOR.$((PATCH + 1))" ;;
        *) echo "❌ bump must be major, minor, or patch, got: $BUMP" >&2; exit 1 ;;
    esac
else
    VERSION="dev"
fi

# --- Shared assembly helpers ---

# Strip YAML frontmatter from SKILL.md, inject version → workflow.md
make_workflow() {
    local dest="$1"
    awk 'BEGIN{n=0} /^---$/{n++; if(n==2){skip=1; next}} skip{print}' \
        "$REPO_DIR/SKILL.md" \
        | sed "/^Mot magique: ddaanet\/candidature$/a\\
Version: $VERSION" \
        > "$dest"
}

# Copy shared reference files
copy_shared_refs() {
    local dest="$1"
    for f in "$REPO_DIR"/references/*.md; do
        cp "$f" "$dest/"
    done
}

mkdir -p "$DIST_DIR"

# --- Build candidature.skill ---

CAND_DIR="$BUILD_DIR/candidature"
CAND_OUTPUT="$DIST_DIR/candidature.skill"

mkdir -p "$CAND_DIR/references"
cp "$SCRIPT_DIR/dispatcher.md" "$CAND_DIR/SKILL.md"
make_workflow "$CAND_DIR/references/workflow.md"
copy_shared_refs "$CAND_DIR/references"

(cd "$BUILD_DIR" && zip -r "$CAND_OUTPUT" candidature/ -x '*.DS_Store')
echo "✅ $CAND_OUTPUT ($VERSION)"

# --- Build candidate-desktop.skill ---

DESK_DIR="$BUILD_DIR/candidate-desktop"
DESK_OUTPUT="$DIST_DIR/candidate-desktop.skill"

mkdir -p "$DESK_DIR/references/sites"
cp "$REPO_DIR/desktop/SKILL.md" "$DESK_DIR/SKILL.md"
make_workflow "$DESK_DIR/references/workflow.md"
copy_shared_refs "$DESK_DIR/references"
cp "$REPO_DIR/desktop/references/consolidation.md" "$DESK_DIR/references/"
for f in "$REPO_DIR"/desktop/references/sites/*.md; do
    cp "$f" "$DESK_DIR/references/sites/"
done

(cd "$BUILD_DIR" && zip -r "$DESK_OUTPUT" candidate-desktop/ -x '*.DS_Store')
echo "✅ $DESK_OUTPUT ($VERSION)"

# --- Release (optional) ---

if [[ "$VERSION" != "dev" ]]; then
    TAG="v$VERSION"

    echo "$VERSION" > "$REPO_DIR/VERSION"

    cd "$REPO_DIR"
    git add VERSION
    git commit -m "🔖 $VERSION"
    git tag "$TAG"
    git push github main --tags

    echo "📦 Creating release $TAG..."
    gh release create "$TAG" "$CAND_OUTPUT" "$DESK_OUTPUT" \
        --title "candidature $VERSION" \
        --notes "Build from $(git rev-parse --short HEAD)." \
        --latest

    echo "✅ Released: https://github.com/ddaanet/candidature/releases/tag/$TAG"
fi
