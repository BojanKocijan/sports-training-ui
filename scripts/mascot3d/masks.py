#!/usr/bin/env python3
"""Build the region mask and the iris tone table for a mascot GLB.

The Tripo texture atlas has no clean regions, so recolouring works through a mask painted in the
model's UV space, found from the triangles instead of from the atlas image:

  * jersey + shorts: triangles whose texture colour is achromatic (white / grey / black), whose
    centroid height lies in a band and (optionally) whose |x| is under a limit. On the lion the achromatic triangles fall into three clean
    height groups: eyes (high), jersey+shorts (middle), shoes (low).
  * eye area: triangles within a radius of each eye centre, on the front (z > 0). The shader
    then recolours only the dark iris texels inside it. Eye centres must be MEASURED from a
    front-view reconstruction (see `view`): averaging "dark" triangles gives wrong centres
    because whiskers and lashes skew it.

Subcommands:
  view       GLB OUT.png --box X0 X1 Y0 Y1      front view of a region, triangles coloured by the
                                                 atlas: use it to read eye centres / height bands
  build      GLB OUT_MASK.png --eye-centre X,Y --eye-centre X,Y [options]
                                                 writes an RGB mask (R jersey, G eyes, B unused) plus
                                                 overlays to check it by eye
  iris-table GLB MASK.png --base2d IMG --eyes-svg SVG --layout L,T,W,H
                                                 histogram-matches the 3D iris lightness to the 2D
                                                 art's and prints the table for Mascot3DScene

Coordinates are the mesh's own (Y up, feet at 0, facing +Z), in the model's units.
"""
import argparse
import io
import math
import re
import sys

from PIL import Image, ImageDraw, ImageFilter

from glb import Glb


def load(glb_path, texture_from=None):
    g = Glb(glb_path)
    p = g.primitive()
    P, _ = g.read_accessor(p['attributes']['POSITION'])
    UV, _ = g.read_accessor(p['attributes']['TEXCOORD_0'])
    idx = [i[0] for i in g.read_accessor(p['indices'])[0]]
    tg = Glb(texture_from) if texture_from else g
    mat = tg.json['materials'][0]['pbrMetallicRoughness']
    img_i = tg.json['textures'][mat['baseColorTexture']['index']]['source']
    tex = Image.open(io.BytesIO(tg.image_bytes(img_i))).convert('RGB')
    return P, UV, idx, tex


def triangles(P, UV, idx, tex):
    """Per triangle: (vertex ids, colour sampled at the UV centroid, centroid xyz)."""
    W, H = tex.size
    px = tex.load()
    out = []
    for t in range(0, len(idx), 3):
        ids = idx[t:t + 3]
        u = sum(UV[k][0] for k in ids) / 3
        v = sum(UV[k][1] for k in ids) / 3
        col = px[min(W - 1, int(u * W)), min(H - 1, int(v * H))]
        c = [sum(P[k][i] for k in ids) / 3 for i in range(3)]
        out.append((ids, col, c))
    return out


def luma(c):
    return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255


# ---- view ---------------------------------------------------------------------------------
def cmd_view(a):
    P, UV, idx, tex = load(a.glb, a.texture_from)
    tris = triangles(P, UV, idx, tex)
    x0, x1, y0, y1 = a.box
    sc = a.width / (x1 - x0)
    im = Image.new('RGB', (a.width, int((y1 - y0) * sc)), (40, 40, 40))
    dr = ImageDraw.Draw(im)
    sel = sorted((c[2], ids, col) for ids, col, c in tris if y0 <= c[1] <= y1 and c[2] > 0.0)
    for _, ids, col in sel:
        dr.polygon([((P[k][0] - x0) * sc, (y1 - P[k][1]) * sc) for k in ids], fill=col)
    im.save(a.out)
    print(f'wrote {a.out} ({len(sel)} triangles). Pixel (px,py) -> x = {x0} + px/{sc:.1f}, y = {y1} - py/{sc:.1f}')


