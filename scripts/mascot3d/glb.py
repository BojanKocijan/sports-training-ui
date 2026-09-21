"""Minimal GLB (binary glTF 2.0) reader/writer plus 4x4 matrix helpers.

Pure Python: the only third-party dependency of the mascot3d scripts is Pillow (image
resizing). Matrices follow glTF: flat lists of 16 floats in column-major order.
"""
import json
import struct


def ident():
    return [[1.0 if i == j else 0.0 for j in range(4)] for i in range(4)]


def mul(a, b):
    return [[sum(a[i][k] * b[k][j] for k in range(4)) for j in range(4)] for i in range(4)]


def inv(m):
    """Gauss-Jordan inverse of a 4x4 matrix given as rows."""
    a = [row[:] + ident()[i] for i, row in enumerate(m)]
    for c in range(4):
        p = max(range(c, 4), key=lambda r: abs(a[r][c]))
        a[c], a[p] = a[p], a[c]
        piv = a[c][c]
        a[c] = [x / piv for x in a[c]]
        for r in range(4):
            if r != c:
                f = a[r][c]
                a[r] = [x - f * y for x, y in zip(a[r], a[c])]
    return [row[4:] for row in a]


def from_gltf(flat):
    """Column-major flat list -> 4x4 rows."""
    return [[flat[c * 4 + r] for c in range(4)] for r in range(4)]


def to_gltf(m):
    """4x4 rows -> column-major flat list."""
    return [m[r][c] for c in range(4) for r in range(4)]


