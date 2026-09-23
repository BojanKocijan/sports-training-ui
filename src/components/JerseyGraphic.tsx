import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useMascotAvatars, type AvatarLayoutBox, type MascotAvatar } from '../hooks/useMascotAvatars'
import { DEFAULT_MASCOT_ID, type EyeColor, type JerseyColor } from '../hooks/usePlayers'
import { Skeleton } from './ui/skeleton'

// Served straight from public/ (Vite doesn't run public/ paths through the module graph, so
// these are plain URL strings, not imports) -- spaces in the folder names need %20.
const ASSET_BASE = '/images/basketball/u8%20u10/Leon/Web%20size'

// Neutral gray placeholder art for "no jersey color chosen yet" would need its own asset; until
// one exists, fall back to the palette's own white jersey rather than rendering nothing.
const FALLBACK_COLOR: JerseyColor = 'white'

// Alfa Slab One is a bold slab-serif face -- the flat block-serif numeral shape is what reads as
// a "varsity"/collegiate jersey number rather than a plain condensed display font.
const JERSEY_FONT = '"Alfa Slab One", "Arial Black", Impact, "Haettenschweiler", sans-serif'

/** Distinct art for mascot_avatars' `stage='child'` (U10, sports-training-api#55) -- a different
 * illustration/pose than the dynamic baby-stage art below, and (so far) only orange/white have
 * dedicated files. Legacy per-color rendering: one fully-baked image per color, number drawn as
 * plain light/dark ink rather than the dynamic path's luminosity blend. */
const CHILD_STAGE_LAYOUT: Partial<
  Record<
    JerseyColor,
    {
      native: { w: number; h: number }
      layout: {
        centerX: number
        numberY: number
        maxWidth: number
        fontScale: number
        rotateDeg: number
        ink: 'light' | 'dark'
      }
    }
  >
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

const INK = {
  light: { fill: '#ffffff', stroke: '#171717' },
  dark: { fill: '#171717', stroke: '#ffffff' },
} as const

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

const SIZE_CLASSES = {
  md: 'h-56 w-40',
  lg: 'h-72 w-52',
  xl: 'h-[27rem] w-[19.5rem]',
} as const

// Dynamic-path container sizes (sports-training-api#57/#59) -- width is left to the browser
// via aspect-ratio instead of a fixed Tailwind width class like SIZE_CLASSES above. The base
// art here is 640x800 (4:5); SIZE_CLASSES' own widths were tuned for the *legacy* per-color
// art's different aspect ratio, so reusing them with `object-contain` on 4:5 art leaves a
// letterbox gap -- harmless-looking on the big jersey region, but the jersey/eyes overlay
// percentages assume the image fills its box edge-to-edge, so that gap silently offsets every
// overlay, worst at the bottom edge (the shoes) where the error compounds most. Matching the
// container's aspect ratio to the art exactly removes the letterbox, and with it the offset.
const DYNAMIC_SIZE_CLASSES = {
  md: 'h-56 aspect-[4/5]',
  lg: 'h-72 aspect-[4/5]',
  xl: 'h-[27rem] aspect-[4/5]',
} as const

/** ---- Dynamic (multiply-blend) rendering -- stage='baby' (sports-training-api#57/#59) ----
 *
 * One grayscale-ready base pose per gender, recolored client-side: jersey(+shorts+shoes) and
 * eyes are each a small flat mask image layered on top with CSS `mix-blend-mode: multiply`,
 * swapped by URL per the player's/eye's chosen color rather than one fully-baked image per
 * color. Every layout box below is traced directly in Figma (J9dSOUC5az7RoMJlNegRtr, node
 * 4008:346), not eyeballed. */

// gender and eye_color are both real per-player fields now (see GenderPicker/EyeColorPicker) --
// these defaults only apply when a caller omits the prop entirely (e.g. no player object yet).
const DEFAULT_EYE_COLOR: EyeColor = 'blue'
const DEFAULT_GENDER: NonNullable<MascotAvatar['gender']> = 'boy'

