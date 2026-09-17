import { useLayoutEffect, useRef } from 'react'
import type { JerseyColor } from '../hooks/usePlayers'

// Served straight from public/ (Vite doesn't run public/ paths through the module graph, so
// these are plain URL strings, not imports) -- spaces in the folder names need %20.
const ASSET_BASE = '/images/basketball/u8%20u10/Leon/Web%20size'

// Neutral gray placeholder art for "no jersey color chosen yet" would need its own asset; until
// one exists, fall back to the palette's own white jersey rather than rendering nothing.
const FALLBACK_COLOR: JerseyColor = 'white'

/** One optimized artwork file per jersey color. Every file is a different pose (the source
 * shoot wasn't a single template recolored 8 ways), so each needs its own text placement below
 * -- there's no single offset that fits all of them. */
const IMAGE_SRC: Record<JerseyColor, string> = {
  orange: `${ASSET_BASE}/leon-red.webp`, // no dedicated orange pose yet -- closest warm tone
  blue: `${ASSET_BASE}/leon-blue.webp`,
  red: `${ASSET_BASE}/leon-red.webp`,
  green: `${ASSET_BASE}/leon-green.webp`,
  purple: `${ASSET_BASE}/leon-purple.webp`,
  black: `${ASSET_BASE}/leon-black.webp`,
  white: `${ASSET_BASE}/leon-white.webp`,
  yellow: `${ASSET_BASE}/leon-yellow.webp`,
}

// Each artwork file's native pixel size -- used as the SVG viewBox so the text-layout fractions
// below map onto exact pixels instead of a letterboxed/cropped re-fit.
const NATIVE_SIZE: Record<JerseyColor, { w: number; h: number }> = {
  orange: { w: 480, h: 600 },
  blue: { w: 480, h: 600 },
  red: { w: 480, h: 600 },
  green: { w: 480, h: 600 },
  purple: { w: 480, h: 600 },
  black: { w: 480, h: 640 },
  white: { w: 480, h: 600 },
  yellow: { w: 480, h: 600 },
}

/** Where the jersey's chest plate actually sits in each pose (measured by flood-filling the
 * jersey-color region of each source image and reading its bounding box) -- nameY/numberY/
 * centerX/maxWidth are all fractions of the image, rotateDeg follows the torso's tilt in that
 * specific pose. White/yellow read better with dark ink; the rest take white ink with a dark
 * outline, same rule the old SVG-drawn jersey used. */
const TEXT_LAYOUT: Record<
  JerseyColor,
  { centerX: number; nameY: number; numberY: number; maxWidth: number; rotateDeg: number; ink: 'light' | 'dark' }
> = {
  orange: { centerX: 0.53, nameY: 0.54, numberY: 0.62, maxWidth: 0.2, rotateDeg: -5, ink: 'light' },
  red: { centerX: 0.53, nameY: 0.54, numberY: 0.62, maxWidth: 0.2, rotateDeg: -5, ink: 'light' },
  blue: { centerX: 0.5, nameY: 0.52, numberY: 0.6, maxWidth: 0.2, rotateDeg: -3, ink: 'light' },
  green: { centerX: 0.47, nameY: 0.5, numberY: 0.58, maxWidth: 0.22, rotateDeg: -8, ink: 'light' },
  purple: { centerX: 0.5, nameY: 0.5, numberY: 0.6, maxWidth: 0.2, rotateDeg: 0, ink: 'light' },
  black: { centerX: 0.44, nameY: 0.51, numberY: 0.61, maxWidth: 0.2, rotateDeg: -3, ink: 'light' },
  white: { centerX: 0.51, nameY: 0.48, numberY: 0.58, maxWidth: 0.2, rotateDeg: 0, ink: 'dark' },
  yellow: { centerX: 0.47, nameY: 0.52, numberY: 0.63, maxWidth: 0.2, rotateDeg: 3, ink: 'dark' },
}

