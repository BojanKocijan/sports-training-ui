import { Center, OrbitControls, useGLTF, useTexture } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Color, Vector4 } from 'three'
import type { Group, Mesh, MeshStandardMaterial, Texture } from 'three'
import type { EyeColor, JerseyColor } from '../hooks/usePlayers'
import { DEFAULT_JERSEY_TINT, EYE_TINTS, JERSEY_TINTS } from '../lib/mascot3d'

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

// Two recolouring rules driven by one RGB mask (red = jersey, green = eye area):
//  - Jersey: multiply the base colour by the tint. The jersey art is white with black trim, so
//    white becomes the tint and the trim stays black.
//  - Iris: same recipe as the still image, whose base art has a GREY iris with a flat colour
//    multiplied over it and the white highlights layered on top. Inside the eye area only the iris
//    texels are used (lightness < ~0.5; the sclera and highlights are 0.65+, measured with a clean
//    gap between them). The 3D atlas iris is much darker and distributed differently from the
//    still art's (still: a big black pupil, over half the iris, inside a bright ring), so its
//    lightness is HISTOGRAM-MATCHED to the still art's: each 3D lightness is mapped to the still
//    art's value at the same quantile (points measured offline from the two images). The mapped
//    grey is then multiplied by the swatch colour in sRGB like CSS mix-blend-mode: multiply does.
// 3D iris lightness -> still-art iris base lightness, piecewise linear.
const IRIS_TONE_X = [0.0, 0.046, 0.101, 0.205, 0.252, 0.298, 0.348, 0.384, 0.45]
const IRIS_TONE_Y = [0.0, 0.004, 0.027, 0.081, 0.129, 0.251, 0.471, 0.621, 0.7]
const glslFloats = (v: number[]) => v.map((n) => n.toFixed(4)).join(', ')

// Declarations (uniforms, tone table and helper) go above main(); the body replaces map_fragment.
const REGION_TINT_DECLS = /* glsl */ `
uniform sampler2D uRegionMask;
uniform vec3 uJerseyTint;
uniform vec4 uEyeTint;
const float IRIS_X[${IRIS_TONE_X.length}] = float[${IRIS_TONE_X.length}](${glslFloats(IRIS_TONE_X)});
const float IRIS_Y[${IRIS_TONE_Y.length}] = float[${IRIS_TONE_Y.length}](${glslFloats(IRIS_TONE_Y)});
float irisTone( float l ) {
  for ( int i = 0; i < ${IRIS_TONE_X.length - 1}; i++ ) {
    if ( l < IRIS_X[i + 1] ) return mix( IRIS_Y[i], IRIS_Y[i + 1], ( l - IRIS_X[i] ) / ( IRIS_X[i + 1] - IRIS_X[i] ) );
  }
  return IRIS_Y[${IRIS_TONE_Y.length - 1}];
}
`

const REGION_TINT_GLSL = /* glsl */ `
#include <map_fragment>
#ifdef USE_MAP
  vec3 regionMask = texture2D( uRegionMask, vMapUv ).rgb;
  diffuseColor.rgb = mix( diffuseColor.rgb, diffuseColor.rgb * uJerseyTint, regionMask.r );
  float texelLuma = dot( pow( diffuseColor.rgb, vec3( 1.0 / 2.2 ) ), vec3( 0.299, 0.587, 0.114 ) );
  float iris = regionMask.g * ( 1.0 - smoothstep( 0.47, 0.60, texelLuma ) ) * uEyeTint.a;
  vec3 irisSrgb = pow( uEyeTint.rgb, vec3( 1.0 / 2.2 ) ) * irisTone( texelLuma );
  diffuseColor.rgb = mix( diffuseColor.rgb, pow( irisSrgb, vec3( 2.2 ) ), iris );
#endif
`

