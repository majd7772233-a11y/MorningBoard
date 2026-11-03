#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ASSETS_DIR="${ROOT_DIR}/android/app/src/main/assets"

mkdir -p "${ASSETS_DIR}"
find "${ASSETS_DIR}" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +

# Copy the complete static website, excluding Git metadata and this Android project.
while IFS= read -r -d "" source_path; do
    name="$(basename "${source_path}")"
    case "${name}" in .git|.github|android) continue ;; esac
    cp -a "${source_path}" "${ASSETS_DIR}/"
done < <(find "${ROOT_DIR}" -mindepth 1 -maxdepth 1 -print0)

test -s "${ASSETS_DIR}/index.html"
printf "Bundled offline website: "
du -sh "${ASSETS_DIR}" | cut -f1
