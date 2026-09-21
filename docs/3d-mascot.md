# 3D mascots: how they are built and how the app uses them

The player create/edit form can switch its live preview from the still image to a 3D model of
the mascot, with the player's jersey colour, eye colour and an optional ball. The **lion** and the
**shark (boy)** have 3D models (the shark girl is not made yet, so she stays on the still image).
This document is the single place that explains the whole pipeline, so a new model can be added
without rediscovering any of it.

Tracking: sports-training-api#68 (idea), #94 / #97 / #98 (POC, rig, ball), #99 / #100 (toggle,
jersey colour, ball switch), #101 / #102 / #103 (eye colour), #104 (shark).

- [1. What ships in the app](#1-what-ships-in-the-app)
- [2. Building a model in Tripo](#2-building-a-model-in-tripo)
- [3. Checking an export before you use it](#3-checking-an-export-before-you-use-it)
- [4. The toolkit (`scripts/mascot3d`)](#4-the-toolkit-scriptsmascot3d)
- [5. How the shader recolours the model](#5-how-the-shader-recolours-the-model)
- [6. Adding a new mascot](#6-adding-a-new-mascot)
- [7. Size and load time](#7-size-and-load-time)
- [8. Known limits](#8-known-limits)
- [9. Troubleshooting](#9-troubleshooting)

## 1. What ships in the app

| Piece | Where | Notes |
|---|---|---|
| Toggle, ball switch, error fallback | `src/components/player-form/PlayerPreviewCard.tsx` | Still image is the default and the choice is never saved. Shown only for mascots with a 3D model. |
| Lazy 3D preview | `src/components/Mascot3DPreview.tsx` | `React.lazy`, so three.js and the models are only downloaded when someone opens 3D. Shows "Loading 3D model…". |
| Scene, shader, ball attachment | `src/components/Mascot3DScene.tsx` | Everything that draws the model. |
| Per-mascot config, colour tables | `src/lib/mascot3d.ts` | `MASCOTS_3D` (assets, camera, ball, iris table, arm bend, genders), `get3dConfig()`, `JERSEY_TINTS`, `EYE_TINTS`. |
| Failure fallback | `src/components/ErrorBoundary.tsx` | No WebGL or a failed download falls back to the still image. |
| Hidden dev page | `poc-3d.html`, `src/components/MascotViewer3D.tsx` | `/poc-3d.html`: the same scene with controls for matte, ball, jersey and eyes. Not linked from the app. |
| Assets | `public/images/basketball/u8 u10/Leon/Original size/` | See below. |

Assets in use (lion):

| File | Size | What it is |
|---|---|---|
| `Leo boy/anthropomorphic_lion_v2_web.glb` | 1.3 MB | Web copy of the model (2048px colour texture, no normal map). |
| `Leo boy/anthropomorphic_lion_v2_region_mask.png` | 27 KB | RGB mask in the model's UV space: red = jersey and shorts, green = eye area. |
| `Meshy_AI_cartoon_basketball_lo_..._texture_1k.glb` | 326 KB | The ball, attached to the right hand bone. |
| `Leo boy/anthropomorphic_lion_v2_bones_fixed.glb` | 9.1 MB | The repaired full-size model. The source for regenerating the web copy; the app does not load it. |

Assets in use (shark boy), in `public/images/basketball/u8 u10/Shark/3D/`:

| File | Size | What it is |
|---|---|---|
| `shark_boy_web.glb` | 1.7 MB | Repaired, web-sized model (2048px colour texture). Keeps its skin data: its weights are real, and the arms are bent with them. |
| `shark_boy_region_mask.png` | 41 KB | Region mask (red = jersey and shorts, green = eye area). |

The shark reuses the lion's ball.

The unrepaired Tripo exports are **not** committed. Keep them somewhere shared (they are needed
to reproduce the assets, see [section 4](#4-the-toolkit-scriptsmascot3d)).

## 2. Building a model in Tripo

What worked for the lion, in this order (left toolbar in Tripo):

1. **Model**: *Smart Mesh* (P2.0) with the multi-view tab (the cube icon) and four views of the 2D
   mascot (front, both sides, back). Topology **Quad**, polycount about **12,000**; 5,000 is too
   low for the mane, fingers and laces. The "Faces" readout shows the real size.
2. **Smart UV**, before texturing. It turned the atlas from thousands of tiny scraps into large
   recognisable pieces (jersey panels, face, shoes).
3. **Texture**: the multi-view *image reference* tab, **Remove Lighting on**, **4K**. The text-prompt
   tab alone drifted (black jersey, an invented logo, a ball printed on the chest).
4. **Rig**: humanoid rig, after texturing (re-texturing or re-unwrapping tends to drop the rig).
   Keep the pose a relaxed A-pose or T-pose so it rigs cleanly.
5. **Export**: **GLB** (not FBX), **Export Skeleton on**, 4k. Skip the PBR step: it adds normal and
   metallic/roughness maps, which caused the shading we do not want; the app renders matte.

Prompt rules: describe only what you want. Image models paint anything you name, even in a
"no logos" list, so avoid the words *basketball*, *logo* and *numbers*; say "plain solid white
jersey, blank front and back". The orange blob near the lion's hip is his tail tuft, not a ball.

Each export is different. The two lion exports and the shark differ in orientation, weights and
atlas quality, so **always run the checks below on a new file**.

## 3. Checking an export before you use it

| Check | Good | Bad | What to do |
|---|---|---|---|
| Texture atlas | Large islands (jersey panels, face, shoes) | Thousands of tiny scraps | Re-run Smart UV then Texture; scraps cannot be recoloured reliably. |
| Bone transforms | Bone nodes have `matrix` or TRS | None at all (renders garbled) | `repair_rig.py`. |
| Bone frame vs mesh | The hand bone sits at the mesh's hand | Bones turned or offset from the mesh | `repair_rig.py` fits and fixes it. |
| Skin weights | Bones own their own vertices | 99% of vertices on the Hips | Fine for a static pose; arms cannot bend. Try re-rigging in Tripo. |
| Bone names | `mixamorig:RightHand` | (three.js strips the colon) | Look up `mixamorigRightHand` in code. |
| Units | Lion about 0.98 tall, shark 1.0 | Differ per export | Rescale the ball per model. |
| Weight | Under about 1.5 MB after slimming | 4096px maps, normal map | `slim_model.py`. |

Measured on the exports so far:

| Export | Triangles | Bones | Atlas | Skin weights | Rig state |
|---|---|---|---|---|---|
| Lion v1 (Meshy) | 10k | 28 | scrambled scraps | not inspected | rendered fine in three.js (bone transforms not inspected) |
| Lion "anthropomorphic" v2 (Tripo) | 19k | 53 | large islands | 99.8% on Hips | no transforms; skeleton turned 90 degrees about Y |
| Lion cub (Tripo) | 26k | 65 | scrambled scraps | real | fine |
| Shark boy (Tripo) | 25k | 52 | large islands | real | no transforms; **Z-up skeleton, offset 0.5 in height**; T-pose |

## 4. The toolkit (`scripts/mascot3d`)

Python 3 with Pillow (`python3 -m pip install pillow`). No other dependencies. Every tool was
checked against assets already in the repo: `repair_rig.py`, `slim_model.py` and
`masks.py build` reproduce the committed lion files **byte for byte**, and `masks.py iris-table`
reproduces the numbers in the shader.

### `repair_rig.py`: make three.js able to pose the skeleton

Tripo exports have had two defects: bone nodes with no transform (the mesh renders collapsed), and
a skeleton in a different coordinate frame from the mesh (bones, and anything attached to them,
end up in the wrong place). The bind pose is only stored in the skin's `inverseBindMatrices`, so
each bone's world matrix is their inverse, rebased into the mesh frame: `IBM' = IBM * A^-1`.
Skinning stays identity, so the mesh itself never changes.

```bash
scripts/mascot3d/repair_rig.py IN.glb OUT.glb          # fit the frame, repair, write
scripts/mascot3d/repair_rig.py IN.glb --check          # report the detected frame, write nothing
```

The frame is found from the data: with real skin weights it fits `mesh = R * skeleton + t` (best
of the 24 axis-aligned rotations, translation as a median) from each bone's bind position against
the mean position of the vertices it owns. If the weights are useless (lion v2) it falls back to a
rule (a 90 degree turn about Y when the hands spread along a different axis than the mesh's
widest horizontal extent). A file whose bones already have transforms is left alone.
**Always read the printed right-hand position**: it should sit at the mesh's right hand (negative
x for a mascot facing +z) at about mid-height. Then confirm in the viewer with the ball attached.

Results so far: lion v2 rotates 90 degrees about Y (rule); the shark fits
`mesh_x = skel_y, mesh_y = skel_z, mesh_z = skel_x, t = (0, 0.496, 0)` from 43 bones.

### `slim_model.py`: a web-sized copy

The app renders matte, so the normal and metallic/roughness maps are never used, and decoding and
uploading 4096px textures was the bulk of the load time (lion: about 40 s down to about 2 s; the
download itself was fast).

```bash
scripts/mascot3d/slim_model.py LION_REPAIRED.glb lion_web.glb --drop-normal          # 9.5 MB -> 1.3 MB
scripts/mascot3d/slim_model.py BALL.glb ball_1k.glb --base-size 1024 --mr-size 512    # the ball
scripts/mascot3d/slim_model.py IN.glb OUT.glb --drop-skin                              # optional: static mesh
```

`--drop-skin` removes the weights and skin so the mesh is a plain static `Mesh` (on the lion:
1,347 KB down to 1,063 KB). The bone nodes stay in the hierarchy (checked: all 53 bone nodes and
the hand bone are still there), so the hand-attached ball is expected to keep working, but the model
can no longer be posed. **Not yet tried in the viewer**: load the result in `/poc-3d.html` with the
ball on before shipping it. Only use it when the weights are useless or the pose is fixed (not for
the shark, whose weights are real and useful).

### `masks.py`: the region mask and the iris table

Recolouring works through a mask in the model's UV space, built from the triangles because the
atlas has no clean regions.

```bash
# 1. Find the eye centres: a front-view reconstruction of the head, triangles coloured by the atlas.
scripts/mascot3d/masks.py view MODEL.glb head.png --box -0.16 0.16 0.55 0.80
#    (pixel px,py -> x = x0 + px/scale, y = y1 - py/scale; the script prints the scale)

# 2. Build the RGB mask (red = jersey+shorts, green = eye area) and overlays to check it.
scripts/mascot3d/masks.py build MODEL.glb region_mask.png \
    --eye-centre=-0.072,0.688 --eye-centre=0.074,0.692 --eye-radius 0.037 \
    --jersey-y 0.16 0.60 --overlay-dir overlays

# 3. Match the 3D iris to the 2D art and print the tables for Mascot3DScene.
scripts/mascot3d/masks.py iris-table MODEL.glb region_mask.png \
    --base2d "public/images/basketball/u8 u10/Leon/Web size/leon-baby-boy.webp" \
    --eyes-svg "public/images/basketball/u8 u10/Leon/Web size/leon-baby-eyes-green.svg" \
    --layout 0.36275,0.25678,0.27807,0.10449
```

How the mask is found:

- **Jersey and shorts**: triangles whose texture colour is achromatic (RGB spread under 45) and
  whose centroid height is in a band. On the lion the achromatic triangles fall into three clean
  height groups (eyes, jersey and shorts, shoes), so the band `0.16 to 0.60` isolates the jersey.
  Look at `overlays/jersey_overlay.png` (pink = selected): jersey and shorts panels, nothing else.
- **Shark example**: eye centres `(-0.092, 0.724)` and `(0.092, 0.720)` (read off a `view` of
  the whole body: `--box -0.52 0.52 0 1.02`), radius `0.042`, jersey band `--jersey-y 0.20 0.565`.
  Two things the lion did not need: `--jersey-x 0.17` (the pale undersides of the T-posed arms
  are colourless and in the height band, so they would otherwise be tinted) and `--chroma 12`
  (the cream throat inside the V-neck has a colour spread of 15 to 19 against 0 to 9 for the white
  jersey; the lion's default of 45 would tint it). Choose the threshold from a histogram of the
  spreads in the band, not by guessing.
- **Eye area**: triangles within a radius of each eye centre, facing front. Eye centres **must be
  measured** from the `view` image: averaging "dark" triangles gives wrong centres because
  whiskers and lashes skew it. Check `overlays/eye_selection.png` (blue = what would be
  recoloured): the whole iris, none of the white or the lashes.
- Use `--texture-from` to read the atlas from the full-size original when building from a slimmed
  file, so the classification is sampled from the sharp texture.

## 5. How the shader recolours the model

`Mascot3DScene.tsx` patches the model's `MeshStandardMaterial` (`onBeforeCompile`) to read the
region mask and apply two rules. The eye rule is the interesting one.

**Jersey (red channel)**: multiply the base colour by the chosen colour. The jersey art is white
with black trim, so white becomes the colour and the trim stays black.

**Iris (green channel)**: copy the recipe the 2D art uses. The still image's base art has a **grey
iris** (a big black pupil, over half the iris, inside a bright ring). A flat swatch colour is
CSS-multiplied over it, and white highlights are layered on top. That is why the "brown" swatch is
orange (`#FF6F09`): multiplied by grey it becomes a rich brown. So the 3D eye:

1. uses the same swatches (`EYE_TINTS`);
2. does the multiply in **sRGB**, like CSS `mix-blend-mode: multiply`;
3. only touches texels darker than about 0.5 (the iris and pupil). The sclera and highlights are
   0.65 and up, a clean gap from the iris, so they are left alone;
4. maps the 3D iris lightness to the 2D iris lightness by **histogram matching** (a small table,
   `IRIS_TONE_X` to `IRIS_TONE_Y`, printed by `masks.py iris-table`). The 3D iris is much darker and
   distributed differently, so a plain lift shrank the pupil and lost the ring. After matching,
   simulating the shader on the atlas reproduces the 2D numbers: lightness quantiles 0.05 / 0.23 /
   0.43 (2D) vs 0.05 / 0.24 / 0.41 (3D), identical mean colour, near-black share 60% vs 59%.

What did **not** work, so nobody retries it: replacing the swatches with "natural" colours, painting
the iris one flat colour, and eyeballing the tone curve (three rounds, all rejected). Measure the
2D art and match it numerically.

**Lighting**: the scene is deliberately bright and fairly flat (ambient 1.8, directional 1.2). The
still art is flat-lit, and three.js divides light by pi, so the defaults rendered every multiplied
colour darker than its swatch.

**GLSL note**: helper functions and `const` arrays must be declared above `main()` (they are
prepended with the uniforms); putting them in the `map_fragment` replacement fails to compile and
the canvas goes blank. Check the browser console for `THREE.WebGLProgram: Shader Error`.

**Arm bend (shark)**: the shark export is a T-pose, and a ball at the end of an outstretched hand
looks like an offering. Its skin weights are real, so `useArmsDown` swings the two upper-arm bones
(`mixamorigRightArm` / `mixamorigLeftArm`) down by `armDownDegrees` (55) about the world z axis,
in opposite directions (the mascot faces +z, so its right arm points to -x). The rotation is applied
in world space and converted back to each bone's local space, so it does not depend on the bones'
local axes, and the original rotations are restored on cleanup because the loaded scene is cached
and shared (a remount would otherwise bend the arms twice). The lion does not use this (its weights
are useless and its pose is already an A-pose).

**The ball** is a separate GLB cloned and added as a child of the hand bone
(`mixamorigRightHand`), with a scale (0.075 for the 0.98-tall lion) and an offset in the bone's
local space. On the lion the offset `[0, 0.155, 0]` puts it just past the fingertips so the hand
rests on top of it; smaller values bury the hand inside the ball. Tune both by eye per model.

## 6. Adding a new mascot

The shark (#104) is the first. Checklist, using the tools above:

1. Build and export from Tripo ([section 2](#2-building-a-model-in-tripo)).
2. `repair_rig.py MODEL.glb --check`, read the frame and the right-hand position, then repair.
3. `slim_model.py` for the web copy.
4. `masks.py view`, then `build` (eye centres, the jersey height band for this model), check both
   overlays, then `iris-table` against the mascot's own 2D art (`Web size/*-baby-*.webp`, the eyes
   SVG and the eye layout box from `JerseyGraphic.tsx`).
5. Add an entry to `MASCOTS_3D` in `src/lib/mascot3d.ts`: the three asset URLs, the preview camera,
   the ball (bone, scale, offset along the finger axis), the iris tone table from `iris-table`,
   `armDownDegrees` if the export is a T-pose with real weights, and `genders` if only some
   variants exist. The toggle, the scene and the POC page pick it up from there; no other code
   changes. The shark (#104) was added exactly this way.
6. Look at it in `/poc-3d.html` with all jersey and eye colours, the ball on and off.

## 7. Size and load time

Measured on the live site for the lion (3D mode, first visit):

| What | Size | Notes |
|---|---|---|
| Lion web model | 1,348 KB | not compressed by Netlify |
| Ball | 326 KB | not compressed |
| 3D JS chunk (three.js, fiber, drei) | 989 KB raw, about 265 KB gzip | lazy: only loaded on 3D |
| Region mask | 27 KB | |
| **Total** | **about 1.9 MB** | only when someone opens the 3D tab |

The main app chunk is unaffected (about 67 KB gzip). Nothing loaded is over 1.5 MB; the only file
that large in the repo is the unused `..._bones_fixed.glb` (9.1 MB).

Where the weight is: lion model = colour texture 450 KB, geometry about 600 KB, skin data 280 KB
(useless: 99.8% of vertices on the Hips); ball = colour texture 195 KB, metallic/roughness map
65 KB (unused when matte), geometry 65 KB.

Not done yet, in order of value: drop the lion's skin data (`--drop-skin`, about 280 KB), shrink the
ball (512px colour, no metallic/roughness map, about 215 KB), and cache headers in `netlify.toml`
(everything is currently served with `max-age=0`). Mesh compression (meshopt) and WebP textures
could bring the lion to about 0.4 to 0.5 MB but need a new tool and a decoder. Whether Netlify
compresses `.glb` under a different content type is untested.

## 8. Known limits

- The lion is a static rest pose; its skin weights are almost all on the Hips, so bones cannot bend
  its arms. The shark's weights are real, so its arms are bent down in code (55 degrees).
- Only the shark **boy** exists in 3D; the girl stays on the still image until she is made.
- The ball rests on an open hand; a real grip needs a curled-hand pose.
- The jersey number is not in 3D yet (needs a chest area on the atlas and a number texture).
- Yellow jerseys are close to the lion's golden fur, and black jerseys hide their own black trim.
- The first paint of a fresh 3D model is a few seconds (texture decode and GPU upload).

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Model renders as a collapsed, garbled blob | Bone nodes have no transforms | `repair_rig.py` |
| Model looks right but the ball is off in space | Skeleton frame differs from the mesh | `repair_rig.py`, read the hand position |
| Blank canvas, console: `Shader Error` | Function or array declared inside `main()` | Put declarations above `main()` |
| Ball missing, console warns bone not found | Colon stripped from the name | Use `mixamorigRightHand` |
| Ball swallows the hand | Offset too small | Increase the offset along the finger axis |
| Colours darker than their swatches | Scene under-lit (three.js divides light by pi) | Keep ambient 1.8 / directional 1.2 |
| Eyes neon or flat | Wrong tone mapping | Re-run `masks.py iris-table` against the 2D art |
| Everything is slow to appear | 4096px textures | `slim_model.py` |
