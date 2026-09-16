import { useId, useLayoutEffect, useRef } from 'react'
import type { JerseyColor } from '../hooks/usePlayers'

// Actual fill values (not Tailwind classes — this renders as SVG, not DOM elements) matching
// the JERSEY_COLORS palette's Tailwind swatches (*-500, yellow-400) elsewhere in the app.
const FILL: Record<JerseyColor, string> = {
  orange: '#f97316',
  blue: '#3b82f6',
  red: '#ef4444',
  green: '#22c55e',
  purple: '#a855f7',
  black: '#171717',
  white: '#ffffff',
  yellow: '#facc15',
}

// Every real jersey is two deliberately paired colors (Lakers purple+gold, Celtics green+white,
// Bulls red+black) — not a body color plus a tone-on-tone tint of itself. This pairs each of our
// 8 body colors with a complementary trim color from the same palette, used for the collar/
// armhole plates, edge piping, and the number.
const ACCENT: Record<JerseyColor, string> = {
  orange: '#171717',
  blue: '#ffffff',
  red: '#171717',
  green: '#ffffff',
  purple: '#facc15',
  black: '#ffffff',
  white: '#171717',
  yellow: '#171717',
}

// White/yellow are too light for white text; everything else gets white text.
const LIGHT_COLORS = new Set<JerseyColor>(['white', 'yellow'])

function textFill(color: JerseyColor | null) {
  if (color === null) return '#525252' // neutral-600, readable on the "no color chosen" gray
  return LIGHT_COLORS.has(color) ? '#171717' : '#ffffff'
}

// The plaque's readable width (280 wide, minus margins) — used to scale long nicknames down to
// fit instead of spilling past the card's own edge. Font-size alone can't reliably predict a
// bold sans-serif string's rendered width across browsers, so this fits it precisely instead.
const MAX_TEXT_WIDTH = 180

/** A "trading card" jersey mesh — a proper plaque silhouette with elongated capsule armholes, a
 * rounded collar plate, and edge piping, modeled directly on real two-tone team jersey designs
 * (body color + one paired trim color, used for the collar/armholes/piping/number). Rendered on
 * a light background (the app's own card, not a baked-in dark backdrop) with the player's
 * nickname and number as real, resizable `<text>` (not baked-in vector glyphs) so both update
 * per player. `color: null` (no jersey color chosen yet) renders a neutral gray placeholder
 * rather than defaulting into the palette. Long nicknames are measured at runtime
 * (`getComputedTextLength`) and scaled down to fit the plaque's width. */
