import type { EyeColor, JerseyColor } from '../hooks/usePlayers'

// Served straight from public/ (plain URL strings, not imports) -- spaces in the folder names
// need %20, same as JerseyGraphic's ASSET_BASE.
const BASE = '/images/basketball/u8%20u10/Leon/Original%20size'
const SHARK_BASE = '/images/basketball/u8%20u10/Shark/3D'

/** Everything the 3D scene needs to show one mascot (sports-training-api#68, #99, #101, #104).
 * The models are Tripo exports run through `scripts/mascot3d` (rig repaired, slimmed for the
 * web); see docs/3d-mascot.md for how each value below is produced. */
export interface Mascot3DConfig {
  modelUrl: string
  ballUrl: string
  /** RGB image in the model's UV space: red is white over the jersey and shorts panels, green over
   * the eye area (the shader recolours only the dark iris texels inside it), blue is unused. */
  regionMaskUrl: string
  /** Preview camera (the scene auto-centres the model at the origin; the models are ~1 tall). */
  cameraPosition: [number, number, number]
  ball: {
    /** Bone the ball is parented to. three.js strips the colon from GLB node names. */
    bone: string
    /** The ball export is ~1.9 across; scale so it is ~0.14 wide next to a ~1 tall mascot. */
    scale: number
    /** Offset in the hand bone's local space; the bone's +Y runs along the fingers. */
    offset: [number, number, number]
  }
  /** Histogram match of the 3D iris lightness to the 2D art's (`masks.py iris-table`). */
  irisTone: { x: number[]; y: number[] }
  /** Swing the upper-arm bones down from a T-pose by this many degrees (needs real skin weights). */
  armDownDegrees?: number
  /** Genders that have this model; omit for all. Only the boy models exist so far. */
  genders?: readonly ('boy' | 'girl')[]
}

export const MASCOTS_3D: Record<string, Mascot3DConfig> = {
  lion: {
    modelUrl: `${BASE}/Leo%20boy/anthropomorphic_lion_v2_web.glb`,
    ballUrl: `${BASE}/Meshy_AI_cartoon_basketball_lo_0921102916_texture_1k.glb`,
    regionMaskUrl: `${BASE}/Leo%20boy/anthropomorphic_lion_v2_region_mask.png`,
    cameraPosition: [0.85, 0.1, 1.45],
    // 0.155 puts the ball just past the fingertips so the hand rests on top of it; smaller values
    // bury the hand inside the ball.
    ball: { bone: 'mixamorigRightHand', scale: 0.075, offset: [0, 0.155, 0] },
    irisTone: {
      x: [0.0, 0.046, 0.101, 0.205, 0.252, 0.298, 0.348, 0.384, 0.45],
      y: [0.0, 0.004, 0.027, 0.081, 0.129, 0.251, 0.471, 0.621, 0.7],
    },
  },
  shark: {
    modelUrl: `${SHARK_BASE}/shark_boy_web.glb`,
    ballUrl: `${BASE}/Meshy_AI_cartoon_basketball_lo_0921102916_texture_1k.glb`,
    regionMaskUrl: `${SHARK_BASE}/shark_boy_region_mask.png`,
    cameraPosition: [0.85, 0.1, 1.45],
    ball: { bone: 'mixamorigRightHand', scale: 0.075, offset: [0, 0.17, 0] },
    irisTone: {
      x: [0.0, 0.023, 0.044, 0.059, 0.074, 0.086, 0.113, 0.188, 0.267, 0.31, 0.45],
      y: [0.0, 0.004, 0.008, 0.024, 0.055, 0.09, 0.145, 0.273, 0.506, 0.671, 0.7],
    },
    // The export is a T-pose; the arms are bent down in code (its skin weights are real).
    armDownDegrees: 55,
    genders: ['boy'],
  },
}

/** The 3D config for a mascot, or null when it has no 3D model (for this gender). A missing
 * gender counts as a boy, the same default the still image uses. */
export function get3dConfig(mascotId: string, gender?: 'boy' | 'girl' | null): Mascot3DConfig | null {
  const config = MASCOTS_3D[mascotId]
  if (!config) return null
  if (config.genders && !config.genders.includes(gender ?? 'boy')) return null
  return config
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
 * the leon-baby-eyes-*.svg masks). The still art multiplies them over a grey iris, so "brown"
 * (#FF6F09) multiplied by mid-grey comes out as a rich brown; Mascot3DScene does the same
 * multiply, so the two views match. No eye colour chosen leaves the authored dark eyes. */
export const EYE_TINTS: Record<EyeColor, string> = {
  blue: '#0598ec',
  green: '#3ce566',
  brown: '#ff6f09',
}