const INK = {
  light: { fill: '#ffffff', stroke: '#171717' },
  dark: { fill: '#171717', stroke: '#ffffff' },
} as const

const JERSEY_FONT = '"Anton", "Arial Narrow Bold", Impact, "Haettenschweiler", sans-serif'

/** Fits a `<text>` to `maxWidth` (a fraction of the viewBox) by measuring its rendered length
 * at runtime and scaling down -- font metrics for a condensed display face vary enough across
 * browsers that a fixed font-size guess isn't reliable for names/numbers of any length. */
function useFitText(displayText: string, viewBoxW: number, maxWidthFrac: number, anchorX: number) {
  const ref = useRef<SVGTextElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.removeAttribute('transform')
    try {
      const natural = el.getComputedTextLength()
      const maxWidth = viewBoxW * maxWidthFrac
      if (natural > maxWidth) {
        const scale = maxWidth / natural
        el.setAttribute('transform', `translate(${anchorX},0) scale(${scale},1) translate(${-anchorX},0)`)
      }
    } catch {
      // getComputedTextLength unsupported (e.g. a test environment) -- leave unscaled.
    }
  }, [displayText, viewBoxW, maxWidthFrac, anchorX])
  return ref
}

/** The player's jersey, rendered from real mascot artwork (currently a single "Leon" the lion,
 * one pose+file per jersey color -- more animals will be added later and assigned per player,
 * see PROJECT_KNOWLEDGE.md) with the nickname and number drawn on top as real `<text>` so both
 * stay editable per player. Each color's text position/rotation is tuned to that pose's chest
 * plate (see TEXT_LAYOUT) rather than a single shared offset, since the source art isn't one
 * template recolored -- it's a different pose per color. */
export function JerseyGraphic({
  color,
  number,
  nickname,
}: {
  color: JerseyColor | null
  number: number | null
  nickname: string
}) {
  const resolvedColor = color ?? FALLBACK_COLOR
  const { w, h } = NATIVE_SIZE[resolvedColor]
  const layout = TEXT_LAYOUT[resolvedColor]
  const ink = INK[layout.ink]

  const upper = nickname.toUpperCase()
  const displayName = upper.length > 12 ? `${upper.slice(0, 11)}…` : upper
  const displayNumber = number !== null ? String(number) : ''

  const nameX = layout.centerX * w
  const nameY = layout.nameY * h
  const numberX = layout.centerX * w
  const numberY = layout.numberY * h

  const nameRef = useFitText(displayName, w, layout.maxWidth, nameX)
  const numberRef = useFitText(displayNumber, w, layout.maxWidth * 0.85, numberX)

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-52 w-36"
      role="img"
      aria-label={`${nickname}'s jersey${number !== null ? `, number ${number}` : ''}`}
    >
      <image
        href={IMAGE_SRC[resolvedColor]}
        x="0"
        y="0"
        width={w}
        height={h}
        preserveAspectRatio="xMidYMid meet"
      />
      <text
        ref={nameRef}
        x={nameX}
        y={nameY}
        textAnchor="middle"
        fontFamily={JERSEY_FONT}
        fontSize={h * 0.052}
        fill={ink.fill}
        stroke={ink.stroke}
        strokeWidth={h * 0.004}
        paintOrder="stroke"
        letterSpacing="0.5"
        transform={`rotate(${layout.rotateDeg} ${nameX} ${nameY})`}
      >
        {displayName}
      </text>
      {number !== null && (
        <text
          ref={numberRef}
          x={numberX}
          y={numberY}
          textAnchor="middle"
          fontFamily={JERSEY_FONT}
          fontSize={h * 0.1}
          fill={ink.fill}
          stroke={ink.stroke}
          strokeWidth={h * 0.006}
          paintOrder="stroke"
          transform={`rotate(${layout.rotateDeg} ${numberX} ${numberY})`}
        >
          {displayNumber}
        </text>
      )}
    </svg>
  )
}
