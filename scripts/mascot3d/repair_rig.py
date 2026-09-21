#!/usr/bin/env python3
"""Repair a Tripo (Mixamo-rigged) GLB whose skeleton three.js cannot pose.

Two defects seen in Tripo exports (the first lion and the shark):
  1. Bone nodes carry no transform at all, so three.js puts every bone at the origin and the
     skinned mesh renders collapsed/garbled. The true bind pose is only in the skin's
     inverseBindMatrices (IBMs); each bone's world matrix is the inverse of its IBM.
  2. The skeleton is in a different coordinate frame from the mesh (the lion's is turned 90
     degrees about Y; the shark's is Z-up and offset in height). Fixing (1) alone renders the mesh
     right (skinning stays identity) but leaves the bones, and anything attached to them like
     the ball, in the wrong place. Rebasing the skeleton into the mesh frame, IBM' = IBM * A^-1,
     puts the bones back on top of the mesh.

How the frame is found (--frame auto, the default):
  * If the skin weights are real, fit mesh = R * skeleton + t from the bones' bind positions vs
    the mean position of the vertices weighted to each bone: the best of the 24 axis-aligned
    rotations, translation as a median (robust to bones whose vertex centroid is off-centre).
  * If the weights are useless (e.g. the second lion has 99.8% of vertices on the Hips), fall
    back to a rule: a 90 degree turn about Y when the hands spread along a different axis than the
    mesh's widest horizontal extent.
  Always verify with the printed hand positions, then in the POC viewer with the ball attached.

Usage:
  repair_rig.py IN.glb OUT.glb [--frame auto|none] [--rotate 0|90|-90] [--check] [--force]

  --check   report the detected frame and residuals, write nothing
  --rotate  force a rotation about Y (skips the fit)
  --force   repair even if the bones already have transforms
A file whose bones already have transforms (e.g. the second lion export) is left alone.
Mesh, weights and textures are never touched.
"""
import argparse
import itertools
import struct
import sys
from collections import defaultdict

from glb import Glb, ident, inv, mul, from_gltf, to_gltf

ROT_Y = {
    90: [[0, 0, 1, 0], [0, 1, 0, 0], [-1, 0, 0, 0], [0, 0, 0, 1]],   # x_skel = z_mesh, z_skel = -x_mesh
    -90: [[0, 0, -1, 0], [0, 1, 0, 0], [1, 0, 0, 0], [0, 0, 0, 1]],
    0: ident(),
}


def rotations24():
    """All 24 proper axis-aligned rotations as 3x3 row lists."""
    out = []
    for perm in itertools.permutations(range(3)):
        for signs in itertools.product((1, -1), repeat=3):
            m = [[0] * 3 for _ in range(3)]
            for r in range(3):
                m[r][perm[r]] = signs[r]
            det = (m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
                   - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
                   + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]))
            if det == 1:
                out.append(m)
    return out


def apply(R, v):
    return [sum(R[r][c] * v[c] for c in range(3)) for r in range(3)]


