import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useMascotAvatars } from '../hooks/useMascotAvatars'
import { DEFAULT_MASCOT_ID, type JerseyColor } from '../hooks/usePlayers'
import { Skeleton } from './ui/skeleton'

// Served straight from public/ (Vite doesn't run public/ paths through the module graph, so
// these are plain URL strings, not imports) -- spaces in the folder names need %20.
const ASSET_BASE = '/images/basketball/u8%20u10/Leon/Web%20size'

// Neutral gray placeholder art for "no jersey color chosen yet" would need its own asset; until
// one exists, fall back to the palette's own white jersey rather than rendering nothing.
const FALLBACK_COLOR: JerseyColor = 'white'

/** One optimized artwork file per jersey color. Every file is a different pose (the source
 * shoot wasn't a single template recolored 8 ways), so each needs its own number placement
 * below -- there's no single offset that fits all of them. The nickname is shown as plain text
 * next to/under the card instead of drawn onto the jersey -- see PlayersSection/PlayerDetailScreen. */
const IMAGE_SRC: Record<JerseyColor, string> = {
  orange: `${ASSET_BASE}/leon-orange.webp`,
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

/** Where the jersey's chest plate sits in each pose -- taken directly from the designer's own
 * placement boxes in Figma (node 4001:253, one "Frame 7" box per color drawn over that color's
 * art), converted from absolute Figma coordinates to fractions of the image. numberY is a
 * baseline (SVG text y), not the box's visual center -- it's the box center plus a fixed +0.06
 * offset for the font's ascender height, the same offset validated against the purple box
 * earlier (box center 0.560 + 0.06 = the 0.62 baseline that already looked right). The
 * reference boxes are all axis-aligned (no rotation), so the numbers are rendered upright
 * rather than tilted to match each torso. White/yellow read better with dark ink; the rest take
 * white ink with a dark outline. */
const NUMBER_LAYOUT: Record<
  JerseyColor,
  {
    centerX: number
    numberY: number
    maxWidth: number
    /** Font size as a fraction of image height -- taken from each color's own Frame 7 box
     * height in Figma (box height / 1402), not a single flat size for every pose. The designer
     * sized each placement box to that pose's actual chest plate, and smaller poses (e.g. the
     * green/red dribbling lunges) got visibly smaller boxes than the more upright ones. */
    fontScale: number
    rotateDeg: number
    ink: 'light' | 'dark'
  }
> = {
  orange: { centerX: 0.609, numberY: 0.616, maxWidth: 0.187, fontScale: 0.13, rotateDeg: 0, ink: 'light' },
  red: { centerX: 0.609, numberY: 0.616, maxWidth: 0.187, fontScale: 0.13, rotateDeg: 0, ink: 'light' },
  blue: { centerX: 0.577, numberY: 0.614, maxWidth: 0.187, fontScale: 0.13, rotateDeg: 0, ink: 'light' },
  green: { centerX: 0.542, numberY: 0.603, maxWidth: 0.181, fontScale: 0.126, rotateDeg: 0, ink: 'light' },
  purple: { centerX: 0.577, numberY: 0.629, maxWidth: 0.2, fontScale: 0.138, rotateDeg: 0, ink: 'light' },
  black: { centerX: 0.473, numberY: 0.662, maxWidth: 0.192, fontScale: 0.134, rotateDeg: 0, ink: 'light' },
  white: { centerX: 0.516, numberY: 0.683, maxWidth: 0.183, fontScale: 0.127, rotateDeg: 0, ink: 'dark' },
  yellow: { centerX: 0.511, numberY: 0.654, maxWidth: 0.192, fontScale: 0.134, rotateDeg: 0, ink: 'dark' },
}

const INK = {
  light: { fill: '#ffffff', stroke: '#171717' },
  dark: { fill: '#171717', stroke: '#ffffff' },
} as const

/** Distinct art for mascot_avatars' `stage='child'` (U10, sports-training-api#55) -- a different
 * illustration/pose than the shared baby/child stopgap above (see PROJECT_KNOWLEDGE.md), so it
 * needs its own NATIVE_SIZE + chest-plate placement rather than reusing the color-only tables.
 * Only orange/white exist so far; other colors keep resolving to the shared stopgap art via
 * apiMatch until their own 'child'-stage art is seeded. Placement is eyeballed against the
 * actual pose (no Figma frame for this AI-generated art) -- verify visually after any change. */
const CHILD_STAGE_LAYOUT: Partial<
  Record<JerseyColor, { native: { w: number; h: number }; layout: (typeof NUMBER_LAYOUT)[JerseyColor] }>
> = {
  orange: {
    native: { w: 480, h: 720 },
    layout: { centerX: 0.58, numberY: 0.49, maxWidth: 0.22, fontScale: 0.105, rotateDeg: 0, ink: 'light' },
  },
  white: {
    native: { w: 480, h: 720 },
    layout: { centerX: 0.58, numberY: 0.49, maxWidth: 0.22, fontScale: 0.105, rotateDeg: 0, ink: 'dark' },
  },
}

// Alfa Slab One is a bold slab-serif face -- the flat block-serif numeral shape is what reads as
// a "varsity"/collegiate jersey number rather than a plain condensed display font.
const JERSEY_FONT = '"Alfa Slab One", "Arial Black", Impact, "Haettenschweiler", sans-serif'

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
const SIZE_CLASSES = {
  md: 'h-56 w-40',
  lg: 'h-72 w-52',
  xl: 'h-[27rem] w-[19.5rem]',
} as const

export function JerseyGraphic({
  color,
  number,
  nickname,
  size = 'md',
  groupId,
  mascotId,
}: {
  color: JerseyColor | null
  number: number | null
  nickname: string
  /** 'lg' is for hero/detail placements where the jersey is the focal point -- the number's
   * fontSize is a fraction of the viewBox, so it scales up with the art automatically and never
   * needs its own size prop. */
  size?: keyof typeof SIZE_CLASSES
  /** Resolves the artwork through the group's mascot_avatars (sport + age stage, see
   * sports-training-api#49/#52) instead of the hardcoded Leon set below. Omit for contexts with
   * no group yet (e.g. the live preview in CreatePlayerForm/EditPlayerForm) -- falls back to
   * IMAGE_SRC, same as when the group's stage has no seeded art of its own. */
  groupId?: string
  mascotId?: string | null
}) {
  const resolvedColor = color ?? FALLBACK_COLOR

  // Only fetches when a groupId is actually passed in -- useMascotAvatars('') would otherwise
  // fire a request keyed on an empty group. The hook's own per-group cache means many jersey
  // cards for the same group (a roster grid) share one request, not one each.
  const { avatars } = useMascotAvatars(groupId ?? '')
  const resolvedMascotId = mascotId ?? DEFAULT_MASCOT_ID
  const apiMatch = groupId
    ? avatars.find((a) => a.mascot_id === resolvedMascotId && a.jersey_color === resolvedColor)
    : undefined

  // 'child' stage has its own art (distinct pose) for some colors -- use its own native
  // size/placement when it applies, since it isn't a recolor of the shared stopgap pose above.
  const childOverride = apiMatch?.stage === 'child' ? CHILD_STAGE_LAYOUT[resolvedColor] : undefined
  const { w, h } = childOverride?.native ?? NATIVE_SIZE[resolvedColor]
  const layout = childOverride?.layout ?? NUMBER_LAYOUT[resolvedColor]
  const ink = INK[layout.ink]

  const displayNumber = number !== null ? String(number) : ''
  const numberX = layout.centerX * w
  const numberY = layout.numberY * h
  const numberRef = useFitText(displayNumber, w, layout.maxWidth, numberX)

  // The artwork itself is a real network fetch (a ~70-90KB webp per color, see ASSET_BASE) --
  // separate from any API loading state, this tracks whether THIS image has actually painted
  // so a skeleton can stand in for it, not just for the surrounding card/data. Resets whenever
  // the color (and therefore the src) changes, e.g. live-previewing a different jersey color.
  const imageSrc = apiMatch
    ? `${import.meta.env.BASE_URL}${apiMatch.image_url}`
    : IMAGE_SRC[resolvedColor]
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    setLoaded(false)
  }, [imageSrc])

  return (
    <div className={`relative ${SIZE_CLASSES[size]}`}>
      {!loaded && <Skeleton className="absolute inset-0 rounded-xl" />}
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className={`h-full w-full ${loaded ? '' : 'invisible'}`}
        role="img"
        aria-label={`${nickname}'s jersey${number !== null ? `, number ${number}` : ''}`}
      >
      <image
        href={imageSrc}
        x="0"
        y="0"
        width={w}
        height={h}
        preserveAspectRatio="xMidYMid meet"
        onLoad={() => setLoaded(true)}
      />
      {number !== null && (
        <text
          ref={numberRef}
          x={numberX}
          y={numberY}
          textAnchor="middle"
          fontFamily={JERSEY_FONT}
          fontSize={h * layout.fontScale}
          fill={ink.fill}
          stroke={ink.stroke}
          strokeWidth={h * layout.fontScale * 0.067}
          paintOrder="stroke"
          transform={`rotate(${layout.rotateDeg} ${numberX} ${numberY})`}
        >
          {displayNumber}
        </text>
      )}
      </svg>
    </div>
  )
}
