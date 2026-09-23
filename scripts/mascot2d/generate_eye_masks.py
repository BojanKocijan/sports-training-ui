#!/usr/bin/env python3
"""Best-effort automated eye-mask generator for a new 2D mascot pose.

Every "pose 1" mascot (lion, shark, and the new panther/tiger/dinosaur/goat/crocodile) shares the
exact same jersey/shorts/shoes silhouette and screen position -- confirmed by eye against the
existing lion art -- so the jersey-color masks are reused as-is. Only the eyes differ per animal
(and per gender), and JerseyGraphic.tsx's existing masks (see leon-baby-eyes-blue.svg) are
hand-traced iris outlines. This script approximates that, pure PIL (no numpy/opencv), matching
this repo's existing scripts/mascot3d/ convention of Pillow-only tooling.

Anchors on each eye's bright specular highlight, not the pupil: a dark-furred animal's pupil is
often the same lightness as its surrounding fur, so seeding from "the darkest blob" and flood-
filling outward leaks into the whole head (found on the panther -- the first version of this
script did exactly that). The highlight is a small, reliably pure-white dot regardless of fur
color, so a small fixed-size window centered on it -- not a lightness threshold -- is what bounds
the iris search.

This is explicitly a best-effort approximation (ellipse fit, not a hand-precise contour) --
render the composited overlay preview this script writes and eyeball it before trusting the
output, same spirit as scripts/mascot3d/masks.py's own overlay-checking step.

Usage:
    python3 scripts/mascot2d/generate_eye_masks.py ORIGINAL.png BASE GENDER \
        --search-box 0.20 0.12 0.80 0.48

    ORIGINAL.png    the "Original size" pose-1 PNG (RGBA, transparent background)
    BASE            e.g. "public/images/.../Panther/Web size/panther-baby" -- writes
                    BASE-eyes-GENDER-{blue,green,brown}.svg, BASE-eyes-GENDER-highlights.svg
                    (matching the shark's existing naming: "eyes" before gender, not after),
                    and BASE-GENDER-eyes-overlay.png (preview only, not shipped)
    GENDER          "boy" or "girl"
    --search-box    left top right bottom, as fractions of image size, where the eyes are
                    expected -- keeps the flood-fill away from other dark fur/body regions.
                    Defaults to a generous box around the shared pose's head position.
"""

import argparse
import math
from collections import deque

from PIL import Image, ImageDraw

EYE_TINTS = {"blue": "#0598ec", "green": "#3ce566", "brown": "#ff6f09"}

# A generous crop around where every "pose 1" mascot's head sits (measured from the lion's own
# LION_EYES_LAYOUT in JerseyGraphic.tsx, padded out since other animals' heads/ears vary in size).
# The bottom bound matters more than it looks: found on the crocodile, whose glossy white jersey
# collar (with dark trim lines nearby) fooled the highlight-darkness filter below. Every animal's
# eyes sit well above 0.30 in this shared pose (checked against lion, panther, crocodile), so
# capping well short of the ~0.45 where a collar highlight can appear removes that failure mode
# without relying on the darkness heuristic alone.
DEFAULT_SEARCH_BOX = (0.20, 0.12, 0.80, 0.38)

IRIS_LIGHTNESS_MAX = 195  # the dark iris+pupil region, within a per-eye search window (see find_eyes)
HIGHLIGHT_LIGHTNESS_MIN = 235  # near-pure-white specular dots
MIN_BLOB_PIXELS = 25


def lightness(px):
    r, g, b = px[0], px[1], px[2]
    return (r + g + b) / 3


def connected_components(mask_fn, w, h, min_size=1):
    """BFS-labels every pixel where mask_fn(x, y) is true. Returns a list of pixel-coordinate lists."""
    seen = [[False] * w for _ in range(h)]
    components = []
    for y in range(h):
        for x in range(w):
            if seen[y][x] or not mask_fn(x, y):
                continue
            comp = []
            q = deque([(x, y)])
            seen[y][x] = True
            while q:
                cx, cy = q.popleft()
                comp.append((cx, cy))
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx] and mask_fn(nx, ny):
                        seen[ny][nx] = True
                        q.append((nx, ny))
            if len(comp) >= min_size:
                components.append(comp)
    return components


def bbox_and_centroid(pixels):
    xs = [p[0] for p in pixels]
    ys = [p[1] for p in pixels]
    cx = sum(xs) / len(xs)
    cy = sum(ys) / len(ys)
    return min(xs), min(ys), max(xs), max(ys), cx, cy


