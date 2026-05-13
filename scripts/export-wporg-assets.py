#!/usr/bin/env python3
"""
Trim black edge artifacts and white padding, then scale/crop to exact WordPress.org sizes.
Reads from plugin root **`icon.png`** (preferred for icons), else `assets/wporg-incoming/` / `assets/`.
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
# Raw exports from design tools (do not mix with shipped `assets/*.css`).
INCOMING = ROOT / "assets" / "wporg-incoming"
SRC = ROOT / "assets"
DST = ROOT / ".wordpress-org" / "assets"


def source_path(name: str) -> Path:
    """Prefer `assets/wporg-incoming/` when present, else `assets/` root."""
    p = INCOMING / name
    if p.exists():
        return p
    return SRC / name


def row_is_dark(im: Image.Image, y: int, rgb_sum_max: int = 45 * 3) -> bool:
    w = im.width
    for x in range(w):
        r, g, b, *rest = im.getpixel((x, y))
        a = rest[0] if rest else 255
        if a < 200:
            return False
        if r + g + b > rgb_sum_max:
            return False
    return True


def col_is_dark(im: Image.Image, x: int, rgb_sum_max: int = 45 * 3) -> bool:
    h = im.height
    for y in range(h):
        r, g, b, *rest = im.getpixel((x, y))
        a = rest[0] if rest else 255
        if a < 200:
            return False
        if r + g + b > rgb_sum_max:
            return False
    return True


def trim_dark_edges(im: Image.Image) -> Image.Image:
    """Remove thin black (or near-black) bars on any side."""
    im = im.convert("RGBA")
    w, h = im.size
    top, bottom = 0, h - 1
    while top < h and row_is_dark(im, top):
        top += 1
    while bottom >= top and row_is_dark(im, bottom):
        bottom -= 1
    left, right = 0, w - 1
    while left < w and col_is_dark(im, left):
        left += 1
    while right >= left and col_is_dark(im, right):
        right -= 1
    if left >= right or top >= bottom:
        return im
    return im.crop((left, top, right + 1, bottom + 1))


def trim_white_padding(im: Image.Image, white: tuple[int, int, int, int] = (255, 255, 255, 255)) -> Image.Image:
    """Tight crop: drop margins that match flat white (common export padding)."""
    im = im.convert("RGBA")
    bg = Image.new("RGBA", im.size, white)
    diff = ImageChops.difference(im, bg)
    diff_gray = diff.convert("L")
    bbox = diff_gray.getbbox()
    if not bbox:
        return im
    return im.crop(bbox)


def cover_exact(im: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Scale so image covers size, center-crop to exact pixels (avoids Pillow ImageOps.cover sizing quirks)."""
    tw, th = size
    w, h = im.size
    scale = max(tw / w, th / h)
    nw = max(1, int(round(w * scale)))
    nh = max(1, int(round(h * scale)))
    resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
    left = (nw - tw) // 2
    top = (nh - th) // 2
    return resized.crop((left, top, left + tw, top + th))


def process(src_name: str, out_size: tuple[int, int]) -> None:
    path = source_path(src_name)
    if not path.exists():
        print(f"Skip missing: {path}", file=sys.stderr)
        return
    im = Image.open(path).convert("RGBA")
    im = trim_dark_edges(im)
    im = trim_white_padding(im)
    im = cover_exact(im, out_size)
    DST.mkdir(parents=True, exist_ok=True)
    out = DST / src_name
    im.save(out, "PNG", optimize=True)
    print(f"Wrote {out} ({out_size[0]}x{out_size[1]}) from {path}")


def process_plugin_root_icon() -> bool:
    """If `icon.png` exists at plugin root, build WordPress.org icons from it (canonical source)."""
    path = ROOT / "icon.png"
    if not path.exists():
        return False
    im = Image.open(path).convert("RGBA")
    im = trim_dark_edges(im)
    im = trim_white_padding(im)
    for size, out_name in (((128, 128), "icon-128x128.png"), ((256, 256), "icon-256x256.png")):
        out_im = cover_exact(im, size)
        DST.mkdir(parents=True, exist_ok=True)
        out_path = DST / out_name
        out_im.save(out_path, "PNG", optimize=True)
        print(f"Wrote {out_path} ({size[0]}x{size[1]}) from {path}")
    return True


def main() -> None:
    if not process_plugin_root_icon():
        process("icon-128x128.png", (128, 128))
        process("icon-256x256.png", (256, 256))
    process("banner-772x250.png", (772, 250))
    process("banner-1544x500.png", (1544, 500))


if __name__ == "__main__":
    main()
