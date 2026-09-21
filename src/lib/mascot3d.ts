import type { EyeColor, JerseyColor } from '../hooks/usePlayers'

// Served straight from public/ (plain URL strings, not imports) -- spaces in the folder names
// need %20, same as JerseyGraphic's ASSET_BASE.
const BASE = '/images/basketball/u8%20u10/Leon/Original%20size'

/** The lion's 3D assets (sports-training-api#68, #99). The model is the Tripo export with its
 * skeleton repaired (see MascotViewer3D), slimmed for the web: the normal map is dropped (the
 * app renders it matte, which ignores it anyway) and the colour texture is 2048px, taking it
 * from 9.5MB to 1.3MB. The region mask is an RGB image in the model's UV space: red is white over
 * the jersey and shorts panels, green over the eye area (the shader recolours only the dark iris
 * texels inside it), blue is unused. */
export const LION_3D = {
  modelUrl: `${BASE}/Leo%20boy/anthropomorphic_lion_v2_web.glb`,
  ballUrl: `${BASE}/Meshy_AI_cartoon_basketball_lo_0921102916_texture_1k.glb`,
  regionMaskUrl: `${BASE}/Leo%20boy/anthropomorphic_lion_v2_region_mask.png`,
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

/** Iris colour for each eye choice: the same swatches the still image uses (EyeColorPicker and
 * the leon-baby-eyes-*.svg masks). The still art multiplies them over a grey iris, so "brown"
 * (#FF6F09) multiplied by mid-grey comes out as a rich brown; Mascot3DScene does the same
 * multiply, so the two views match. No eye colour chosen leaves the authored dark eyes. */
export const EYE_TINTS: Record<EyeColor, string> = {
  blue: '#0598ec',
  green: '#3ce566',
  brown: '#ff6f09',
}
