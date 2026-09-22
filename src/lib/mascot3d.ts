import type { EyeColor, JerseyColor } from '../hooks/usePlayers'

// Served straight from public/ (plain URL strings, not imports) -- spaces in the folder names
// need %20, same as JerseyGraphic's ASSET_BASE.
const BASE = '/images/basketball/u8%20u10/Leon/Original%20size'

/** Everything Mascot3DScene needs to render one mascot: its assets, where the ball attaches, and
 * the histogram-matched iris tone table for its own eye texture (see docs/3d-mascot.md §5, §6).
 * Bone transforms, ball offset/scale, camera distance and the iris table are all measured per
 * export -- nothing here is shared by assumption, only where two mascots happened to measure the
 * same (the hand bone name is Mixamo's own, not a coincidence of this app). */
export type Mascot3DConfig = {
  modelUrl: string
  ballUrl: string
  regionMaskUrl: string
  /** Mixamo-style rig. three.js strips the colon from node names on load. Swap to
   * 'mixamorigLeftHand' to put the ball in the other hand. */
  handBone: string
  /** Uniform scale applied to the ball GLB (~1.9 units across) so it reads as a basketball next
   * to this mascot. */
  ballScale: number
  /** Offset in the hand bone's local space (bone axis runs along +Y from the wrist, i.e. along
   * the fingers). Puts the ball just past the fingertips so the hand rests on top of it; smaller
   * values bury the hand inside the ball. Tuned by eye per model. */
  ballOffset: [number, number, number]
  /** Camera position for the player-form preview's tight framing (Mascot3DPreview). */
  previewCamera: [number, number, number]
  /** Camera position for the hidden POC viewer's wider framing (MascotViewer3D). */
  pocCamera: [number, number, number]
  /** 3D iris lightness -> still-art iris base lightness, piecewise linear (see masks.py
   * iris-table). Measured per mascot: the atlas iris is much darker and distributed differently
   * from the still art's, so a plain lift shrinks the pupil and loses the ring. */
  irisToneX: number[]
  irisToneY: number[]
}

/** The lion's 3D assets (sports-training-api#68, #99). The model is the Tripo export with its
 * skeleton repaired (see MascotViewer3D), slimmed for the web: the normal map and skin data are
 * dropped (the app renders it matte and the lion's weights were useless -- 99.8% of vertices on
 * the Hips) and the colour texture is 2048px, taking it from 9.5MB to about 1MB. The region mask
 * is an RGB image in the model's UV space: red is white over the jersey and shorts panels, green
 * over the eye area (the shader recolours only the dark iris texels inside it), blue is unused. */
const LION_3D: Mascot3DConfig = {
  modelUrl: `${BASE}/Leo%20boy/anthropomorphic_lion_v2_web.glb`,
  ballUrl: `${BASE}/Meshy_AI_cartoon_basketball_lo_0921102916_texture_1k.glb`,
  regionMaskUrl: `${BASE}/Leo%20boy/anthropomorphic_lion_v2_region_mask.png`,
  handBone: 'mixamorigRightHand',
  // The ball export is ~1.9 units across and this lion is ~0.98 tall; this scale makes the ball
  // ~0.14 wide.
  ballScale: 0.075,
  ballOffset: [0, 0.155, 0],
  previewCamera: [0.85, 0.1, 1.45],
  pocCamera: [1.8, 0.8, 3.2],
  irisToneX: [0.0, 0.046, 0.101, 0.205, 0.252, 0.298, 0.348, 0.384, 0.45],
  irisToneY: [0.0, 0.004, 0.027, 0.081, 0.129, 0.251, 0.471, 0.621, 0.7],
}

/** The shark (boy)'s 3D assets (#104), built the same way as the lion (docs/3d-mascot.md §6).
 * Unlike the lion, the shark's skin weights are real (not almost all on the Hips), so the web
 * copy keeps its skin data -- it stays posable -- and only drops the normal map and shrinks the
 * colour texture. */
const SHARK_BOY_3D: Mascot3DConfig = {
  modelUrl: `${BASE}/shark%20boy/blue_shark_web.glb`,
  ballUrl: `${BASE}/Meshy_AI_cartoon_basketball_lo_0921102916_texture_1k.glb`,
  regionMaskUrl: `${BASE}/shark%20boy/blue_shark_region_mask.png`,
  handBone: 'mixamorigRightHand',
  // The shark is about 1.0 tall (vs the lion's 0.98), close enough to reuse the lion's ball scale.
  ballScale: 0.075,
  ballOffset: [0, 0.155, 0],
  previewCamera: [0.85, 0.1, 1.45],
  pocCamera: [1.8, 0.8, 3.2],
  irisToneX: [0.0, 0.028, 0.056, 0.078, 0.11, 0.204, 0.267, 0.311, 0.359, 0.399, 0.45],
  irisToneY: [0.0, 0.004, 0.008, 0.024, 0.055, 0.09, 0.145, 0.273, 0.506, 0.671, 0.7],
}

/** Every mascot with a 3D model, keyed by mascot id (the same ids `usePlayers`/`JerseyGraphic`
 * use). The player-form toggle (PlayerPreviewCard) only shows for a mascot listed here; add a
 * mascot by building its config the same way as the two above (docs/3d-mascot.md §6) and adding
 * a row. */
export const MASCOTS_3D: Record<string, Mascot3DConfig> = {
  lion: LION_3D,
  shark: SHARK_BOY_3D,
}

/** Colour multiplied into the masked jersey pixels. Matches the Tailwind swatches the still
 * image's picker shows (JerseyColorPicker). The jersey art is white with black trim, so
 * multiplying recolours the fabric and leaves the trim black. Black is a near-black so the
 * shading does not vanish entirely. */
export const JERSEY_TINTS: Record<JerseyColor, string> = {
  orange: '#f97316',
  blue: '#3b82f6',
  red: '#ef4444',
  green: '#22c55e',
  purple: '#a855f7',
  black: '#262626',
  white: '#ffffff',
  yellow: '#facc15',
}

/** No jersey colour chosen yet: leave the art as authored (white), same fallback as the still
 * image (JerseyGraphic's FALLBACK_COLOR). */
export const DEFAULT_JERSEY_TINT = '#ffffff'

/** Iris colour for each eye choice: the same swatches the still image uses (EyeColorPicker and
 * the leon-baby-eyes-*.svg / shark-baby-eyes-*.svg masks). The still art multiplies them over a
 * grey iris, so "brown" (#FF6F09) multiplied by mid-grey comes out as a rich brown; Mascot3DScene
 * does the same multiply, so the two views match. No eye colour chosen leaves the authored dark
 * eyes. Shared across mascots -- only the per-mascot iris tone table (above) differs. */
export const EYE_TINTS: Record<EyeColor, string> = {
  blue: '#0598ec',
  green: '#3ce566',
  brown: '#ff6f09',
}