function useRegionTint(scene: Group, mask: Texture, jerseyHex: string, eyeHex: string | null) {
  const uniforms = useMemo(
    () => ({
      uRegionMask: { value: mask },
      uJerseyTint: { value: new Color(DEFAULT_JERSEY_TINT) },
      // rgb = iris colour, a = 1 when an eye colour is chosen, 0 to leave the authored eyes
      uEyeTint: { value: new Vector4(0, 0, 0, 0) },
    }),
    [mask],
  )

  useEffect(() => {
    scene.traverse((obj) => {
      const mat = (obj as Mesh).material as MeshStandardMaterial | undefined
      if (!(obj as Mesh).isMesh || !mat) return
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uRegionMask = uniforms.uRegionMask
        shader.uniforms.uJerseyTint = uniforms.uJerseyTint
        shader.uniforms.uEyeTint = uniforms.uEyeTint
        shader.fragmentShader = `${REGION_TINT_DECLS}\n${shader.fragmentShader}`.replace(
          '#include <map_fragment>',
          REGION_TINT_GLSL,
        )
      }
      mat.customProgramCacheKey = () => 'region-tint'
      mat.needsUpdate = true
    })
  }, [scene, uniforms])

  useEffect(() => {
    uniforms.uJerseyTint.value.set(jerseyHex)
  }, [uniforms, jerseyHex])

  useEffect(() => {
    const iris = new Color(eyeHex ?? DEFAULT_JERSEY_TINT)
    uniforms.uEyeTint.value.set(iris.r, iris.g, iris.b, eyeHex ? 1 : 0)
  }, [uniforms, eyeHex])
}

function MascotModel({
  modelUrl,
  ballUrl,
  regionMaskUrl,
  jerseyColor,
  eyeColor,
  showBall,
  matte,
}: {
  modelUrl: string
  ballUrl: string
  regionMaskUrl: string
  jerseyColor: JerseyColor | null
  eyeColor: EyeColor | null
  showBall: boolean
  matte: boolean
}) {
  const { scene } = useGLTF(modelUrl)
  const { scene: ballSource } = useGLTF(ballUrl)
  const ball = useMemo(() => ballSource.clone(), [ballSource])
  // glTF UVs have their origin top-left, so the mask must not be flipped on upload.
  const mask = useTexture(regionMaskUrl, (t) => {
    ;(Array.isArray(t) ? t : [t]).forEach((tex) => {
      tex.flipY = false
    })
  })

  useMatte(scene, matte)
  useMatte(ball, matte)
  useRegionTint(
    scene,
    mask,
    jerseyColor ? JERSEY_TINTS[jerseyColor] : DEFAULT_JERSEY_TINT,
    eyeColor ? EYE_TINTS[eyeColor] : null,
  )

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

/** The lion's 3D canvas (sports-training-api#68, #99, #101): the rigged Tripo export in its rest
 * pose, jersey and irises recoloured through a UV region mask, optionally holding a ball parented to a hand bone.
 * Fills its parent, so the parent decides the size. */
export function Mascot3DScene({
  modelUrl,
  ballUrl,
  regionMaskUrl,
  jerseyColor,
  eyeColor,
  showBall,
  matte = true,
  cameraPosition,
  enableZoom = true,
}: {
  modelUrl: string
  ballUrl: string
  regionMaskUrl: string
  jerseyColor: JerseyColor | null
  eyeColor: EyeColor | null
  showBall: boolean
  matte?: boolean
  cameraPosition: [number, number, number]
  enableZoom?: boolean
}) {
  return (
    <Canvas camera={{ position: cameraPosition, fov: 45 }}>
      {/* Deliberately bright and fairly flat: the still art is flat-lit, and three.js divides light
          by pi, so the defaults (0.8 / 1.2) rendered every multiplied colour darker than its swatch. */}
      <ambientLight intensity={1.8} />
      <directionalLight position={[3, 5, 2]} intensity={1.2} />
      <Suspense fallback={null}>
        <Center>
          <MascotModel
            modelUrl={modelUrl}
            ballUrl={ballUrl}
            regionMaskUrl={regionMaskUrl}
            jerseyColor={jerseyColor}
            eyeColor={eyeColor}
            showBall={showBall}
            matte={matte}
          />
        </Center>
      </Suspense>
      <OrbitControls enablePan={false} enableZoom={enableZoom} />
    </Canvas>
  )
}
