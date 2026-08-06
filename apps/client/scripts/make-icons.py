#!/usr/bin/env python3
"""Renders all PNG brand assets from the disc-trio brand mark geometry.

Replicates apps/client/src/components/BrandMark.tsx: three overlapping discs
(orange/green/blue, r=42) each containing an upright rocket silhouette in brand
ink (#0F172A, with a white cockpit window). Replaces qlmanage, which mis-scales
viewBox SVGs and mangles clip-path. Requires Pillow
(python3 -m pip install Pillow).

Generated: icon-192.png, icon-512.png, apple-touch-icon.png, og.png
"""
import os
from PIL import Image, ImageDraw, ImageFont

PUBLIC = os.path.join(os.path.dirname(__file__), "..", "public")
INK = (15, 23, 42, 255)
AMBER = (234, 179, 8, 255)
ORANGE = (245, 124, 8)
GREEN = (68, 197, 83)
BLUE = (41, 182, 244)

# Canonical mark geometry (240x120 viewBox) from BrandMark.tsx.
DISC_RADIUS = 42
DISCS = [
    {"cx": 176, "cy": 76, "fill": BLUE},   # blue (bottom, drawn first)
    {"cx": 120, "cy": 60, "fill": GREEN},  # green
    {"cx": 64, "cy": 44, "fill": ORANGE},  # orange (top)
]
ROCKET_SCALE = 0.8  # matches the React component transform


def _bezier3(p0, p1, p2, p3, n=20):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        x = p0[0] * u**3 + p1[0] * 3 * u**2 * t + p2[0] * 3 * u * t**2 + p3[0] * t**3
        y = p0[1] * u**3 + p1[1] * 3 * u**2 * t + p2[1] * 3 * u * t**2 + p3[1] * t**3
        pts.append((x, y))
    return pts


def _rocket_points():
    """Local (pre-0.8-scale) rocket silhouette as PIL drawing primitives."""
    glans = _bezier3((-13, -18), (-13, -40), (13, -40), (13, -18))
    body_curve = _bezier3((12, 24), (12, 30), (-12, 30), (-12, 24))
    body = [(-10, -18), (10, -18), (12, 24)] + body_curve + [(-10, -18)]
    glans_poly = glans + [(13, -18), (-13, -18)]
    fins = [
        [(11, 22), (19, 32), (13, 29)],   # right fin
        [(-11, 22), (-19, 32), (-13, 29)],  # left fin
    ]
    balls = [
        (9, 35, 8),   # right ball
        (-9, 35, 8),  # left ball
    ]
    window = (0, -8, 3.5)
    return {
        "glans": glans_poly,
        "body": body,
        "fins": fins,
        "balls": balls,
        "window": window,
    }


def draw_rocket(draw, cx, cy, scale):
    """Draw one rocket (fins, balls, body, glans, window) at disc centre.

    Matches BrandMark.tsx drawing order: fins first so they tuck behind the
    balls, then body, glans, and the white window last.
    """
    rx = _rocket_points()

    def tf(x, y):
        return (cx + x * scale, cy + y * scale)

    def tf_ellipse(bbox):
        x0, y0, r = bbox
        s = scale
        return (cx + (x0 - r) * s, cy + (y0 - r) * s, cx + (x0 + r) * s, cy + (y0 + r) * s)

    # fins (drawn beneath the balls)
    for tri in rx["fins"]:
        pts = [tf(x, y) for x, y in tri]
        draw.polygon(pts, fill=INK)
    # body
    draw.polygon([tf(x, y) for x, y in rx["body"]], fill=INK)
    # glans cap
    draw.polygon([tf(x, y) for x, y in rx["glans"]], fill=INK)
    # balls
    for x, y, r in rx["balls"]:
        draw.ellipse(tf_ellipse((x, y, r)), fill=INK)
    # white cockpit window (opacity .9)
    wx, wy, wr = rx["window"]
    draw.ellipse(tf_ellipse((wx, wy, wr)), fill=(255, 255, 255, 230))


