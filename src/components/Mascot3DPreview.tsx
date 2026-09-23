import { useProgress } from '@react-three/drei'
import { DEFAULT_MASCOT_ID, type EyeColor, type JerseyColor } from '../hooks/usePlayers'
import { BACKDROPS, DEFAULT_BACKDROP, MASCOTS_3D, type BackdropId } from '../lib/mascot3d'
import { Mascot3DScene } from './Mascot3DScene'

/** A mascot's "spotlight" 3D preview (#106, #109) sized to sit in the same slot as the still
 * preview (JerseyGraphic size="lg": h-72 at 4:5). Default export so PlayerPreviewCard can
 * React.lazy() it -- the three.js bundle and the models are only downloaded once someone
 * switches to 3D. Only renders mascots listed in MASCOTS_3D; the caller (PlayerPreviewCard) is
 * responsible for not mounting this for a mascot without one.
 *
 * Locked to one-axis rotation (enableTilt=false): a horizontal drag spins the mascot like a
 * pedestal, but it can never be tipped onto its head -- the free-orbit POC page is the place for
 * checking a model from an odd angle, not this player-facing preview. */
export default function Mascot3DPreview({
  mascotId,
  jerseyColor,
  eyeColor,
  showBall,
  backdrop = DEFAULT_BACKDROP,
}: {
  mascotId?: string | null
  jerseyColor: JerseyColor | null
  eyeColor: EyeColor | null
  showBall: boolean
  backdrop?: BackdropId
}) {
  // drei's loading store is global, so it works outside the Canvas: `active` is true while the
  // model, ball and mask are downloading/decoding.
  const { active } = useProgress()
  const config = MASCOTS_3D[mascotId ?? DEFAULT_MASCOT_ID] ?? MASCOTS_3D[DEFAULT_MASCOT_ID]

  return (
    <div
      className={`relative h-72 aspect-[4/5] overflow-hidden rounded-xl ${BACKDROPS[backdrop].className}`}
      data-testid="mascot-3d"
    >
      <Mascot3DScene
        {...config}
        jerseyColor={jerseyColor}
        eyeColor={eyeColor}
        showBall={showBall}
        cameraPosition={config.previewCamera}
        enableZoom={false}
        enableTilt={false}
      />
      {active && (
        <p className="pointer-events-none absolute inset-0 grid place-items-center text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          Loading 3D model…
        </p>
      )}
    </div>
  )
}
