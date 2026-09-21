import { Center, OrbitControls, useGLTF, useTexture } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Color } from 'three'
import type { Group, Mesh, MeshStandardMaterial, Texture } from 'three'
import type { JerseyColor } from '../hooks/usePlayers'
import { DEFAULT_JERSEY_TINT, JERSEY_TINTS } from '../lib/mascot3d'

// Mixamo-style rig. The GLB names it 'mixamorig:RightHand', but three.js strips the
// colon from node names on load. Swap to 'mixamorigLeftHand' to put the ball in the other hand.
const HAND_BONE = 'mixamorigRightHand'
// The ball export is ~1.9 units across and this lion is ~0.98 tall; this scale makes the ball ~0.14 wide.
const BALL_SCALE = 0.075
// Offset in the hand bone's local space (bone axis runs along +Y from the wrist, i.e. along the
// fingers). 0.155 puts the ball just past the fingertips so the hand rests on top of it; smaller
// values bury the hand inside the ball.
const BALL_OFFSET: [number, number, number] = [0, 0.155, 0]

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

// Multiplies the base colour by the tint where the mask is white. The jersey art is white with
// black trim, so white becomes the tint and the trim stays black. The 1.12 gain offsets the
// darkening a saturated multiply gives on the slightly grey (not pure white) fabric.
const JERSEY_TINT_GLSL = /* glsl */ `
#include <map_fragment>
#ifdef USE_MAP
  float jerseyMask = texture2D( uJerseyMask, vMapUv ).r;
  diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * uJerseyTint * 1.12, jerseyMask );
#endif
`

function useJerseyTint(scene: Group, mask: Texture, tintHex: string) {
  const uniforms = useMemo(
    () => ({ uJerseyMask: { value: mask }, uJerseyTint: { value: new Color(DEFAULT_JERSEY_TINT) } }),
    [mask],
  )

  useEffect(() => {
    scene.traverse((obj) => {
      const mat = (obj as Mesh).material as MeshStandardMaterial | undefined
      if (!(obj as Mesh).isMesh || !mat) return
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uJerseyMask = uniforms.uJerseyMask
        shader.uniforms.uJerseyTint = uniforms.uJerseyTint
        shader.fragmentShader = `uniform sampler2D uJerseyMask;\nuniform vec3 uJerseyTint;\n${shader.fragmentShader}`.replace(
          '#include <map_fragment>',
          JERSEY_TINT_GLSL,
        )
      }
      mat.customProgramCacheKey = () => 'jersey-tint'
      mat.needsUpdate = true
    })
  }, [scene, uniforms])

  useEffect(() => {
    uniforms.uJerseyTint.value.set(tintHex)
  }, [uniforms, tintHex])
}

function MascotModel({
  modelUrl,
  ballUrl,
  jerseyMaskUrl,
  jerseyColor,
  showBall,
  matte,
}: {
  modelUrl: string
  ballUrl: string
  jerseyMaskUrl: string
  jerseyColor: JerseyColor | null
  showBall: boolean
  matte: boolean
}) {
  const { scene } = useGLTF(modelUrl)
  const { scene: ballSource } = useGLTF(ballUrl)
  const ball = useMemo(() => ballSource.clone(), [ballSource])
  // glTF UVs have their origin top-left, so the mask must not be flipped on upload.
  const mask = useTexture(jerseyMaskUrl, (t) => {
    ;(Array.isArray(t) ? t : [t]).forEach((tex) => {
      tex.flipY = false
    })
  })

  useMatte(scene, matte)
  useMatte(ball, matte)
  useJerseyTint(scene, mask, jerseyColor ? JERSEY_TINTS[jerseyColor] : DEFAULT_JERSEY_TINT)

  useEffect(() => {
    if (!showBall) return
    const hand = scene.getObjectByName(HAND_BONE)
    if (!hand) {
      console.warn(`Mascot3DScene: bone "${HAND_BONE}" not found; ball not attached`)
      return
    }
    ball.position.set(...BALL_OFFSET)
    ball.scale.setScalar(BALL_SCALE)
    hand.add(ball)
    return () => {
      hand.remove(ball)
    }
  }, [scene, ball, showBall])

  return <primitive object={scene} />
}

/** The lion's 3D canvas (sports-training-api#68, #99): the rigged Tripo export in its rest
 * pose, jersey tinted through a UV mask, optionally holding a ball parented to a hand bone.
 * Fills its parent, so the parent decides the size. */
export function Mascot3DScene({
  modelUrl,
  ballUrl,
  jerseyMaskUrl,
  jerseyColor,
  showBall,
  matte = true,
  cameraPosition,
  enableZoom = true,
}: {
  modelUrl: string
  ballUrl: string
  jerseyMaskUrl: string
  jerseyColor: JerseyColor | null
  showBall: boolean
  matte?: boolean
  cameraPosition: [number, number, number]
  enableZoom?: boolean
}) {
  return (
    <Canvas camera={{ position: cameraPosition, fov: 45 }}>
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, 5, 2]} intensity={1.2} />
      <Suspense fallback={null}>
        <Center>
          <MascotModel
            modelUrl={modelUrl}
            ballUrl={ballUrl}
            jerseyMaskUrl={jerseyMaskUrl}
            jerseyColor={jerseyColor}
            showBall={showBall}
            matte={matte}
          />
        </Center>
      </Suspense>
      <OrbitControls enablePan={false} enableZoom={enableZoom} />
    </Canvas>
  )
}