export function JerseyGraphic({
  color,
  number,
  nickname,
}: {
  color: JerseyColor | null
  number: number | null
  nickname: string
}) {
  const textRef = useRef<SVGTextElement>(null)
  const uid = useId()
  const shineId = `jersey-shine-${uid}`
  const shadowId = `jersey-shadow-${uid}`
  const clipId = `jersey-clip-${uid}`
  const fill = color === null ? '#d4d4d4' : FILL[color]
  const accent = color === null ? '#a3a3a3' : ACCENT[color]
  const textColor = textFill(color)
  const upper = nickname.toUpperCase()
  const displayText = upper.length > 14 ? `${upper.slice(0, 13)}…` : upper

  useLayoutEffect(() => {
    const el = textRef.current
    if (!el) return
    el.removeAttribute('transform')
    try {
      const natural = el.getComputedTextLength()
      if (natural > MAX_TEXT_WIDTH) {
        const scale = MAX_TEXT_WIDTH / natural
        el.setAttribute('transform', `translate(140,0) scale(${scale},1) translate(-140,0)`)
      }
    } catch {
      // getComputedTextLength unsupported (e.g. a test environment) — leave unscaled.
    }
  }, [displayText])

  const plaquePath =
    'M0 32C0 14.3269 14.3269 0 32 0H248C265.673 0 280 14.3269 280 32V352C280 378.51 258.51 400 232 400H48C21.4903 400 0 378.51 0 352V32Z'
  const leftCapsulePath =
    'M-5 36.5C0.953613 36.5 6.83418 41.8773 11.3125 51.7295C15.7293 61.4464 18.5 74.9759 18.5 90C18.5 105.024 15.7293 118.554 11.3125 128.271C6.83418 138.123 0.953613 143.5 -5 143.5C-10.9536 143.5 -16.8342 138.123 -21.3125 128.271C-25.7293 118.554 -28.5 105.024 -28.5 90C-28.5 74.9759 -25.7293 61.4464 -21.3125 51.7295C-16.8342 41.8773 -10.9536 36.5 -5 36.5Z'
  const rightCapsulePath =
    'M285 36.5C290.954 36.5 296.834 41.8773 301.312 51.7295C305.729 61.4464 308.5 74.9759 308.5 90C308.5 105.024 305.729 118.554 301.312 128.271C296.834 138.123 290.954 143.5 285 143.5C279.046 143.5 273.166 138.123 268.688 128.271C264.271 118.554 261.5 105.024 261.5 90C261.5 74.9759 264.271 61.4464 268.688 51.7295C273.166 41.8773 279.046 36.5 285 36.5Z'
  const collarPath =
    'M188.477 -0.5C187.684 25.5918 166.284 46.5 140 46.5C113.716 46.5 92.3161 25.5918 91.5234 -0.5H188.477Z'
  const collarSeamPath =
    'M189.5 -1.5V6C189.5 28.9198 170.92 47.5 148 47.5H132C109.08 47.5 90.5 28.9198 90.5 6V-1.5H189.5Z'

  return (
    <svg
      viewBox="0 0 280 400"
      className="h-40 w-28 overflow-visible"
      fill="none"
      role="img"
      aria-label={`${nickname}'s jersey${number !== null ? `, number ${number}` : ''}`}
    >
      <defs>
        <clipPath id={clipId}>
          <path d={plaquePath} />
        </clipPath>
        {/* Diagonal sheen — light top-left fading to dark bottom-right — is what reads as
         * "material under light" instead of a flat vector fill. */}
        <linearGradient id={shineId} x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="35%" stopColor="#fff" stopOpacity="0.06" />
          <stop offset="65%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={shadowId} x1="0%" y1="75%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
      </defs>

      <path d={plaquePath} fill={fill} />
      <rect x="0" y="80" width="12" height="320" fill={accent} clipPath={`url(#${clipId})`} />
      <rect x="268" y="80" width="12" height="320" fill={accent} clipPath={`url(#${clipId})`} />
      <path d={leftCapsulePath} fill="#fff" stroke={accent} strokeWidth="3" />
      <path d={rightCapsulePath} fill="#fff" stroke={accent} strokeWidth="3" />
      <path d={collarPath} fill="#fff" stroke={accent} strokeWidth="3" clipPath={`url(#${clipId})`} />
      <path d={collarSeamPath} stroke="#fff" clipPath={`url(#${clipId})`} />

      {/* Fabric sheen + hem shadow, on top of the flat fill for a bit of 3D lift. */}
      <path d={plaquePath} fill={`url(#${shineId})`} />
      <path d={plaquePath} fill={`url(#${shadowId})`} />

      <text
        ref={textRef}
        x="140"
        y="98"
        textAnchor="middle"
        fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
        fontSize="19"
        fontWeight="900"
        fill={textColor}
        letterSpacing="0.5"
      >
        {displayText}
      </text>
      {number !== null && (
        <text
          x="140"
          y="215"
          textAnchor="middle"
          fontFamily="'Arial Black', 'Helvetica Neue', Arial, sans-serif"
          fontSize="88"
          fontWeight="900"
          letterSpacing="-2"
          fill={accent}
          stroke={textColor}
          strokeWidth="1.5"
        >
          {number}
        </text>
      )}
    </svg>
  )
}
