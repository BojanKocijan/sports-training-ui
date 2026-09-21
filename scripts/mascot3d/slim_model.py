#!/usr/bin/env python3
"""Make a web-sized copy of a GLB: resize/re-encode textures, drop maps the app never uses, and
optionally drop the skin data. Geometry, UVs and node hierarchy are untouched.

Why: the app renders the mascots "matte" (normal and metallic/roughness maps are ignored), and
the 3D preview is only worth its cost if it loads fast. Decoding and uploading 4096px textures
was the bulk of the load time, not the download (lion 9.5MB / ~40s -> 1.3MB / ~2s).

Usage:
  slim_model.py IN.glb OUT.glb [--base-size 2048] [--quality 90]
                [--drop-normal] [--drop-mr] [--mr-size 512] [--drop-skin]

  --base-size N     resize the base colour texture to N x N (JPEG); default 2048
  --drop-normal     remove the normal map
  --drop-mr         remove the metallic/roughness map (otherwise resized to --mr-size)
  --drop-skin       remove JOINTS/WEIGHTS and the skin: the mesh becomes a plain static Mesh.
                    The bone nodes stay in the hierarchy, so hand-attached props (the ball)
                    still work, but the model can no longer be posed by bones. Only use this when
                    the weights are useless or the pose is fixed (the app shows a rest pose).
"""
import argparse
import io

from PIL import Image

from glb import Glb


def reencode(data, size, quality):
    img = Image.open(io.BytesIO(data)).convert('RGB').resize((size, size), Image.LANCZOS)
    out = io.BytesIO()
    img.save(out, 'JPEG', quality=quality, optimize=True)
    return out.getvalue()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('src'); ap.add_argument('dst')
    ap.add_argument('--base-size', type=int, default=2048)
    ap.add_argument('--quality', type=int, default=90)
    ap.add_argument('--drop-normal', action='store_true')
    ap.add_argument('--drop-mr', action='store_true')
    ap.add_argument('--mr-size', type=int, default=512)
    ap.add_argument('--drop-skin', action='store_true')
    a = ap.parse_args()

    g = Glb(a.src); j = g.json
    before = sum(len(g.view_bytes(k)) for k in range(len(j['bufferViews'])))
    mat = j['materials'][0]
    pbr = mat['pbrMetallicRoughness']
    tex_img = lambda slot: j['textures'][slot['index']]['source']

    if 'baseColorTexture' in pbr:
        i = tex_img(pbr['baseColorTexture'])
        g.replace_image(i, reencode(g.image_bytes(i), a.base_size, a.quality), 'image/jpeg')
        print(f'base colour -> {a.base_size}px JPEG q{a.quality}')
    if 'normalTexture' in mat and a.drop_normal:
        del mat['normalTexture']; print('dropped normal map')
    if 'metallicRoughnessTexture' in pbr:
        if a.drop_mr:
            del pbr['metallicRoughnessTexture']; print('dropped metallic/roughness map')
        else:
            i = tex_img(pbr['metallicRoughnessTexture'])
            g.replace_image(i, reencode(g.image_bytes(i), a.mr_size, a.quality), 'image/jpeg')
            print(f'metallic/roughness -> {a.mr_size}px')

    if a.drop_skin:
        for p in (pr for m in j['meshes'] for pr in m['primitives']):
            for k in ('JOINTS_0', 'WEIGHTS_0'):
                p['attributes'].pop(k, None)
        for n in j['nodes']:
            n.pop('skin', None)
        j.pop('skins', None)
        print('dropped skin data (JOINTS/WEIGHTS/inverseBindMatrices)')

    g.compact()
    size = g.save(a.dst)
    print(f'{before // 1024} KB of buffer data -> wrote {a.dst} ({size // 1024} KB)')


if __name__ == '__main__':
    main()