# ---- build --------------------------------------------------------------------------------
def cmd_build(a):
    P, UV, idx, tex = load(a.glb, a.texture_from)
    tris = triangles(P, UV, idx, tex)
    M = a.size
    centres = [tuple(map(float, c.split(','))) for c in a.eye_centre]
    ymin, ymax = a.jersey_y

    jersey = Image.new('L', (M, M), 0); jd = ImageDraw.Draw(jersey); nj = 0
    eyes = Image.new('L', (M, M), 0); ed = ImageDraw.Draw(eyes); ne = 0
    for ids, col, (cx, cy, cz) in tris:
        poly = [(UV[k][0] * M, UV[k][1] * M) for k in ids]
        if max(col) - min(col) < a.chroma and ymin <= cy <= ymax and abs(cx) <= a.jersey_x:
            jd.polygon(poly, fill=255); nj += 1
        if cz > 0.0 and any(math.hypot(cx - ex, cy - ey) <= a.eye_radius for ex, ey in centres):
            ed.polygon(poly, fill=255); ne += 1
    print(f'jersey triangles {nj}, eye-area triangles {ne} of {len(tris)}')
    grow = ImageFilter.MaxFilter(3)   # ~1.5px grow to cover seam bleeding
    jersey, eyes = jersey.filter(grow), eyes.filter(grow)
    Image.merge('RGB', (jersey, eyes, Image.new('L', (M, M), 0))).save(a.out)
    print('wrote', a.out)

    if a.overlay_dir:
        import os
        os.makedirs(a.overlay_dir, exist_ok=True)
        base = tex.resize((M, M))
        red = Image.new('RGB', (M, M), (255, 0, 60))
        Image.composite(Image.blend(base, red, 0.55), base, jersey).resize((1400, 1400)).save(
            os.path.join(a.overlay_dir, 'jersey_overlay.png'))
        # eye check: front view with the texels the shader would recolour painted blue
        x0, x1 = min(c[0] for c in centres) - 0.09, max(c[0] for c in centres) + 0.09
        y0, y1 = min(c[1] for c in centres) - 0.14, max(c[1] for c in centres) + 0.10
        sc = 1400 / (x1 - x0)
        im = Image.new('RGB', (1400, int((y1 - y0) * sc)), (40, 40, 40)); dr = ImageDraw.Draw(im)
        for cz, ids, col, cx, cy in sorted((c[2], ids, col, c[0], c[1]) for ids, col, c in tris
                                            if y0 <= c[1] <= y1 and c[2] > 0.0):
            inside = any(math.hypot(cx - ex, cy - ey) <= a.eye_radius for ex, ey in centres)
            dr.polygon([((P[k][0] - x0) * sc, (y1 - P[k][1]) * sc) for k in ids],
                       fill=(0, 150, 255) if inside and luma(col) < 0.45 else col)
        im.save(os.path.join(a.overlay_dir, 'eye_selection.png'))
        print('overlays in', a.overlay_dir, '(jersey_overlay.png: pink = jersey; eye_selection.png: blue = recoloured)')


# ---- iris-table ---------------------------------------------------------------------------
def parse_svg_polys(svg_text, layout, img_size):
    l, t, w, h = layout
    IW, IH = img_size
    L, T, Wd, Hd = l * IW, t * IH, w * IW, h * IH
    m = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', svg_text)
    vw, vh = float(m.group(1)), float(m.group(2))
    polys = []
    for d in re.findall(r'<path d="([^"]+)"', svg_text):
        nums = list(map(float, re.findall(r'-?\d+\.?\d*', d)))
        polys.append([(L + x * Wd / vw, T + y * Hd / vh) for x, y in zip(nums[0::2], nums[1::2])])
    return polys


