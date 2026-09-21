import { Center, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import type { Group, Mesh, MeshStandardMaterial, Texture } from 'three'

/**
 * POC only (sports-training-api#68, #96) — loads Leon's rigged export in its rest pose (no
 * animation clip is played) and parents a small basketball to one of his hand bones, so the
 * ball follows the hand in any pose.
 *
 * The Tripo export ("anthropomorphic lion") shipped with two skeleton defects that made three.js
 * render it garbled: bone nodes had no transforms, and the bind matrices were turned 90 degrees
 * about Y relative to the mesh. `anthropomorphic_lion_bones_fixed.glb` is the original file with
 * both repaired (mesh, weights and textures untouched).
 */

// Mixamo-style rig. The GLB names it 'mixamorig:RightHand', but three.js strips the
// colon from node names on load. Swap to 'mixamorigLeftHand' to put the ball in the other hand.
const HAND_BONE = 'mixamorigRightHand'
// The ball export is ~1.9 units across and this lion is ~0.98 tall; this scale makes the ball ~0.14 wide.
const BALL_SCALE = 0.075
// Offset in the hand bone's local space (bone axis runs along +Y from the wrist).
const BALL_OFFSET: [number, number, number] = [0, 0.06, 0]

type PbrOriginals = {
  normalMap: Texture | null
  metalnessMap: Texture | null
  roughnessMap: Texture | null
  metalness: number
  roughness: number
}

// The exports bake shading into their normal + metallic/roughness maps. "Matte" drops
// them (flat, cartoon-like look); toggling off restores the originals.
function useMatte(scene: Group, matte: boolean) {
  const originals = useRef(new Map<MeshStandardMaterial, PbrOriginals>())

  useEffect(() => {
    scene.traverse((obj) => {
      const mat = (obj as Mesh).material as MeshStandardMaterial | undefined
      if (!(obj as Mesh).isMesh || !mat) return
      if (!originals.current.has(mat)) {
        originals.current.set(mat, {
          normalMap: mat.normalMap,
          metalnessMap: mat.metalnessMap,
          roughnessMap: mat.roughnessMap,
          metalness: mat.metalness,
          roughness: mat.roughness,
        })
      }
      const o = originals.current.get(mat)!
      mat.normalMap = matte ? null : o.normalMap
      mat.metalnessMap = matte ? null : o.metalnessMap
      mat.roughnessMap = matte ? null : o.roughnessMap
      mat.metalness = matte ? 0 : o.metalness
      mat.roughness = matte ? 1 : o.roughness
      mat.needsUpdate = true
    })
  }, [scene, matte])
}

function MascotModel({ url, ballUrl, matte }: { url: string; ballUrl: string; matte: boolean }) {
  const { scene } = useGLTF(url)
  const { scene: ballSource } = useGLTF(ballUrl)
  const ball = useMemo(() => ballSource.clone(), [ballSource])

  useMatte(scene, matte)
  useMatte(ball, matte)

  useEffect(() => {
    const hand = scene.getObjectByName(HAND_BONE)
    if (!hand) {
      console.warn(`MascotViewer3D: bone "${HAND_BONE}" not found; ball not attached`)
      return
    }
    ball.position.set(...BALL_OFFSET)
    ball.scale.setScalar(BALL_SCALE)
    hand.add(ball)
    return () => {
      hand.remove(ball)
    }
  }, [scene, ball])

  return <primitive object={scene} />
}

export function MascotViewer3D({ modelUrl, ballUrl }: { modelUrl: string; ballUrl: string }) {
  const [matte, setMatte] = useState(true)

  return (
    <div className="viewer">
      <Canvas camera={{ position: [1.8, 0.8, 3.2], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />
        <Suspense fallback={null}>
          <Center>
            <MascotModel url={modelUrl} ballUrl={ballUrl} matte={matte} />
          </Center>
        </Suspense>
        <OrbitControls enablePan={false} />
      </Canvas>
      <label className="matte-toggle">
        <input type="checkbox" checked={matte} onChange={(e) => setMatte(e.target.checked)} />
        Matte
      </label>
    </div>
  )
}
