#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/build"
ESM_DIR="$BUILD_DIR/esm"
TARGET_DIR="$ROOT_DIR/test/assets"

pushd "$ROOT_DIR" >/dev/null

yarn build.dist

mkdir -p "$TARGET_DIR"

cp "$ESM_DIR/utilities/buildLog.js" "$TARGET_DIR/buildLog.js"

# Ensure chalk is null to mimic production bundling behavior
perl -0pi -e "s/import chalk from 'chalk';/const chalk = null;/" "$TARGET_DIR/buildLog.js"

popd >/dev/null

cd "$ROOT_DIR/test"

(
	sleep 5
	open http://localhost:8000
)&

python3 -m http.server