// Legacy default for avatar rows that carry no eyes_highlights_url of their own (rows seeded
// before that column existed) -- the lion's, which is what those rows were.
const EYE_HIGHLIGHTS_URL = `${ASSET_BASE}/leon-baby-eyes-highlights.svg`

const SHARK_ASSET_BASE = '/images/basketball/u8%20u10/Shark/Web%20size'
const PANTHER_ASSET_BASE = '/images/basketball/u8%20u10/Panther/Web%20size'
const TIGER_ASSET_BASE = '/images/basketball/u8%20u10/Tiger/Web%20size'
const DINOSAUR_ASSET_BASE = '/images/basketball/u8%20u10/Dinosaur/Web%20size'
const GOAT_ASSET_BASE = '/images/basketball/u8%20u10/Goat/Web%20size'
const CROCODILE_ASSET_BASE = '/images/basketball/u8%20u10/Crocodile/Web%20size'

type DynamicArt = Pick<
  MascotAvatar,
  | 'image_url'
  | 'jersey_mask_url'
  | 'jersey_layout'
  | 'eyes_mask_url'
  | 'eyes_highlights_url'
  | 'eyes_layout'
  | 'number_layout'
  | 'logo_layout'
>

// Every mascot so far is drawn in the same pose, so the jersey/number/logo boxes are shared;
// only the eyes differ per animal (and per gender for the shark), since the faces differ.
const POSE_1_LAYOUT = {
  jersey_layout: { left: 0.13815, top: 0.43723, width: 0.72415, height: 0.51805 },
  number_layout: { left: 0.418, top: 0.53281, width: 0.15597, height: 0.12482 },
  logo_layout: { left: 0.38324, top: 0.49287, width: 0.07388, height: 0.04708 },
} as const

const LION_EYES_LAYOUT = { left: 0.36275, top: 0.25678, width: 0.27807, height: 0.10449 }

function lionArt(gender: 'boy' | 'girl'): DynamicArt {
  return {
    ...POSE_1_LAYOUT,
    image_url: `${ASSET_BASE}/leon-baby-${gender}.webp`,
    jersey_mask_url: `${ASSET_BASE}/leon-baby-jersey-{color}.svg`,
    eyes_mask_url: `${ASSET_BASE}/leon-baby-eyes-{color}.svg`,
    eyes_highlights_url: EYE_HIGHLIGHTS_URL,
    eyes_layout: LION_EYES_LAYOUT,
  }
}

function sharkArt(gender: 'boy' | 'girl', eyesLayout: AvatarLayoutBox): DynamicArt {
  return {
    ...POSE_1_LAYOUT,
    image_url: `${SHARK_ASSET_BASE}/shark-baby-${gender}.webp`,
    jersey_mask_url: `${SHARK_ASSET_BASE}/shark-baby-jersey-{color}.svg`,
    eyes_mask_url: `${SHARK_ASSET_BASE}/shark-baby-eyes-${gender}-{color}.svg`,
    eyes_highlights_url: `${SHARK_ASSET_BASE}/shark-baby-eyes-${gender}-highlights.svg`,
    eyes_layout: eyesLayout,
  }
}

// #125: black panther, tiger, dinosaur, goat, crocodile -- same pose-1 template as the lion and
// shark (identical jersey/shorts/shoes position, confirmed by eye), so only the eye layout
// varies per animal/gender, same shape as sharkArt. Eye boxes came from
// scripts/mascot2d/generate_eye_masks.py (a best-effort automated trace, not hand-measured like
// the lion's/shark's own boxes) -- see that script's own doc comment before touching these.
function animalArt(assetBase: string, slug: string, gender: 'boy' | 'girl', eyesLayout: AvatarLayoutBox): DynamicArt {
  return {
    ...POSE_1_LAYOUT,
    image_url: `${assetBase}/${slug}-baby-${gender}.webp`,
    jersey_mask_url: `${assetBase}/${slug}-baby-jersey-{color}.svg`,
    eyes_mask_url: `${assetBase}/${slug}-baby-eyes-${gender}-{color}.svg`,
    eyes_highlights_url: `${assetBase}/${slug}-baby-eyes-${gender}-highlights.svg`,
    eyes_layout: eyesLayout,
  }
}