def median(xs):
    xs = sorted(xs)
    return xs[len(xs) // 2]


def weighted_centroids(g, joint_names):
    """Mean mesh position of the vertices whose dominant bone is each joint (name -> (n, pos))."""
    p = g.primitive()
    P, _ = g.read_accessor(p['attributes']['POSITION'])
    J, _ = g.read_accessor(p['attributes']['JOINTS_0'])
    W, wacc = g.read_accessor(p['attributes']['WEIGHTS_0'])
    scale = {5126: 1.0, 5121: 1 / 255, 5123: 1 / 65535}[wacc['componentType']]
    acc = defaultdict(lambda: [0, 0.0, 0.0, 0.0])
    for pos, jj, ww in zip(P, J, W):
        best = max(range(4), key=lambda k: ww[k])
        a = acc[jj[best]]
        a[0] += 1; a[1] += pos[0]; a[2] += pos[1]; a[3] += pos[2]
    return {joint_names[k]: (a[0], [a[1] / a[0], a[2] / a[0], a[3] / a[0]]) for k, a in acc.items()}


def fit_frame(bones, centroids, min_verts=30):
    """Best mesh = R*skel + t over the 24 rotations. Returns (R, t, residual, n_bones) or None."""
    pairs = [(bones[n], c[1]) for n, c in centroids.items() if c[0] >= min_verts and n in bones]
    if len(pairs) < 6:
        return None
    best = None
    for R in rotations24():
        diffs = [[m[i] - apply(R, s)[i] for i in range(3)] for s, m in pairs]
        t = [median(d[i] for d in diffs) for i in range(3)]
        res = sum(abs(d[i] - t[i]) for d in diffs for i in range(3)) / len(pairs)
        if best is None or res < best[2]:
            best = (R, t, res, len(pairs))
    return best


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('src'); ap.add_argument('dst', nargs='?')
    ap.add_argument('--frame', default='auto', choices=['auto', 'none'])
    ap.add_argument('--rotate', choices=['0', '90', '-90'])
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--force', action='store_true', help='repair even if the bones already have transforms')
    a = ap.parse_args()
    if not a.check and not a.dst:
        ap.error('OUT.glb is required unless --check is given')

    g = Glb(a.src); j = g.json; nodes = j['nodes']
    if not j.get('skins'):
        sys.exit('no skin in this file: nothing to repair')
    skin = j['skins'][0]; joints = skin['joints']; names = [nodes[jn].get('name', str(jn)) for jn in joints]
    has_tf = [any(k in nodes[jn] for k in ('matrix', 'translation', 'rotation', 'scale')) for jn in joints]
    print(f'{len(joints)} joints, {sum(has_tf)} with a transform')
    already_ok = all(has_tf)
    if already_ok and not a.force and not a.check:
        print('bones already have transforms: nothing to repair (use --force to redo)')
        g.save(a.dst); return

    ibm_rows, ibm_acc = g.read_accessor(skin['inverseBindMatrices'])
    world0 = [inv(from_gltf(m)) for m in ibm_rows]
    bones = {n: [w[r][3] for r in range(3)] for n, w in zip(names, world0)}
    p = g.primitive()
    pacc = j['accessors'][p['attributes']['POSITION']]
    pmin, pmax = pacc['min'], pacc['max']

    # A = mesh <- skeleton frame (4x4, rows). identity when no rebasing is needed.
    A = ident(); how = 'none'
    if a.rotate is not None:
        A = ROT_Y[int(a.rotate)]; how = f'forced rotate {a.rotate} about Y (as skeleton = R * mesh, inverted below)'
        A = inv(A)
    elif a.frame == 'auto':
        centroids = weighted_centroids(g, names)
        fit = fit_frame(bones, centroids)
        if fit:
            R, t, res, n = fit
            A = [R[0] + [t[0]], R[1] + [t[1]], R[2] + [t[2]], [0, 0, 0, 1]]
            how = f'weight fit over {n} bones (mean residual {res:.3f})'
            print(f'  fit: mesh_x = {"-" if sum(R[0]) < 0 else ""}skel_{"xyz"[R[0].index(max(R[0], key=abs))]}, '
                  f'mesh_y = {"-" if sum(R[1]) < 0 else ""}skel_{"xyz"[R[1].index(max(R[1], key=abs))]}, '
                  f'mesh_z = {"-" if sum(R[2]) < 0 else ""}skel_{"xyz"[R[2].index(max(R[2], key=abs))]}; '
                  f't = {[round(x, 3) for x in t]}')
        else:
            lh, rh = bones.get('mixamorig:LeftHand'), bones.get('mixamorig:RightHand')
            if lh and rh:
                sx, sz = abs(lh[0] - rh[0]), abs(lh[2] - rh[2])
                mx, mz = pmax[0] - pmin[0], pmax[2] - pmin[2]
                angle = 90 if (sz > sx and mx > mz) else 0
                A = inv(ROT_Y[angle])
                how = (f'weights unusable; rule: hands spread x={sx:.3f} z={sz:.3f}, mesh extent '
                       f'x={mx:.3f} z={mz:.3f} -> rotate {angle}')
            else:
                how = 'weights unusable and no hand bones: no rebasing'
    print('frame:', how)

    rh_name = 'mixamorig:RightHand'
    if rh_name in bones:
        pw = [sum(A[r][c] * (bones[rh_name] + [1])[c] for c in range(4)) for r in range(3)]
        print(f'right hand bone -> {[round(x, 3) for x in pw]} in the mesh frame; '
              f'mesh bbox x {[round(pmin[0], 3), round(pmax[0], 3)]} y {[round(pmin[1], 3), round(pmax[1], 3)]} '
              f'z {[round(pmin[2], 3), round(pmax[2], 3)]}')
        print('check: near the mesh hand (right hand at negative x for a mascot facing +z), y about mid-height.')
    if a.check:
        return

    Ainv = inv(A)
    buf = bytearray(g.bin)
    bv = j['bufferViews'][ibm_acc['bufferView']]
    base = bv.get('byteOffset', 0) + ibm_acc.get('byteOffset', 0)
    world = {}
    for k, jn in enumerate(joints):
        new = mul(from_gltf(ibm_rows[k]), Ainv)                       # IBM' = IBM * A^-1
        buf[base + k * 64: base + k * 64 + 64] = struct.pack('<16f', *to_gltf(new))
        world[jn] = inv(new)
    g.bin = bytes(buf)
    parent = {c: i for i, n in enumerate(nodes) for c in n.get('children', [])}
    for jn, w in world.items():
        pw = world.get(parent.get(jn), ident())   # non-joint parents (Armature/RootNode) are identity
        nodes[jn]['matrix'] = [float(f'{x:.7g}') for x in to_gltf(mul(inv(pw), w))]
    size = g.save(a.dst)
    print(f'wrote {a.dst} ({size // 1024} KB)')


if __name__ == '__main__':
    main()
