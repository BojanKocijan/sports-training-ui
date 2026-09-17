import { useLayoutEffect, useRef } from 'react'
import type { JerseyColor } from '../hooks/usePlayers'

// Served straight from public/ (Vite doesn't run public/ paths through the module graph, so
// these are plain URL strings, not imports) -- spaces in the folder names need %20.
const ASSET_BASE = '/images/basketball/u8%20u10/Leon/Web%20size'

// Neutral gray placeholder art for "no jersey color chosen yet" would need its own asset; until
// one exists, fall back to the palette's own white jersey rather than rendering nothing.
const FALLBACK_COLOR: JerseyColor = 'white'

/** One optimized artwork file per jersey color. Every file is a different pose (the source
 * shoot wasn't a single template recolored 8 ways), so each needs its own number placement
 * below -- there's no single offset that fits all of them. The nickname is shown as plain text
 * next to/under the card instead of drawn onto the jersey -- see PlayersSection/PlayerDetailModal. */
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

// Each artwork file's native pixel size -- used as the SVG viewBox so the number-layout fractions
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
 * jersey-color region of each source image and reading its bounding box) -- centerX/numberY/
 * maxWidth are all fractions of the image, rotateDeg follows the torso's tilt in that specific
 * pose. White/yellow read better with dark ink; the rest take white ink with a dark outline. */
const NUMBER_LAYOUT: Record<
  JerseyColor,
  { centerX: number; numberY: number; maxWidth: number; rotateDeg: number; ink: 'light' | 'dark' }
> = {
  orange: { centerX: 0.53, numberY: 0.6, maxWidth: 0.24, rotateDeg: -5, ink: 'light' },
  red: { centerX: 0.53, numberY: 0.6, maxWidth: 0.24, rotateDeg: -5, ink: 'light' },
  blue: { centerX: 0.5, numberY: 0.625, maxWidth: 0.24, rotateDeg: -3, ink: 'light' },
  green: { centerX: 0.47, numberY: 0.57, maxWidth: 0.26, rotateDeg: -8, ink: 'light' },
  purple: { centerX: 0.5, numberY: 0.62, maxWidth: 0.24, rotateDeg: 0, ink: 'light' },
  black: { centerX: 0.44, numberY: 0.625, maxWidth: 0.24, rotateDeg: -3, ink: 'light' },
  white: { centerX: 0.51, numberY: 0.62, maxWidth: 0.24, rotateDeg: 0, ink: 'dark' },
  yellow: { centerX: 0.47, numberY: 0.62, maxWidth: 0.24, rotateDeg: 3, ink: 'dark' },
}

const INK = {
  light: { fill: '#ffffff', stroke: '#171717' },
  dark: { fill: '#171717', stroke: '#ffffff' },
} as const

const JERSEY_FONT = '"Anton", "Arial Narrow Bold", Impact, "Haettenschweiler", sans-serif'

/** Fits a `<text>` to `maxWidth` (a fraction of the viewBox) by measuring its rendered length
 * at runtime and scaling down -- font metrics for a condensed display face vary enough across
 * browsers that a fixed font-size guess isn't reliable for a number of any length (99 vs 7). */
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
 * see PROJECT_KNOWLEDGE.md) with just the jersey number drawn on top as real `<text>` so it stays
 * editable per player. The nickname is intentionally not drawn onto the artwork -- it reads
 * better as plain text on the card/header around the jersey than squeezed onto the chest, and
 * every call site already shows it there. Each color's number position/rotation is tuned to
 * that pose's chest plate (see NUMBER_LAYOUT) rather than a single shared offset, since the
 * source art isn't one template recolored -- it's a different pose per color. */
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
  const layout = NUMBER_LAYOUT[resolvedColor]
  const ink = INK[layout.ink]

  const displayNumber = number !== null ? String(number) : ''
  const numberX = layout.centerX * w
  const numberY = layout.numberY * h
  const numberRef = useFitText(displayNumber, w, layout.maxWidth, numberX)

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="h-56 w-40"
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
      {number !== null && (
        <text
          ref={numberRef}
          x={numberX}
          y={numberY}
          textAnchor="middle"
          fontFamily={JERSEY_FONT}
          fontSize={h * 0.135}
          fill={ink.fill}
          stroke={ink.stroke}
          strokeWidth={h * 0.009}
          paintOrder="stroke"
          transform={`rotate(${layout.rotateDeg} ${numberX} ${numberY})`}
        >
          {displayNumber}
        </text>
      )}
    </svg>
  )
}