def ellipse_radii(pixels, cx, cy):
    """Radius of gyration per axis, scaled to approximate the blob's visual extent (a uniform
    disc's radius is about 2x its radius of gyration)."""
    n = len(pixels)
    var_x = sum((p[0] - cx) ** 2 for p in pixels) / n
    var_y = sum((p[1] - cy) ** 2 for p in pixels) / n
    return (var_x**0.5) * 2.0, (var_y**0.5) * 2.0


def pick_eye_pair(blobs, mid_x):
    """Picks one highlight candidate left of mid_x and one right of it, choosing whichever pair
    has the closest y -- real eyes sit at (roughly) the same height on a front-facing mascot, so
    this rejects a decorative accessory (found on the panther girl: a white hair bow, positioned
    higher than her actual right eye, passed the dark-ring filter just like a real highlight) in
    favor of whichever right-side candidate actually lines up with the confirmed left eye. Only
    the largest few candidates per side are considered, since a real eye's highlight is rarely
    the single smallest blob that passed filtering."""
    items = []
    for b in blobs:
        x0, y0, x1, y1, cx, cy = bbox_and_centroid(b)
        items.append({"blob": b, "cx": cx, "cy": cy})
    left = sorted([i for i in items if i["cx"] < mid_x], key=lambda i: len(i["blob"]), reverse=True)[:4]
    right = sorted([i for i in items if i["cx"] >= mid_x], key=lambda i: len(i["blob"]), reverse=True)[:4]
    if not left or not right:
        return [items]

    # y-similarity alone isn't always enough: found on the goat, whose nose+mouth-shadow blob
    # happened to sit closer in y to the real right eye than the goat's own (dimmer, smaller)
    # left eye did. Two real eyes are usually similar in *size* too, unlike a much bigger
    # nose/mouth blob or a much smaller stripe/texture artifact -- scoring both and picking the
    # combined-best pair resolves that without the y-only version's blind spot.
    def score(li, ri):
        y_diff = abs(li["cy"] - ri["cy"])
        size_a, size_b = len(li["blob"]), len(ri["blob"])
        size_ratio_penalty = abs(math.log(size_a / size_b)) * 40
        return y_diff + size_ratio_penalty

    best = min(((li, ri) for li in left for ri in right), key=lambda pair: score(*pair))
    return [[best[0]], [best[1]]]


