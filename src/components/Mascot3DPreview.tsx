import { useProgress } from '@react-three/drei'
import type { EyeColor, JerseyColor } from '../hooks/usePlayers'
import { LION_3D } from '../lib/mascot3d'
import { Mascot3DScene } from './Mascot3DScene'

/** The 3D lion sized to sit in the same slot as the still preview (JerseyGraphic size="lg":
 * h-72 at 4:5). Default export so PlayerPreviewCard can React.lazy() it -- the three.js bundle
 * and ~2MB of models are only downloaded once someone switches to 3D. */
export default function Mascot3DPreview({
  jerseyColor,
  eyeColor,
  showBall,
}: {
  jerseyColor: JerseyColor | null
  eyeColor: EyeColor | null
  showBall: boolean
}) {
  // drei's loading store is global, so it works outside the Canvas: `active` is true while the
  // model, ball and mask are downloading/decoding.
  const { active } = useProgress()

  return (
    <div
      className="relative h-72 aspect-[4/5] overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800"
      data-testid="mascot-3d"
    >
      <Mascot3DScene
        {...LION_3D}
        jerseyColor={jerseyColor}
        eyeColor={eyeColor}
        showBall={showBall}
        cameraPosition={[0.85, 0.1, 1.45]}
        enableZoom={false}
      />
      {active && (
        <p className="pointer-events-none absolute inset-0 grid place-items-center text-xs font-semibold text-neutral-500 dark:text-neutral-400">
          Loading 3D model…
        </p>
      )}
    </div>
  )
}