// Mirrors the mascot_avatars 'baby' stage seed exactly -- used only when no groupId/apiMatch is
// available (e.g. the live preview in CreatePlayerForm/EditPlayerForm), so that path never
// depends on the retired per-color leon-{color}.webp files. Keyed by mascot id so choosing the
// shark before its avatar rows have loaded doesn't flash a lion.
const FALLBACK_DYNAMIC_AVATAR: Record<string, Record<NonNullable<MascotAvatar['gender']>, DynamicArt>> = {
  lion: { boy: lionArt('boy'), girl: lionArt('girl') },
  shark: {
    // Placed from the designer's own boy layout in Figma (node 4029:2824, 410,330 333x164).
    boy: sharkArt('boy', { left: 0.36542, top: 0.23538, width: 0.29679, height: 0.11698 }),
    // The girl's eyes sit lower (left eye ~19px, right ~8px) than the boy's, so she needs her own
    // box and a mask with the right eye re-offset -- measured from her highlight positions.
    girl: sharkArt('girl', { left: 0.36096, top: 0.24893, width: 0.29768, height: 0.10841 }),
  },
  panther: {
    boy: animalArt(PANTHER_ASSET_BASE, 'panther', 'boy', { left: 0.28877, top: 0.15175, width: 0.46346, height: 0.2179 }),
    girl: animalArt(PANTHER_ASSET_BASE, 'panther', 'girl', { left: 0.28574, top: 0.17521, width: 0.45882, height: 0.21234 }),
  },
  tiger: {
    boy: animalArt(TIGER_ASSET_BASE, 'tiger', 'boy', { left: 0.29055, top: 0.15175, width: 0.46346, height: 0.2179 }),
    girl: animalArt(TIGER_ASSET_BASE, 'tiger', 'girl', { left: 0.22099, top: 0.15934, width: 0.56426, height: 0.2077 }),
  },
  dinosaur: {
    boy: animalArt(DINOSAUR_ASSET_BASE, 'dino', 'boy', { left: 0.18329, top: 0.18559, width: 0.58975, height: 0.19658 }),
    girl: animalArt(DINOSAUR_ASSET_BASE, 'dino', 'girl', { left: 0.28396, top: 0.15278, width: 0.45882, height: 0.21512 }),
  },
  goat: {
    boy: animalArt(GOAT_ASSET_BASE, 'goat', 'boy', { left: 0.29813, top: 0.18666, width: 0.4287, height: 0.16876 }),
    girl: animalArt(GOAT_ASSET_BASE, 'goat', 'girl', { left: 0.2832, top: 0.19711, width: 0.45766, height: 0.1771 }),
  },
  crocodile: {
    // Her head sits higher/tilted differently than every other mascot's shared framing --
    // generate_eye_masks.py needed a custom --search-box for this one gender, unlike any other
    // animal/gender pair so far.
    boy: animalArt(CROCODILE_ASSET_BASE, 'crocodile', 'boy', { left: 0.318, top: 0.05378, width: 0.47273, height: 0.22625 }),
    girl: animalArt(CROCODILE_ASSET_BASE, 'crocodile', 'girl', { left: 0.32286, top: 0.10235, width: 0.46925, height: 0.21327 }),
  },
}

/** Resolves a URL from the API (stored relative, like clubs.logo_url) or a fallback constant
 * (already absolute) against the app's base path. */
function assetUrl(url: string): string {
  return /^(\/|https?:)/.test(url) ? url : `${import.meta.env.BASE_URL}${url}`
}

// Fractions -> CSS percentages, rounded so float noise (36.096000000000004%) never reaches the DOM.
const pct = (fraction: number) => `${Number((fraction * 100).toFixed(4))}%`

function boxStyle(box: AvatarLayoutBox): React.CSSProperties {
  return {
    position: 'absolute',
    left: pct(box.left),
    top: pct(box.top),
    width: pct(box.width),
    height: pct(box.height),
  }
}