def find_eyes(img, search_box):
    """Anchors on each eye's bright specular highlight (reliable regardless of fur color) rather
    than the pupil: a dark-furred animal's pupil is often contiguous with its fur at the pixel
    level, so seeding from "the darkest blob" leaks into the whole head (see this script's own
    doc comment). A small, fixed-size window around each highlight bounds the iris search
    instead -- the window itself is the safety cap, not a lightness/geometric guess."""
    w, h = img.size
    px = img.load()
    l, t, r, b = search_box
    sx0, sy0, sx1, sy1 = int(l * w), int(t * h), int(r * w), int(b * h)

    def is_highlight(x, y):
        if not (sx0 <= x < sx1 and sy0 <= y < sy1):
            return False
        p = px[x, y]
        return p[3] > 10 and lightness(p) > HIGHLIGHT_LIGHTNESS_MIN

    all_blobs = connected_components(is_highlight, w, h, min_size=3)

    # A true eye highlight sits right at the edge of (or inside) the dark pupil/iris; a false
    # positive (jersey trim, a tooth, a hair bow) sits on bright fabric/fur with no dark material
    # immediately against it. Sampling a filled disc close to the candidate -- not a thin ring
    # farther out -- and requiring a good chunk of it to be dark rejects those without needing to
    # know anything about the animal's own colors. A wider ring at 2.2x radius (an earlier version
    # of this check) still passed a white hair bow next to a dark ear shadow (found on the panther
    # and tiger girls) because the dark shadow was farther from the bow than a real iris is from
    # its own highlight -- sampling close in fixes that.
    def mostly_dark_nearby(cx, cy, r):
        disc_r = r * 1.6
        samples, dark = 0, 0
        for dx in range(-int(disc_r), int(disc_r) + 1, max(1, int(disc_r / 6))):
            for dy in range(-int(disc_r), int(disc_r) + 1, max(1, int(disc_r / 6))):
                if dx * dx + dy * dy > disc_r * disc_r:
                    continue
                rx, ry = int(cx + dx), int(cy + dy)
                if 0 <= rx < w and 0 <= ry < h:
                    p = px[rx, ry]
                    if p[3] > 10:
                        samples += 1
                        if lightness(p) < 210:
                            dark += 1
        return samples > 0 and dark / samples > 0.3

    # Tried adding an aspect-ratio ("roughly circular") filter here to reject an elongated
    # nose-to-mouth false positive found on the goat -- it broke the tiger instead (its striped
    # fur has plenty of its own roughly-circular dark/light boundary blobs that then out-scored
    # the real eyes on the y-match). Chasing one universal heuristic through every animal's own
    # texture is a whack-a-mole; a per-image --search-box override (see goat/crocodile-girl in
    # this repo's own generation history) is the more honest fix for a case like the goat's.
    blobs = []
    for b in all_blobs:
        x0, y0, x1, y1, cx, cy = bbox_and_centroid(b)
        r = max(x1 - x0, y1 - y0) / 2 + 1
        if mostly_dark_nearby(cx, cy, r):
            blobs.append(b)

    if len(blobs) < 2:
        raise SystemExit(
            f"Found only {len(blobs)} highlight blob(s) surrounded by a dark iris in the search box "
            f"(of {len(all_blobs)} bright blobs total) -- widen --search-box, or check the art has a "
            "visible specular highlight per eye."
        )
    two = pick_eye_pair(blobs, (sx0 + sx1) / 2)

    # Half-width of the local search window per eye, in source pixels -- generous enough to
    # contain a whole iris at this art's resolution (tuned against the lion's own proportions),
    # small enough that it can never reach a same-image second eye or leak into fur/ears.
    window = (sx1 - sx0) * 0.14

    eyes = []
    for cluster in two:
        main = max(cluster, key=lambda i: len(i["blob"]))
        wx0, wy0 = int(main["cx"] - window), int(main["cy"] - window)
        wx1, wy1 = int(main["cx"] + window), int(main["cy"] + window)

        def in_window(x, y, wx0=wx0, wy0=wy0, wx1=wx1, wy1=wy1):
            return wx0 <= x < wx1 and wy0 <= y < wy1

        def is_dark_in_window(x, y):
            if not in_window(x, y):
                return False
            p = px[x, y]
            return p[3] > 10 and lightness(p) < IRIS_LIGHTNESS_MAX

        dark_blobs = connected_components(is_dark_in_window, w, h, min_size=MIN_BLOB_PIXELS)
        if not dark_blobs:
            raise SystemExit(f"No iris-dark region found in the window around highlight at {main['cx']:.0f},{main['cy']:.0f}")
        # The blob whose bbox contains (or sits closest to) the highlight itself, not just the largest.
        hx, hy = main["cx"], main["cy"]

        def dist_to_highlight(blob):
            x0, y0, x1, y1, cx, cy = bbox_and_centroid(blob)
            return (cx - hx) ** 2 + (cy - hy) ** 2

        iris_pixels = min(dark_blobs, key=dist_to_highlight)
        x0, y0, x1, y1, cx, cy = bbox_and_centroid(iris_pixels)
        rx, ry = ellipse_radii(iris_pixels, cx, cy)

        def is_highlight_in_window(hx, hy, x0=x0, y0=y0, x1=x1, y1=y1):
            if not (x0 - 5 <= hx <= x1 + 5 and y0 - 5 <= hy <= y1 + 5):
                return False
            p = px[hx, hy]
            return p[3] > 10 and lightness(p) > HIGHLIGHT_LIGHTNESS_MIN

        # Capped at a fraction of the iris's own radius: on some renders (found on the panther
        # and tiger) the whole bright sclera exceeds HIGHLIGHT_LIGHTNESS_MIN, not just the small
        # specular dot, so the raw blob size is unusably large -- drawn at full size (uncapped),
        # it painted over the entire iris and washed the recolored eye out to solid white.
        max_highlight_r = max(rx, ry) * 0.35
        highlight_blobs = connected_components(is_highlight_in_window, w, h, min_size=3)
        highlight_blobs.sort(key=len, reverse=True)
        highlights = []
        for hb in highlight_blobs[:2]:
            hx0, hy0, hx1, hy1, hcx, hcy = bbox_and_centroid(hb)
            hr = min(max(hx1 - hx0, hy1 - hy0) / 2 + 1, max_highlight_r)
            highlights.append((hcx, hcy, hr))

        eyes.append({"bbox": (x0, y0, x1, y1), "centroid": (cx, cy), "radii": (rx, ry), "highlights": highlights})
    return eyes


