import { useState } from 'react'
import { EYE_COLORS, JERSEY_COLORS, type EyeColor, type JerseyColor } from '../hooks/usePlayers'
import { MASCOTS_3D } from '../lib/mascot3d'
import { Mascot3DScene } from './Mascot3DScene'

const MASCOT_IDS = Object.keys(MASCOTS_3D)

/** Standalone full-page viewer for the hidden POC page (`/poc-3d.html`, sports-training-api#68):
 * the same scene the player form embeds, plus dev controls for the mascot, matte shading, the
 * ball, the jersey colour and the eye colour -- so two mascots can be checked side by side
 * (#104). Styling lives in poc-3d.html.
 *
 * Tripo exports have shipped with two skeleton defects that made three.js render them garbled:
 * bone nodes with no transforms, and bind matrices in a different frame from the mesh. Each
 * mascot's `..._bones_fixed.glb` is the original file with both repaired (mesh, weights and
 * textures untouched) -- see docs/3d-mascot.md and scripts/mascot3d/repair_rig.py. */
export function MascotViewer3D() {
  const [mascotId, setMascotId] = useState(MASCOT_IDS[0])
  const [matte, setMatte] = useState(true)
  const [showBall, setShowBall] = useState(true)
  const [jerseyColor, setJerseyColor] = useState<JerseyColor | null>(null)
  const [eyeColor, setEyeColor] = useState<EyeColor | null>(null)
  const config = MASCOTS_3D[mascotId]

  return (
    <div className="viewer">
      <Mascot3DScene
        key={mascotId}
        {...config}
        jerseyColor={jerseyColor}
        eyeColor={eyeColor}
        showBall={showBall}
        matte={matte}
        cameraPosition={config.pocCamera}
      />
      <div className="viewer-controls">
        <label>
          Mascot
          <select value={mascotId} onChange={(e) => setMascotId(e.target.value)}>
            {MASCOT_IDS.map((id) => (
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
