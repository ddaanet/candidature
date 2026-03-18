#!/usr/bin/env bash
set -euo pipefail

# Build candidature.skill from the repo sources.
#
# Usage:
#   ./build/build.sh                  — build candidature.skill in dist/
#   ./build/build.sh --release 1.0.0  — build + create GitHub release v1.0.0
#
# The .skill is a zip containing:
#   candidature/
#     SKILL.md              — dispatcher (from build/dispatcher.md)
#     references/
#       workflow.md          — repo's SKILL.md without frontmatter
#       cover-letter.md
#       cv-handling.md
#       feedback-tracking.md
#       interview-prep.md
#       recruitment-science.md
#       review-items.md

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="$(mktemp -d)"
SKILL_DIR="$BUILD_DIR/candidature"
DIST_DIR="$REPO_DIR/dist"
OUTPUT="$DIST_DIR/candidature.skill"

cleanup() { rm -rf "$BUILD_DIR"; }
trap cleanup EXIT

# --- Assemble ---

mkdir -p "$SKILL_DIR/references" "$DIST_DIR"

# Dispatcher as SKILL.md
cp "$SCRIPT_DIR/dispatcher.md" "$SKILL_DIR/SKILL.md"

# Strip YAML frontmatter from SKILL.md → workflow.md
awk 'BEGIN{n=0} /^---$/{n++; if(n==2){skip=1; next}} skip{print}' \
    "$REPO_DIR/SKILL.md" > "$SKILL_DIR/references/workflow.md"

# Reference files
for f in "$REPO_DIR"/references/*.md; do
    cp "$f" "$SKILL_DIR/references/"
done

# --- Package ---

(cd "$BUILD_DIR" && zip -r "$OUTPUT" candidature/ -x '*.DS_Store')

echo "✅ $OUTPUT"

# --- Release (optional) ---

if [[ "${1:-}" == "--release" ]]; then
    VERSION="${2:?Usage: ./build/build.sh --release <major.minor.patch>}"

    # Validate semver format
    if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo "❌ Version must be semver (e.g. 1.0.0), got: $VERSION" >&2
        exit 1
    fi

    TAG="v$VERSION"

    echo "📦 Creating release $TAG..."
    cd "$REPO_DIR"
    gh release create "$TAG" "$OUTPUT" \
        --title "candidature $VERSION" \
        --notes "Build from $(git rev-parse --short HEAD)." \
        --latest

    echo "✅ Released: https://github.com/ddaanet/candidature/releases/tag/$TAG"
fi