def cmd_iris_table(a):
    base = Image.open(a.base2d).convert('RGB')
    layout = tuple(map(float, a.layout.split(',')))
    mask2d = Image.new('L', base.size, 0)
    md = ImageDraw.Draw(mask2d)
    for poly in parse_svg_polys(open(a.eyes_svg).read(), layout, base.size):
        md.polygon(poly, fill=255)
    bp, mp = base.load(), mask2d.load()
    d2 = sorted(v for v in (luma(bp[x, y]) for y in range(base.height) for x in range(base.width) if mp[x, y])
                if v < a.highlight)      # drop the baked-in white catchlight pixels

    P, UV, idx, tex = load(a.glb, a.texture_from)
    M = a.size
    region = Image.open(a.mask).convert('RGB')
    eyes = region.getchannel('G').load()
    t3 = tex.resize((M, M), Image.LANCZOS).load()
    bb = region.getchannel('G').getbbox()
    d3 = []
    for y in range(bb[1], bb[3]):
        for x in range(bb[0], bb[2]):
            if eyes[x, y] > 128:
                l = luma(t3[x, y])
                if l < a.iris_max:
                    d3.append(l)
    d3.sort()
    n3, n2 = len(d3), len(d2)
    print(f'3D iris texels {n3}, 2D iris pixels {n2} (highlights above {a.highlight} dropped)')
    xs, ys = [], []
    print('quantile   3D lightness -> 2D base lightness')
    for i in range(11):
        q = i / 10
        x, y = d3[min(n3 - 1, int(q * n3))], d2[min(n2 - 1, int(q * n2))]
        xs.append(round(x, 3)); ys.append(round(y, 3))
        print(f'  {q:.1f}       {x:.3f}      ->  {y:.3f}')
    print('\nSuggested tables for Mascot3DScene (last point capped so the ring never whitens):')
    xs_out = xs[:-1] + [round(a.iris_max - 0.05, 3)]
    ys_out = ys[:-1] + [min(ys[-1], 0.7)]
    # strictly increasing X only
    keep = [0] + [i for i in range(1, len(xs_out)) if xs_out[i] > xs_out[i - 1]]
    print('const IRIS_TONE_X =', [xs_out[i] for i in keep])
    print('const IRIS_TONE_Y =', [ys_out[i] for i in keep])


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)

    v = sub.add_parser('view'); v.add_argument('glb'); v.add_argument('out')
    v.add_argument('--box', nargs=4, type=float, required=True, metavar=('X0', 'X1', 'Y0', 'Y1'))
    v.add_argument('--width', type=int, default=1400); v.add_argument('--texture-from')
    v.set_defaults(fn=cmd_view)

    b = sub.add_parser('build'); b.add_argument('glb'); b.add_argument('out')
    b.add_argument('--eye-centre', action='append', required=True, metavar='X,Y')
    b.add_argument('--eye-radius', type=float, default=0.037)
    b.add_argument('--jersey-y', nargs=2, type=float, default=[0.16, 0.60], metavar=('MIN', 'MAX'))
    b.add_argument('--chroma', type=int, default=45, help='max RGB spread still counted as white/grey/black')
    b.add_argument('--jersey-x', type=float, default=9.0, metavar='MAX',
                   help='only triangles with |x| up to MAX count as jersey (excludes pale arm undersides '
                        'on a T-posed mascot); default: no limit')
    b.add_argument('--size', type=int, default=2048); b.add_argument('--overlay-dir')
    b.add_argument('--texture-from', help='GLB to read the base colour from (e.g. the full-size original)')
    b.set_defaults(fn=cmd_build)

    t = sub.add_parser('iris-table'); t.add_argument('glb'); t.add_argument('mask')
    t.add_argument('--base2d', required=True); t.add_argument('--eyes-svg', required=True)
    t.add_argument('--layout', required=True, metavar='L,T,W,H', help='eye box as fractions of the 2D image')
    t.add_argument('--size', type=int, default=2048); t.add_argument('--texture-from')
    t.add_argument('--highlight', type=float, default=0.85); t.add_argument('--iris-max', type=float, default=0.5)
    t.set_defaults(fn=cmd_iris_table)

    a = ap.parse_args()
    a.fn(a)


if __name__ == '__main__':
    main()