def eyes_layout_box(eyes, img_size, pad_frac=0.15):
    w, h = img_size
    x0 = min(e["bbox"][0] for e in eyes)
    y0 = min(e["bbox"][1] for e in eyes)
    x1 = max(e["bbox"][2] for e in eyes)
    y1 = max(e["bbox"][3] for e in eyes)
    pad_x = (x1 - x0) * pad_frac
    pad_y = (y1 - y0) * pad_frac
    x0, y0 = max(0, x0 - pad_x), max(0, y0 - pad_y)
    x1, y1 = min(w, x1 + pad_x), min(h, y1 + pad_y)
    return x0, y0, x1, y1


def write_eye_svgs(eyes, box, base, gender):
    x0, y0, x1, y1 = box
    box_w, box_h = x1 - x0, y1 - y0

    def local(px_x, px_y):
        return px_x - x0, px_y - y0

    for color_name, hex_color in EYE_TINTS.items():
        paths = []
        for eye in eyes:
            cx, cy = local(*eye["centroid"])
            rx, ry = eye["radii"]
            paths.append(f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="{rx:.1f}" ry="{ry:.1f}" fill="{hex_color}"/>')
        svg = (
            f'<svg preserveAspectRatio="none" overflow="visible" style="display: block;" '
            f'width="{box_w:.1f}" height="{box_h:.1f}" viewBox="0 0 {box_w:.1f} {box_h:.1f}" '
            f'fill="none" xmlns="http://www.w3.org/2000/svg">\n'
            f'<g id="Eyes" style="mix-blend-mode:multiply">\n<g id="Eyes_2">\n' + "\n".join(paths) + "\n</g>\n</g>\n</svg>\n"
        )
        with open(f"{base}-eyes-{gender}-{color_name}.svg", "w") as f:
            f.write(svg)

    circles = []
    for eye in eyes:
        for hcx, hcy, hr in eye["highlights"]:
            lx, ly = local(hcx, hcy)
            circles.append(f'<circle cx="{lx:.1f}" cy="{ly:.1f}" r="{hr:.1f}" fill="#FAFAFB"/>')
    highlights_svg = (
        f'<svg width="{box_w:.1f}" height="{box_h:.1f}" viewBox="0 0 {box_w:.1f} {box_h:.1f}" '
        f'fill="none" xmlns="http://www.w3.org/2000/svg">\n' + "\n".join(circles) + "\n</svg>\n"
    )
    with open(f"{base}-eyes-{gender}-highlights.svg", "w") as f:
        f.write(highlights_svg)


def write_overlay_preview(img, eyes, box, out_path):
    overlay = img.convert("RGBA").copy()
    draw = ImageDraw.Draw(overlay)
    x0, y0, x1, y1 = box
    draw.rectangle([x0, y0, x1, y1], outline=(255, 0, 255, 255), width=3)
    for eye in eyes:
        cx, cy = eye["centroid"]
        rx, ry = eye["radii"]
        draw.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], outline=(0, 255, 0, 255), width=3)
        for hcx, hcy, hr in eye["highlights"]:
            draw.ellipse([hcx - hr, hcy - hr, hcx + hr, hcy + hr], outline=(255, 255, 0, 255), width=2)
    overlay.save(out_path)


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("image", help="Original-size pose-1 PNG, RGBA")
    parser.add_argument("base", help="e.g. public/.../Panther/Web size/panther-baby")
    parser.add_argument("gender", choices=["boy", "girl"])
    parser.add_argument("--search-box", type=float, nargs=4, default=DEFAULT_SEARCH_BOX, metavar=("L", "T", "R", "B"))
    args = parser.parse_args()

    img = Image.open(args.image).convert("RGBA")
    eyes = find_eyes(img, tuple(args.search_box))
    box = eyes_layout_box(eyes, img.size)
    write_eye_svgs(eyes, box, args.base, args.gender)
    overlay_path = f"{args.base}-{args.gender}-eyes-overlay.png"
    write_overlay_preview(img, eyes, box, overlay_path)

    w, h = img.size
    x0, y0, x1, y1 = box
    layout = {
        "left": round(x0 / w, 5),
        "top": round(y0 / h, 5),
        "width": round((x1 - x0) / w, 5),
        "height": round((y1 - y0) / h, 5),
    }
    print(f"eyes_layout for {args.base} ({args.gender}):")
    print(f"  {{ left: {layout['left']}, top: {layout['top']}, width: {layout['width']}, height: {layout['height']} }}")
    print(f"Preview written to {overlay_path} -- check it before trusting the masks.")


if __name__ == "__main__":
    main()