class Glb:
    def __init__(self, path):
        d = open(path, 'rb').read()
        if d[:4] != b'glTF':
            raise ValueError(f'{path} is not a GLB file')
        json_len = struct.unpack('<I', d[12:16])[0]
        self.json = json.loads(d[20:20 + json_len])
        off = 20 + json_len
        bin_len = struct.unpack('<I', d[off:off + 4])[0]
        self.bin = bytes(d[off + 8: off + 8 + bin_len])

    # ---- reading -------------------------------------------------------------------------
    def view_bytes(self, k):
        bv = self.json['bufferViews'][k]
        start = bv.get('byteOffset', 0)
        return self.bin[start:start + bv['byteLength']]

    def read_accessor(self, index):
        """Return (list of tuples, accessor json) for a float/uint accessor."""
        acc = self.json['accessors'][index]
        bv = self.json['bufferViews'][acc['bufferView']]
        comps = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}[acc['type']]
        fmt = {5126: 'f', 5125: 'I', 5123: 'H', 5121: 'B'}[acc['componentType']]
        size = struct.calcsize(fmt)
        stride = bv.get('byteStride') or comps * size
        base = bv.get('byteOffset', 0) + acc.get('byteOffset', 0)
        rows = [struct.unpack('<' + fmt * comps, self.bin[base + i * stride: base + i * stride + comps * size])
                for i in range(acc['count'])]
        return rows, acc

    def image_bytes(self, image_index):
        return self.view_bytes(self.json['images'][image_index]['bufferView'])

    def primitive(self):
        """The first (and for these mascots only) mesh primitive."""
        return self.json['meshes'][0]['primitives'][0]

    # ---- writing -------------------------------------------------------------------------
    def replace_image(self, image_index, data, mime):
        """Swap an image's bytes; call compact() afterwards to repack the buffer."""
        self._extra = getattr(self, '_extra', {})
        bv = self.json['images'][image_index]['bufferView']
        self._extra[bv] = data
        self.json['images'][image_index]['mimeType'] = mime

    def compact(self):
        """Drop everything no longer referenced (accessors, buffer views, textures, images) and
        repack the binary chunk with 4-byte alignment. Call after editing references."""
        j = self.json
        # textures still used by materials
        used_tex = set()
        for m in j.get('materials', []):
            for slot in (m.get('pbrMetallicRoughness', {}).get('baseColorTexture'),
                         m.get('pbrMetallicRoughness', {}).get('metallicRoughnessTexture'),
                         m.get('normalTexture'), m.get('occlusionTexture'), m.get('emissiveTexture')):
                if slot:
                    used_tex.add(slot['index'])
        tex_map = {old: new for new, old in enumerate(sorted(used_tex))}
        kept_tex = [j['textures'][i] for i in sorted(used_tex)]
        used_img = sorted({t['source'] for t in kept_tex})
        img_map = {old: new for new, old in enumerate(used_img)}
        for m in j.get('materials', []):
            for slot in (m.get('pbrMetallicRoughness', {}).get('baseColorTexture'),
                         m.get('pbrMetallicRoughness', {}).get('metallicRoughnessTexture'),
                         m.get('normalTexture'), m.get('occlusionTexture'), m.get('emissiveTexture')):
                if slot:
                    slot['index'] = tex_map[slot['index']]
        for t in kept_tex:
            t['source'] = img_map[t['source']]
        images = [j['images'][i] for i in used_img]
        if kept_tex:
            j['textures'], j['images'] = kept_tex, images
        else:
            j.pop('textures', None); j.pop('images', None); images = []
        # accessors still used
        used_acc = set()
        for mesh in j.get('meshes', []):
            for p in mesh['primitives']:
                used_acc.update(p['attributes'].values())
                if 'indices' in p:
                    used_acc.add(p['indices'])
        for s in j.get('skins', []):
            if 'inverseBindMatrices' in s:
                used_acc.add(s['inverseBindMatrices'])
        for a in j.get('animations', []):
            for smp in a['samplers']:
                used_acc.update((smp['input'], smp['output']))
        acc_order = sorted(used_acc)
        acc_map = {old: new for new, old in enumerate(acc_order)}
        for mesh in j.get('meshes', []):
            for p in mesh['primitives']:
                p['attributes'] = {k: acc_map[v] for k, v in p['attributes'].items()}
                if 'indices' in p:
                    p['indices'] = acc_map[p['indices']]
        for s in j.get('skins', []):
            if 'inverseBindMatrices' in s:
                s['inverseBindMatrices'] = acc_map[s['inverseBindMatrices']]
        for a in j.get('animations', []):
            for smp in a['samplers']:
                smp['input'], smp['output'] = acc_map[smp['input']], acc_map[smp['output']]
        accessors = [j['accessors'][i] for i in acc_order]
        # buffer views still used (by kept accessors and kept images)
        used_bv = {a['bufferView'] for a in accessors if 'bufferView' in a} | {im['bufferView'] for im in images}
        bv_order = sorted(used_bv)
        bv_map = {old: new for new, old in enumerate(bv_order)}
        extra = getattr(self, '_extra', {})
        parts, off, views = [], 0, []
        for old in bv_order:
            data = extra.get(old, self.view_bytes(old))
            pad = (-off) % 4
            parts.append(b'\0' * pad)
            off += pad
            bv = {k: v for k, v in j['bufferViews'][old].items() if k not in ('byteOffset', 'byteLength')}
            bv.update(buffer=0, byteOffset=off, byteLength=len(data))
            parts.append(data)
            off += len(data)
            views.append(bv)
        for a in accessors:
            if 'bufferView' in a:
                a['bufferView'] = bv_map[a['bufferView']]
        for im in images:
            im['bufferView'] = bv_map[im['bufferView']]
        j['accessors'], j['bufferViews'] = accessors, views
        newbin = b''.join(parts)
        newbin += b'\0' * ((-len(newbin)) % 4)
        j['buffers'] = [{'byteLength': len(newbin)}]
        self.bin = newbin
        self._extra = {}

    def save(self, path):
        jb = json.dumps(self.json, separators=(',', ':')).encode()
        jb += b' ' * ((-len(jb)) % 4)
        total = 12 + 8 + len(jb) + 8 + len(self.bin)
        with open(path, 'wb') as f:
            f.write(struct.pack('<4sII', b'glTF', 2, total))
            f.write(struct.pack('<I4s', len(jb), b'JSON') + jb)
            f.write(struct.pack('<I4s', len(self.bin), b'BIN\0') + self.bin)
        return total