function DynamicJerseyGraphic({
  avatar,
  jerseyColor,
  eyeColor = DEFAULT_EYE_COLOR,
  number,
  nickname,
  size,
}: {
  avatar: DynamicArt
  jerseyColor: JerseyColor
  eyeColor?: EyeColor
  number: number | null
  nickname: string
  size: keyof typeof SIZE_CLASSES
}) {
  const imageSrc = assetUrl(avatar.image_url)
  // Which src has finished loading, not a boolean reset by an effect: the fallback art and the
  // API row for the same mascot resolve to the identical URL, so the <img> never reloads (and
  // never fires another `load`) when the API rows arrive. A boolean reset on that change left
  // the skeleton up forever -- seen on mobile as the avatars flashing, then going grey.
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null)
  const loaded = loadedSrc === imageSrc
  const jerseySrc = avatar.jersey_mask_url && assetUrl(avatar.jersey_mask_url.replace('{color}', jerseyColor))
  const eyesSrc = avatar.eyes_mask_url && assetUrl(avatar.eyes_mask_url.replace('{color}', eyeColor))
  const highlightsSrc = assetUrl(avatar.eyes_highlights_url ?? EYE_HIGHLIGHTS_URL)

  return (
    <div
      className={`relative overflow-hidden ${DYNAMIC_SIZE_CLASSES[size]}`}
      style={{ containerType: 'size' }}
      role="img"
      aria-label={`${nickname}'s jersey${number !== null ? `, number ${number}` : ''}`}
    >
      {!loaded && <Skeleton className="absolute inset-0 rounded-xl" />}
      <div className={loaded ? '' : 'invisible'}>
        <img
          src={imageSrc}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
          onLoad={() => setLoadedSrc(imageSrc)}
        />
        {jerseySrc && avatar.jersey_layout && (
          <img src={jerseySrc} alt="" className="h-full w-full" style={{ ...boxStyle(avatar.jersey_layout), mixBlendMode: 'multiply' }} />
        )}
        {eyesSrc && avatar.eyes_layout && (
          <>
            <img src={eyesSrc} alt="" className="h-full w-full" style={{ ...boxStyle(avatar.eyes_layout), mixBlendMode: 'multiply' }} />
            <img src={highlightsSrc} alt="" className="h-full w-full" style={boxStyle(avatar.eyes_layout)} />
          </>
        )}
        {number !== null && avatar.number_layout && (
          <>
            {/* Plain dark outline, NOT luminosity-blended -- on its own the luminosity layer
             * below can wash out to near-invisible on light jerseys (white/yellow), since
             * luminosity blend derives the number's color from the jersey's own hue/lightness
             * at the text's brightness. This sits behind it as a constant-contrast anchor, a
             * couple px wider on all sides (via text-stroke) so it reads as an outline rather
             * than covering the color-adaptive layer on top. */}
            <div
              aria-hidden
              style={{
                ...boxStyle(avatar.number_layout),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: JERSEY_FONT,
                  color: '#171717',
                  WebkitTextStroke: '4px #171717',
                  fontSize: `${avatar.number_layout.height * 100 * 0.85}cqh`,
                  lineHeight: 1,
                }}
              >
                {number}
              </span>
            </div>
            <div
              style={{
                ...boxStyle(avatar.number_layout),
                mixBlendMode: 'luminosity',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: JERSEY_FONT,
                  color: '#ffffff',
                  fontSize: `${avatar.number_layout.height * 100 * 0.85}cqh`,
                  lineHeight: 1,
                }}
              >
                {number}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/** The player's jersey, rendered from real mascot artwork (currently a single "Leon" the lion;
 * more animals will be added later and assigned per player, see PROJECT_KNOWLEDGE.md). The
 * nickname is intentionally not drawn onto the artwork -- it reads better as plain text on the
 * card/header around the jersey than squeezed onto the chest, and every call site already shows
 * it there.
 *
 * Two rendering paths, chosen by what the resolved mascot_avatars row looks like:
 * - `gender` set (or no row at all, e.g. no groupId) -- the dynamic path: one grayscale base
 *   pose per gender, jersey/eyes recolored client-side via multiply-blend (see
 *   DynamicJerseyGraphic above). This is the only path for stage='baby' (U8) and the fallback
 *   for every context with no group yet.
 * - `gender` absent, real `jersey_color` -- the legacy path: one fully-baked image per color
 *   (currently only stage='child' orange/white have this). */
export function JerseyGraphic({
  color,
  number,
  nickname,
  size = 'md',
  groupId,
  mascotId,
  gender = DEFAULT_GENDER,
  eyeColor = DEFAULT_EYE_COLOR,
}: {
  color: JerseyColor | null
  number: number | null
  nickname: string
  /** 'lg' is for hero/detail placements where the jersey is the focal point. */
  size?: keyof typeof SIZE_CLASSES
  /** Resolves the artwork through the group's mascot_avatars (sport + age stage, see
   * sports-training-api#49/#52) instead of the hardcoded fallback below. Omit for contexts with
   * no group yet (e.g. the live preview in CreatePlayerForm/EditPlayerForm). */
  groupId?: string
  mascotId?: string | null
  /** Pass the player's real gender when known (see usePlayers' Gender type) -- defaults to
   * 'boy' only when omitted entirely (no player object yet, e.g. a bare mascot preview). */
  gender?: NonNullable<MascotAvatar['gender']>
  /** Pass the player's real eye_color when known -- defaults to 'blue' only when omitted. */
  eyeColor?: EyeColor
}) {
  const resolvedColor = color ?? FALLBACK_COLOR

  // Only fetches when a groupId is actually passed in -- useMascotAvatars('') would otherwise
  // fire a request keyed on an empty group. The hook's own per-group cache means many jersey
  // cards for the same group (a roster grid) share one request, not one each.
  const { avatars } = useMascotAvatars(groupId ?? '')
  const resolvedMascotId = mascotId ?? DEFAULT_MASCOT_ID

  const dynamicMatch = groupId
    ? avatars.find((a) => a.mascot_id === resolvedMascotId && a.gender === gender)
    : undefined
  const legacyMatch = groupId
    ? avatars.find((a) => a.mascot_id === resolvedMascotId && a.gender === null && a.jersey_color === resolvedColor)
    : undefined

  if (legacyMatch) {
    const childOverride = legacyMatch.stage === 'child' ? CHILD_STAGE_LAYOUT[resolvedColor] : undefined
    if (childOverride) {
      return (
        <LegacyJerseyGraphic
          imageSrc={`${import.meta.env.BASE_URL}${legacyMatch.image_url}`}
          native={childOverride.native}
          layout={childOverride.layout}
          number={number}
          nickname={nickname}
          size={size}
        />
      )
    }
  }

  return (
    <DynamicJerseyGraphic
      avatar={dynamicMatch ?? (FALLBACK_DYNAMIC_AVATAR[resolvedMascotId] ?? FALLBACK_DYNAMIC_AVATAR[DEFAULT_MASCOT_ID])[gender]}
      jerseyColor={resolvedColor}
      eyeColor={eyeColor}
      number={number}
      nickname={nickname}
      size={size}
    />
  )
}

/** Legacy per-color rendering, kept only for stage='child' rows that still have their own
 * fully-baked image (currently just orange/white, see CHILD_STAGE_LAYOUT). */
function LegacyJerseyGraphic({
  imageSrc,
  native,
  layout,
  number,
  nickname,
  size,
}: {
  imageSrc: string
  native: { w: number; h: number }
  layout: {
    centerX: number
    numberY: number
    maxWidth: number
    fontScale: number
    rotateDeg: number
    ink: 'light' | 'dark'
  }
  number: number | null
  nickname: string
  size: keyof typeof SIZE_CLASSES
}) {
  const { w, h } = native
  const ink = INK[layout.ink]
  const displayNumber = number !== null ? String(number) : ''
  const numberX = layout.centerX * w
  const numberY = layout.numberY * h
  const numberRef = useFitText(displayNumber, w, layout.maxWidth, numberX)

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
