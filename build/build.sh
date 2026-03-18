#!/usr/bin/env bash
set -euo pipefail

# Build candidature.skill from the repo sources.
#
# Usage:
#   ./build/build.sh                  — build candidature.skill in dist/
#   ./build/build.sh --release 1.0.0  — build, commit VERSION, tag, release
#
# The .skill is a zip containing:
#   candidature/
#     SKILL.md              — dispatcher (from build/dispatcher.md)
#     references/
#       workflow.md          — repo's SKILL.md without frontmatter + version
#       *.md                 — other reference files

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="$(mktemp -d)"
SKILL_DIR="$BUILD_DIR/candidature"
DIST_DIR="$REPO_DIR/dist"
OUTPUT="$DIST_DIR/candidature.skill"

cleanup() { rm -rf "$BUILD_DIR"; }
trap cleanup EXIT

# --- Resolve version ---

if [[ "${1:-}" == "--release" ]]; then
    VERSION="${2:?Usage: ./build/build.sh --release <major.minor.patch>}"
    if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "❌ Version must be semver (e.g. 1.0.0), got: $VERSION" >&2
        exit 1
    fi
else
    VERSION="dev"
fi

# --- Assemble ---

mkdir -p "$SKILL_DIR/references" "$DIST_DIR"

# Dispatcher as SKILL.md
cp "$SCRIPT_DIR/dispatcher.md" "$SKILL_DIR/SKILL.md"

# Strip YAML frontmatter from SKILL.md → workflow.md, inject version
awk 'BEGIN{n=0} /^---$/{n++; if(n==2){skip=1; next}} skip{print}' \
    "$REPO_DIR/SKILL.md" \
    | sed "/^Mot magique: ddaanet\/candidature$/a\\
Version: $VERSION" \
    > "$SKILL_DIR/references/workflow.md"

# Reference files
for f in "$REPO_DIR"/references/*.md; do
    cp "$f" "$SKILL_DIR/references/"
done

# --- Package ---

(cd "$BUILD_DIR" && zip -r "$OUTPUT" candidature/ -x '*.DS_Store')

echo "✅ $OUTPUT ($VERSION)"

# --- Release (optional) ---

if [[ "$VERSION" != "dev" ]]; then
    TAG="v$VERSION"

    # Write VERSION to repo (single source for remote check)
    echo "$VERSION" > "$REPO_DIR/VERSION"

    cd "$REPO_DIR"
    git add VERSION
    git commit -m "🔖 $VERSION"
    git tag "$TAG"

    echo "📦 Creating release $TAG..."
    gh release create "$TAG" "$OUTPUT" \
        --title "candidature $VERSION" \
        --notes "Build from $(git rev-parse --short HEAD~1)." \
        --latest

    echo "✅ Released: https://github.com/ddaanet/candidature/releases/tag/$TAG"
fi
