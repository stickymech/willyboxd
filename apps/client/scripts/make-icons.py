#!/usr/bin/env python3
"""Renders all PNG brand assets from the "slate box" mark geometry.

Replaces qlmanage, which renders viewBox-only SVGs at the wrong scale and
misapplies clip-path in this layout. PIL output is deterministic and
pixel-exact. Requires Pillow (python3 -m pip install Pillow).

Generated: icon-192.png, icon-512.png, apple-touch-icon.png, og.png
"""
import os
from PIL import Image, ImageDraw, ImageFont

PUBLIC = os.path.join(os.path.dirname(__file__), "..", "public")
INK = (15, 23, 42, 255)
AMBER = (234, 179, 8, 255)

# Mark geometry on a 512 canvas (matches mark-tile.svg).
BOX = (144, 80, 368, 432, 56)
STRIPES = [(152, 192, 248, 96), (272, 192, 368, 96)]
STRIPE_W = 48


def render_square(size):
    s = size / 512.0
    img = Image.new("RGBA", (size, size), AMBER)
    box = [round(v * s) for v in (BOX[0], BOX[1], BOX[2], BOX[3])]

    ImageDraw.Draw(img).rounded_rectangle(box, radius=round(BOX[4] * s), fill=INK)

    box_alpha = Image.new("L", (size, size), 0)
    ImageDraw.Draw(box_alpha).rounded_rectangle(box, radius=round(BOX[4] * s), fill=255)

    stripes = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    sd = ImageDraw.Draw(stripes)
    for x0, y0, x1, y1 in STRIPES:
        sd.line(
            [(x0 * s, y0 * s), (x1 * s, y1 * s)],
            fill=AMBER,
            width=round(STRIPE_W * s),
        )
    stripes.putalpha(
        Image.composite(stripes.split()[3], Image.new("L", (size, size), 0), box_alpha)
    )
    img.alpha_composite(stripes)
    return img.convert("RGB")


def render_og():
    size = (1200, 630)
    img = Image.new("RGBA", size, INK)
    d = ImageDraw.Draw(img)

    d.rounded_rectangle((460, 130, 740, 410), radius=64, fill=AMBER)

    scale, tx, ty = 3.5, 488, 158
    box = (18, 10, 46, 54, 7)
    box_r = [round(tx + box[0] * scale), round(ty + box[1] * scale), round(tx + box[2] * scale), round(ty + box[3] * scale)]
    d.rounded_rectangle(box_r, radius=round(box[4] * scale), fill=INK)

    box_alpha = Image.new("L", size, 0)
    ImageDraw.Draw(box_alpha).rounded_rectangle(box_r, radius=round(box[4] * scale), fill=255)

    stripes = Image.new("RGBA", size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(stripes)
    for x0, y0, x1, y1 in [(19, 24, 31, 12), (34, 24, 46, 12)]:
        sd.line(
            [(tx + x0 * scale, ty + y0 * scale), (tx + x1 * scale, ty + y1 * scale)],
            fill=AMBER,
            width=round(6 * scale),
        )
    stripes.putalpha(Image.composite(stripes.split()[3], Image.new("L", size, 0), box_alpha))
    img.alpha_composite(stripes)

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

    ImageDraw.Draw(img).text((600, 525), "Willyboxd", font=font, fill=AMBER, anchor="mm")
    img.convert("RGB").save(os.path.join(PUBLIC, "og.png"))
    print("generated og.png")


def main():
    for name, size in (("icon-192.png", 192), ("icon-512.png", 512), ("apple-touch-icon.png", 180)):
        render_square(size).save(os.path.join(PUBLIC, name))
        print(f"generated {name}")
    render_og()


if __name__ == "__main__":
    main()
