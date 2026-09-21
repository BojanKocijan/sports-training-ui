import type { JerseyColor } from '../hooks/usePlayers'

// Served straight from public/ (plain URL strings, not imports) -- spaces in the folder names
// need %20, same as JerseyGraphic's ASSET_BASE.
const BASE = '/images/basketball/u8%20u10/Leon/Original%20size'

/** The lion's 3D assets (sports-training-api#68, #99). The model is the Tripo export with its
 * skeleton repaired (see MascotViewer3D history); the mask is a grayscale image in the model's
 * UV space that is white over the jersey and shorts panels, used to tint only those. */
export const LION_3D = {
  modelUrl: `${BASE}/Leo%20boy/anthropomorphic_lion_v2_bones_fixed.glb`,
  ballUrl: `${BASE}/Meshy_AI_cartoon_basketball_lo_0921102916_texture_1k.glb`,
  jerseyMaskUrl: `${BASE}/Leo%20boy/anthropomorphic_lion_v2_jersey_mask.png`,
} as const

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
