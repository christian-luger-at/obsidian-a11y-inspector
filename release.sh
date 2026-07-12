#!/usr/bin/env bash
set -euo pipefail

PUBLISH=false
NOTES=""
BUMP=""

while [[ $# -gt 0 ]]; do
	case "$1" in
		--publish|-p)
			PUBLISH=true
			shift
			;;
		--notes)
			NOTES="${2:-}"
			shift 2
			;;
		--bump)
			BUMP="${2:-}"
			shift 2
			;;
		*)
			echo "Unknown option: $1" >&2
			exit 1
			;;
	esac
done

# --- Bump the version (optional) --------------------------------------------

if [[ -n "$BUMP" ]]; then
	if [[ "$BUMP" != "patch" && "$BUMP" != "minor" && "$BUMP" != "major" ]]; then
		echo "Error: --bump must be one of: patch, minor, major" >&2
		exit 1
	fi

	if [[ -n "$(git status --porcelain)" ]]; then
		echo "Error: working tree has uncommitted changes. Commit or stash them before bumping the version." >&2
		exit 1
	fi

	npm version "$BUMP" --no-git-tag-version

	NEW_VERSION=$(node -e "console.log(require('./manifest.json').version)")
	git add package.json package-lock.json manifest.json versions.json
	git commit -m "chore: bump version to v${NEW_VERSION}"
	echo "Bumped version to v${NEW_VERSION}"
fi

# Read version from manifest.json (reflects any --bump applied above)
VERSION=$(node -e "console.log(require('./manifest.json').version)")

TAG="${VERSION}"
RELEASE_DIR="releases/v${VERSION}"

echo "Building A11y Inspector ${VERSION}..."

# Build production bundle
npm run build

# Create release directory
mkdir -p "$RELEASE_DIR"

# Copy required Obsidian plugin files
cp main.js          "$RELEASE_DIR/main.js"
cp manifest.json    "$RELEASE_DIR/manifest.json"
cp styles.css       "$RELEASE_DIR/styles.css"

echo ""
echo "Release ready: $RELEASE_DIR"
echo "  $(du -sh "$RELEASE_DIR" | cut -f1)  total"
ls -lh "$RELEASE_DIR"

if [[ "$PUBLISH" != "true" ]]; then
	echo ""
	echo "Local build only. Re-run with --publish to also tag, push, and create a GitHub release."
	exit 0
fi

# --- Publish to GitHub (optional) -------------------------------------------

echo ""
echo "Preparing to publish ${TAG} to GitHub..."

if ! command -v gh &> /dev/null; then
	echo "Error: GitHub CLI ('gh') is not installed. Install it from https://cli.github.com/ and try again." >&2
	exit 1
fi

if ! gh auth status &> /dev/null; then
	echo "Error: 'gh' is not authenticated. Run 'gh auth login' and try again." >&2
	exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
	echo "Error: working tree has uncommitted changes. Commit the version bump first." >&2
	exit 1
fi

if git rev-parse "$TAG" &> /dev/null; then
	echo "Error: tag '$TAG' already exists." >&2
	exit 1
fi

if [[ -z "$NOTES" ]]; then
	PREV_TAG=$(git describe --tags --abbrev=0 2>/dev/null || true)
	RANGE="HEAD"
	[[ -n "$PREV_TAG" ]] && RANGE="${PREV_TAG}..HEAD"

	SUBJECTS=$(git log "$RANGE" --no-merges --pretty='%s' || true)
	FEATS=$(printf '%s\n' "$SUBJECTS" | sed -n -E 's/^feat(\([^)]*\))?(!)?: /- /p' || true)
	FIXES=$(printf '%s\n' "$SUBJECTS" | sed -n -E 's/^fix(\([^)]*\))?(!)?: /- /p' || true)
	OTHERS=$(printf '%s\n' "$SUBJECTS" \
		| { grep -vE '^(feat|fix|chore|ci|test|docs|style|refactor|build|perf)(\([^)]*\))?(!)?: ' || true; } \
		| sed '/^$/d; s/^/- /')

	NOTES=""
	[[ -n "$FEATS"  ]] && NOTES+="### Features"$'\n'"$FEATS"$'\n\n'
	[[ -n "$FIXES"  ]] && NOTES+="### Fixes"$'\n'"$FIXES"$'\n\n'
	[[ -n "$OTHERS" ]] && NOTES+="### Other"$'\n'"$OTHERS"$'\n\n'

	[[ -z "$NOTES" ]] && NOTES="Release ${TAG}"

	echo ""
	echo "Auto-generated release notes:"
	echo "-----------------------------"
	printf '%s\n' "$NOTES"
	echo "-----------------------------"
fi

read -r -p "Publish ${TAG} to GitHub? This will push a tag and create a public release. [y/N] " CONFIRM
if [[ "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
	echo "Aborted. Local build in $RELEASE_DIR was kept; nothing was pushed."
	exit 0
fi

git tag "$TAG"
git push origin HEAD --tags

gh release create "$TAG" \
	"$RELEASE_DIR/main.js" \
	"$RELEASE_DIR/manifest.json" \
	"$RELEASE_DIR/styles.css" \
	--title "$TAG" \
	--notes "$NOTES"

echo ""
echo "Published ${TAG} to GitHub."
