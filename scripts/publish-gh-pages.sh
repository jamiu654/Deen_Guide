#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/publish-gh-pages.sh
# Creates an orphan gh-pages branch and force-pushes the current working tree.

BRANCH=gh-pages
REMOTE=${1:-origin}

echo "Building and publishing to ${REMOTE}/${BRANCH}..."

git add -A
git commit -m "Prepare site for deployment" || true

git checkout --orphan ${BRANCH}
git reset --soft
git commit -m "Deploy static site"
git push -f ${REMOTE} ${BRANCH}
git checkout -f -

echo "Deployed to ${REMOTE}/${BRANCH}." 
