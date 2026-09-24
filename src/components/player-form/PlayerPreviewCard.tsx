import { lazy, Suspense, useState } from 'react'
import { DEFAULT_MASCOT_ID, type EyeColor, type Gender, type JerseyColor } from '../../hooks/usePlayers'
import { BACKDROPS, DEFAULT_BACKDROP, DEFAULT_POSE, MASCOTS_3D, POSES, POSE_IDS, type BackdropId, type PoseId } from '../../lib/mascot3d'
import { ErrorBoundary } from '../ErrorBoundary'
import { JerseyGraphic } from '../JerseyGraphic'
import { Skeleton } from '../ui/skeleton'

const BACKDROP_IDS = Object.keys(BACKDROPS) as BackdropId[]

// Loaded on first switch to 3D, so the three.js bundle and the models stay out of the main chunk.
const Mascot3DPreview = lazy(() => import('../Mascot3DPreview'))

type PreviewView = 'still' | '3d'

const VIEW_LABELS: Record<PreviewView, string> = { still: 'Still image', '3d': '3D model' }

/** Live preview of the jersey being built in a create/edit form — mirrors the in-progress
 * nickname/color/number back to the trainer as they change them, instead of only showing the
 * result after Save. For a mascot listed in MASCOTS_3D (lib/mascot3d.ts) it can also switch to a
 * 3D model (jersey colour, eye colour and an optional ball); the still image stays the default
 * and the 3D choice is never saved. */
export function PlayerPreviewCard({
  nickname,
  jerseyColor,
  eyeColor,
  gender,
  jerseyNumber,
  groupId,
  mascotId,
  hideMeta = false,
  hideCaption = false,
  size = 'lg',
}: {
  nickname: string
  jerseyColor: JerseyColor | null
  eyeColor?: EyeColor | null
  gender?: Gender | null
  jerseyNumber: number | null
  /** Omit when no group is known yet (e.g. CreatePlayerForm) -- see JerseyGraphic's own doc
   * comment on why that falls back to the shared stopgap art instead of erroring. */
  groupId?: string
  mascotId?: string | null
  /** Hides the still/3D toggle, ball/backdrop controls, and the name caption -- for callers that
   * scale this card up and/or already show the name elsewhere (SpotlightPlayerEditor's stage),
   * where that chrome would either duplicate what's on screen or visually overflow its own
   * bounding box. Still image only while hidden -- #106 follow-up to bring 3D into the stage. */
  hideMeta?: boolean
  /** Hides just the trailing nickname caption while keeping the still/3D toggle and ball/backdrop
   * controls -- for callers (e.g. PlayerDetailScreen, #117) that already show the player's name in
   * their own heading and would otherwise show it twice. */
  hideCaption?: boolean
  /** Mascot size; the parent's mascot tab uses 'xl'. */
  size?: 'md' | 'lg' | 'xl'
}) {
  const [view, setView] = useState<PreviewView>('still')
  const [showBall, setShowBall] = useState(true)
  const [backdrop, setBackdrop] = useState<BackdropId>(DEFAULT_BACKDROP)
  const [pose, setPose] = useState<PoseId>(DEFAULT_POSE)
  const has3d = !hideMeta && (mascotId ?? DEFAULT_MASCOT_ID) in MASCOTS_3D
  const activeView: PreviewView = has3d ? view : 'still'

  const still = (
    <JerseyGraphic
      color={jerseyColor}
      eyeColor={eyeColor ?? undefined}
      gender={gender ?? undefined}
      number={jerseyNumber}
      nickname={nickname.trim() || 'Preview'}
      size={size}
      groupId={groupId}
      mascotId={mascotId}
    />
  )

  return (
    <div className="flex flex-col items-center gap-1">
      {has3d && (
        <div className="flex items-center gap-3">
          <div
            role="group"
            aria-label="Preview type"
            className="inline-flex rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800"
          >
            {(Object.keys(VIEW_LABELS) as PreviewView[]).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={activeView === option}
                onClick={() => setView(option)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  activeView === option
                    ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-50'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                {VIEW_LABELS[option]}
              </button>
            ))}
          </div>
          {activeView === '3d' && (
            <label className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
              <input
                type="checkbox"
                checked={showBall}
                onChange={(e) => setShowBall(e.target.checked)}
              />
              Ball
            </label>
          )}
        </div>
      )}
      {activeView === '3d' && (
        <div role="group" aria-label="Backdrop" className="flex items-center gap-1.5">
          {BACKDROP_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-label={BACKDROPS[id].label}
              aria-pressed={backdrop === id}
              onClick={() => setBackdrop(id)}
              className={`h-5 w-5 rounded-full ${BACKDROPS[id].className} ${
                backdrop === id
                  ? 'ring-2 ring-neutral-900 ring-offset-1 dark:ring-neutral-50'
                  : 'ring-1 ring-neutral-300 dark:ring-neutral-600'
              }`}
            />
          ))}
        </div>
      )}
      {activeView === '3d' && (
        <div role="group" aria-label="Stance" className="inline-flex rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
          {POSE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              aria-pressed={pose === id}
              onClick={() => setPose(id)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                pose === id
                  ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-50'
                  : 'text-neutral-500 dark:text-neutral-400'
              }`}
            >
              {POSES[id].emoji} {POSES[id].label}
            </button>
          ))}
        </div>
      )}
      {activeView === '3d' ? (
        <ErrorBoundary fallback={still}>
          <Suspense fallback={<Skeleton className="h-72 aspect-[4/5]" />}>
            <Mascot3DPreview
              mascotId={mascotId}
              jerseyColor={jerseyColor}
              eyeColor={eyeColor ?? null}
              showBall={showBall}
              backdrop={backdrop}
              pose={pose}
            />
          </Suspense>
        </ErrorBoundary>
      ) : (
        still
      )}
      {!hideMeta && !hideCaption && (
        <p className="max-w-full truncate text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          {nickname.trim() || 'New player'}
        </p>
      )}
    </div>
  )
}
