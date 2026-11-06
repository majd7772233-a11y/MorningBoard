#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ASSETS_DIR="$ROOT_DIR/android/app/src/main/assets"
VENDOR_DIR="$ASSETS_DIR/vendor"

mkdir -p "$ASSETS_DIR"
find "$ASSETS_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +

# Package the full website tree. Only repository/build metadata is excluded.
while IFS= read -r -d "" source_path; do
    name="$(basename "$source_path")"
    case "$name" in
        .git|.github|.gitignore|android|.DS_Store) continue ;;
    esac
    cp -a "$source_path" "$ASSETS_DIR/"
done < <(find "$ROOT_DIR" -mindepth 1 -maxdepth 1 -print0)

mkdir -p "$VENDOR_DIR"
FIREBASE_VERSION="10.12.2"
FIREBASE_BASE="https://www.gstatic.com/firebasejs/$FIREBASE_VERSION"

# Firebase SDK JavaScript ships inside the APK; Firebase data/API requests remain online.
for sdk in firebase-app-compat firebase-auth-compat firebase-database-compat; do
    curl --fail --location --silent --show-error --retry 3 \
        "$FIREBASE_BASE/$sdk.js" \
        --output "$VENDOR_DIR/$sdk.js"
    test -s "$VENDOR_DIR/$sdk.js"
done

# Bundle Google Fonts and all referenced WOFF2 files so the UI does not need font CDNs.
python3 - "$ASSETS_DIR" <<'PY'
from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path
from urllib.parse import urlparse
from urllib.request import Request, urlopen

assets = Path(sys.argv[1])
vendor = assets / "vendor"
font_dir = vendor / "fonts"
font_dir.mkdir(parents=True, exist_ok=True)

user_agent = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
)

font_stylesheets = {
    "morningboard-fonts.css": (
        "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900"
        "&family=Tajawal:wght@400;500;700;800&family=Outfit:wght@300;400;500;600;700"
        "&display=swap"
    ),
    "amiri-fonts.css": (
        "https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Amiri:wght@400;700&display=swap"
    ),
}

downloaded: dict[str, str] = {}

def fetch(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": user_agent})
    with urlopen(request, timeout=45) as response:
        data = response.read()
    if not data:
        raise RuntimeError(f"Empty download: {url}")
    return data

font_url_pattern = re.compile(
    r"url\((?:['\"])?(https://fonts\.gstatic\.com/[^)'\"]+)(?:['\"])?\)"
)

for stylesheet_name, stylesheet_url in font_stylesheets.items():
    css = fetch(stylesheet_url).decode("utf-8")
    urls = font_url_pattern.findall(css)
    if not urls:
        raise RuntimeError(f"No downloadable font files found in {stylesheet_name}")

    for url in urls:
        if url not in downloaded:
            suffix = Path(urlparse(url).path).suffix or ".woff2"
            filename = hashlib.sha256(url.encode("utf-8")).hexdigest()[:20] + suffix
            (font_dir / filename).write_bytes(fetch(url))
            downloaded[url] = f"fonts/{filename}"

    css = font_url_pattern.sub(
        lambda match: f"url('{downloaded[match.group(1)]}')",
        css,
    )
    if "https://" in css or "http://" in css:
        raise RuntimeError(f"External font URL remained in {stylesheet_name}")
    (vendor / stylesheet_name).write_text(css, encoding="utf-8")

# Modify only the generated APK copy. The deployed website's source files remain untouched.
index_path = assets / "index.html"
index = index_path.read_text(encoding="utf-8")

firebase_files = {
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js": "vendor/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js": "vendor/firebase-auth-compat.js",
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js": "vendor/firebase-database-compat.js",
}
for remote, local in firebase_files.items():
    if index.count(remote) != 1:
        raise RuntimeError(f"Expected exactly one Firebase SDK reference: {remote}")
    index = index.replace(remote, local)

amiri_url = (
    "https://fonts.googleapis.com/css2?family=Amiri+Quran&family=Amiri:wght@400;700&display=swap"
)
if index.count(amiri_url) != 1:
    raise RuntimeError("Expected one Amiri Google Fonts stylesheet reference")
index = index.replace(amiri_url, "vendor/amiri-fonts.css")

# Remove CDN preconnect hints from the APK copy.
index = re.sub(
    r"<link\b(?=[^>]*\brel=['\"](?:preconnect|dns-prefetch)['\"])(?=[^>]*fonts\.(?:googleapis|gstatic)\.com)[^>]*>\s*",
    "",
    index,
    flags=re.IGNORECASE,
)

# The Android APK is already its offline app shell; it does not need a PWA service worker.
index, sw_count = re.subn(
    r"<script\b[^>]*>.*?navigator\.serviceWorker\.register\s*\(\s*['\"]\.\/sw\.js['\"].*?</script>",
    "",
    index,
    count=1,
    flags=re.IGNORECASE | re.DOTALL,
)
if sw_count != 1:
    raise RuntimeError("Could not remove the PWA service-worker registration from the APK copy")

index_path.write_text(index, encoding="utf-8")

css_path = assets / "styles.css"
css = css_path.read_text(encoding="utf-8")
remote_import = (
    "@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900"
    "&family=Tajawal:wght@400;500;700;800&family=Outfit:wght@300;400;500;600;700&display=swap');"
)
if css.count(remote_import) != 1:
    raise RuntimeError("Expected exactly one main Google Fonts import in styles.css")
css = css.replace(remote_import, "@import url('vendor/morningboard-fonts.css');")
css_path.write_text(css, encoding="utf-8")

for required in (
    "vendor/firebase-app-compat.js",
    "vendor/firebase-auth-compat.js",
    "vendor/firebase-database-compat.js",
    "vendor/amiri-fonts.css",
):
    if required not in index:
        raise RuntimeError(f"Required local dependency is not referenced: {required}")
if "vendor/morningboard-fonts.css" not in css:
    raise RuntimeError("Main local font stylesheet is not referenced")
if re.search(r"<script[^>]+src=['\"]https?://", index, flags=re.IGNORECASE):
    raise RuntimeError("A remote JavaScript file remains in the packaged app shell")
if re.search(r"@import\s+url\(['\"]?https?://", css, flags=re.IGNORECASE):
    raise RuntimeError("A remote stylesheet import remains in the packaged app shell")

print(f"Bundled Firebase SDK files: {len(firebase_files)}")
print(f"Bundled font files: {len(downloaded)}")
PY

test -s "$ASSETS_DIR/index.html"
test -s "$ASSETS_DIR/styles.css"
printf "APK-bundled website size: "
du -sh "$ASSETS_DIR" | cut -f1