def render_square(size):
    """512-style ink rounded tile with the disc-trio mark centered."""
    s = size / 512.0
    img = Image.new("RGBA", (size, size), INK)
    draw = ImageDraw.Draw(img)

    # full mark (240x120) scaled to fit width with margin, centered vertically
    mark_scale = (size / 240.0) * 0.92  # 92% of width, ~4% margin each side
    mark_w = 240 * mark_scale
    mark_h = 120 * mark_scale
    dx = (size - mark_w) / 2
    dy = (size - mark_h) / 2

    # discs (bottom-to-top overlap: blue, green, orange)
    for d in DISCS:
        cx = dx + d["cx"] * mark_scale
        cy = dy + d["cy"] * mark_scale
        r = DISC_RADIUS * mark_scale
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=d["fill"])

    # rockets inside each disc
    for d in DISCS:
        cx = dx + d["cx"] * mark_scale
        cy = dy + d["cy"] * mark_scale
        draw_rocket(draw, cx, cy, mark_scale * ROCKET_SCALE)

    return img.convert("RGB")


def render_favicon(size):
    """Simplified disc-trio favicon — ink tile + 3 colored discs (no rocket details).
    Optimized for small browser-tab sizes where rocket silhouettes are invisible."""
    img = Image.new("RGBA", (size, size), INK)
    draw = ImageDraw.Draw(img)

    # Scale the 3-disc geometry to fit ~90% of the canvas.
    target_width = size * 0.90
    scale = target_width / (240 - DISC_RADIUS)  # content width = 240 - 42 = 198

    mark_w = 240 * scale
    mark_h = 120 * scale
    dx = (size - mark_w) / 2
    dy = (size - mark_h) / 2

    # discs (bottom-to-top overlap: blue, green, orange)
    for d in DISCS:
        cx = dx + d["cx"] * scale
        cy = dy + d["cy"] * scale
        r = DISC_RADIUS * scale
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=d["fill"])

    return img


def render_og():
    size = (1200, 630)
    img = Image.new("RGBA", size, INK)
    draw = ImageDraw.Draw(img)

    # larger disc-trio mark, centered in the top band, leaving room for the wordmark
    mark_scale = 3.5
    mark_w = 240 * mark_scale
    mark_h = 120 * mark_scale
    dx = (size[0] - mark_w) / 2
    dy = 100  # push it up so the wordmark sits cleanly beneath

    for d in DISCS:
        cx = dx + d["cx"] * mark_scale
        cy = dy + d["cy"] * mark_scale
        r = DISC_RADIUS * mark_scale
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=d["fill"])

    for d in DISCS:
        cx = dx + d["cx"] * mark_scale
        cy = dy + d["cy"] * mark_scale
        draw_rocket(draw, cx, cy, mark_scale * ROCKET_SCALE)

    font = None
    for path in (
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
    ):
        try:
            font = ImageFont.truetype(path, 72)
            break
        except OSError:
            continue
    if font is None:
        font = ImageFont.load_default()

    draw.text((600, 560), "Willyboxd", font=font, fill=AMBER, anchor="mm")
    img.convert("RGB").save(os.path.join(PUBLIC, "og.png"))
    print("generated og.png")


def main():
    for name, size in (("icon-192.png", 192), ("icon-512.png", 512), ("apple-touch-icon.png", 180)):
        render_square(size).save(os.path.join(PUBLIC, name))
        print(f"generated {name}")

    # favicon: simplified disc-trio for browser tabs (no rocket details at small sizes)
    fav_16 = render_favicon(16)
    fav_32 = render_favicon(32)
    fav_16.save(os.path.join(PUBLIC, "favicon-16x16.png"))
    fav_32.save(os.path.join(PUBLIC, "favicon-32x32.png"))
    print("generated favicon-16x16.png, favicon-32x32.png")
    # ICO with both sizes (downscale from 32 for the 16 entry to keep crisp edges)
    fav_32.save(os.path.join(PUBLIC, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32)])
    print("generated favicon.ico")

    render_og()


if __name__ == "__main__":
    main()
