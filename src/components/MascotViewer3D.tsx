import { useState } from 'react'
import { EYE_COLORS, JERSEY_COLORS, type EyeColor, type JerseyColor } from '../hooks/usePlayers'
import { MASCOTS_3D } from '../lib/mascot3d'
import { Mascot3DScene } from './Mascot3DScene'

/** Standalone full-page viewer for the hidden POC page (`/poc-3d.html`, sports-training-api#68):
 * the same scene the player form embeds, plus dev controls for the mascot, matte shading, the
 * ball, the jersey colour and the eye colour. Styling lives in poc-3d.html.
 *
 * The Tripo export ("anthropomorphic lion") shipped with two skeleton defects that made three.js
 * render it garbled: bone nodes had no transforms, and the bind matrices were turned 90 degrees
 * about Y relative to the mesh. `anthropomorphic_lion_v2_bones_fixed.glb` is the original file
 * with both repaired (mesh, weights and textures untouched). */
export function MascotViewer3D() {
  const [mascot, setMascot] = useState<keyof typeof MASCOTS_3D>('lion')
  const [matte, setMatte] = useState(true)
  const [showBall, setShowBall] = useState(true)
  const [jerseyColor, setJerseyColor] = useState<JerseyColor | null>(null)
  const [eyeColor, setEyeColor] = useState<EyeColor | null>(null)

  return (
    <div className="viewer">
      <Mascot3DScene
        config={MASCOTS_3D[mascot]}
        jerseyColor={jerseyColor}
        eyeColor={eyeColor}
        showBall={showBall}
        matte={matte}
        cameraPosition={[1.8, 0.8, 3.2]}
      />
      <div className="viewer-controls">
        <label>
          Mascot
          <select value={mascot} onChange={(e) => setMascot(e.target.value)}>
            {Object.keys(MASCOTS_3D).map((id) => (
              <option key={id} value={id}>
                {id}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input type="checkbox" checked={matte} onChange={(e) => setMatte(e.target.checked)} />
          Matte
        </label>
        <label>
          <input type="checkbox" checked={showBall} onChange={(e) => setShowBall(e.target.checked)} />
          Ball
        </label>
        <label>
          Jersey
          <select
            value={jerseyColor ?? ''}
            onChange={(e) => setJerseyColor((e.target.value || null) as JerseyColor | null)}
          >
            <option value="">(none)</option>
            {JERSEY_COLORS.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </label>
        <label>
          Eyes
          <select
            value={eyeColor ?? ''}
            onChange={(e) => setEyeColor((e.target.value || null) as EyeColor | null)}
          >
            <option value="">(none)</option>
            {EYE_COLORS.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
