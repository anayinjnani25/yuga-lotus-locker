#!/usr/bin/env sh
# Builds the site and publishes dist/ to the gh-pages branch (served by GitHub Pages).
set -e
npm run build
cd dist
touch .nojekyll
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Deploy site build"
git push -f -q "$(git -C .. remote get-url origin)" gh-pages
rm -rf .git
echo "Deployed. Live in about a minute at https://anayinjnani25.github.io/yuga-lotus-locker/"
