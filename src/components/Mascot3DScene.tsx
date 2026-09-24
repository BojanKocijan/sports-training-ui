import { Center, ContactShadows, OrbitControls, useGLTF, useTexture } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Color, MathUtils, Quaternion, Spherical, Vector3, Vector4 } from 'three'
import type { Group, Mesh, MeshStandardMaterial, Object3D, Texture } from 'three'
import type { EyeColor, JerseyColor } from '../hooks/usePlayers'
import { DEFAULT_JERSEY_TINT, DEFAULT_POSE, EYE_TINTS, JERSEY_TINTS, POSES, type PoseId } from '../lib/mascot3d'

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
// The tone table (3D iris lightness -> still-art iris base lightness, piecewise linear) is
// measured per mascot -- see lib/mascot3d.ts -- since each atlas's iris is its own painting.
const glslFloats = (v: number[]) => v.map((n) => n.toFixed(4)).join(', ')

// Declarations (uniforms, tone table and helper) go above main(); the body replaces map_fragment.
// Baked into the GLSL source (not a uniform array) because the table's length varies per mascot.
function regionTintDecls(irisToneX: number[], irisToneY: number[]) {
  return /* glsl */ `
uniform sampler2D uRegionMask;
uniform vec3 uJerseyTint;
uniform vec4 uEyeTint;
const float IRIS_X[${irisToneX.length}] = float[${irisToneX.length}](${glslFloats(irisToneX)});
const float IRIS_Y[${irisToneY.length}] = float[${irisToneY.length}](${glslFloats(irisToneY)});
float irisTone( float l ) {
  for ( int i = 0; i < ${irisToneX.length - 1}; i++ ) {
    if ( l < IRIS_X[i + 1] ) return mix( IRIS_Y[i], IRIS_Y[i + 1], ( l - IRIS_X[i] ) / ( IRIS_X[i + 1] - IRIS_X[i] ) );
  }
  return IRIS_Y[${irisToneY.length - 1}];
}
`
}

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

function useRegionTint(
  scene: Group,
  mask: Texture,
  jerseyHex: string,
  eyeHex: string | null,
  irisToneX: number[],
  irisToneY: number[],
) {
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
    const decls = regionTintDecls(irisToneX, irisToneY)
    scene.traverse((obj) => {
      const mat = (obj as Mesh).material as MeshStandardMaterial | undefined
      if (!(obj as Mesh).isMesh || !mat) return
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uRegionMask = uniforms.uRegionMask
        shader.uniforms.uJerseyTint = uniforms.uJerseyTint
        shader.uniforms.uEyeTint = uniforms.uEyeTint
        shader.fragmentShader = `${decls}\n${shader.fragmentShader}`.replace(
          '#include <map_fragment>',
          REGION_TINT_GLSL,
        )
      }
      // The tone table is baked into the shader source, so two mascots must not share a cache key.
      const cacheKey = `region-tint-${irisToneX.join(',')}-${irisToneY.join(',')}`
      mat.customProgramCacheKey = () => cacheKey
      mat.needsUpdate = true
    })
  }, [scene, uniforms, irisToneX, irisToneY])

  useEffect(() => {
    uniforms.uJerseyTint.value.set(jerseyHex)
  }, [uniforms, jerseyHex])

  useEffect(() => {
    const iris = new Color(eyeHex ?? DEFAULT_JERSEY_TINT)
    uniforms.uEyeTint.value.set(iris.r, iris.g, iris.b, eyeHex ? 1 : 0)
  }, [uniforms, eyeHex])
}

// Upper-arm bones swung down from a T-pose. The right arm points to -x and the left to +x (the
// mascot faces +z), so a rotation about the world z axis lowers them in opposite directions.
const ARM_BONES = [
  ['mixamorigRightArm', 1],
  ['mixamorigLeftArm', -1],
] as const

function useArmsDown(scene: Group, degrees: number | undefined) {
  useEffect(() => {
    if (!degrees) return
    scene.updateWorldMatrix(true, true)
    const original: [Object3D, Quaternion][] = []
    for (const [name, sign] of ARM_BONES) {
      const bone = scene.getObjectByName(name)
      if (!bone?.parent) {
        console.warn(`Mascot3DScene: bone "${name}" not found; arm not lowered`)
        continue
      }
      original.push([bone, bone.quaternion.clone()])
      // Apply the swing in world space, then convert back to the bone's local space.
      const swing = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), sign * MathUtils.degToRad(degrees))
      const boneWorld = bone.getWorldQuaternion(new Quaternion())
      const parentWorld = bone.parent.getWorldQuaternion(new Quaternion())
      bone.quaternion.copy(parentWorld.invert().multiply(swing).multiply(boneWorld))
    }
    scene.updateWorldMatrix(true, true)
    // The loaded scene is cached and shared, so put the bones back or a remount bends them twice.
    return () => original.forEach(([bone, q]) => bone.quaternion.copy(q))
  }, [scene, degrees])
}

function MascotModel({
  modelUrl,
  ballUrl,
  regionMaskUrl,
  handBone,
  ballScale,
  ballOffset,
  irisToneX,
  irisToneY,
  armDownDegrees,
  jerseyColor,
  eyeColor,
  showBall,
  matte,
}: {
  modelUrl: string
  ballUrl: string
  regionMaskUrl: string
  handBone: string
  ballScale: number
  ballOffset: [number, number, number]
  irisToneX: number[]
  irisToneY: number[]
  armDownDegrees?: number
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
    irisToneX,
    irisToneY,
  )
  useArmsDown(scene, armDownDegrees)

  useEffect(() => {
    if (!showBall) return
    const hand = scene.getObjectByName(handBone)
    if (!hand) {
      console.warn(`Mascot3DScene: bone "${handBone}" not found; ball not attached`)
      return
    }
    ball.position.set(...ballOffset)
    ball.scale.setScalar(ballScale)
    hand.add(ball)
    return () => {
      hand.remove(ball)
    }
  }, [scene, ball, showBall, handBone, ballScale, ballOffset])

  return <primitive object={scene} />
}

/** A mascot's 3D canvas (sports-training-api#68, #99, #101, #104): the rigged Tripo export in
 * its rest pose, jersey and irises recoloured through a UV region mask, optionally holding a
 * ball parented to a hand bone. Fills its parent, so the parent decides the size. Every field
 * except jerseyColor/eyeColor/showBall/matte/cameraPosition/enableZoom comes straight from a
 * Mascot3DConfig (lib/mascot3d.ts) -- callers spread it in and pick which camera to use. */
export function Mascot3DScene({
  modelUrl,
  ballUrl,
  regionMaskUrl,
  handBone,
  ballScale,
  ballOffset,
  irisToneX,
  irisToneY,
  armDownDegrees,
  jerseyColor,
  eyeColor,
  showBall,
  matte = true,
  pose = DEFAULT_POSE,
  cameraPosition,
  enableZoom = true,
  enableTilt = true,
}: {
  modelUrl: string
  ballUrl: string
  regionMaskUrl: string
  handBone: string
  ballScale: number
  ballOffset: [number, number, number]
  irisToneX: number[]
  irisToneY: number[]
  armDownDegrees?: number
  jerseyColor: JerseyColor | null
  eyeColor: EyeColor | null
  showBall: boolean
  matte?: boolean
  /** Stance (#114). Arms only move for a mascot with `armDownDegrees` (real skin weights). */
  pose?: PoseId
  cameraPosition: [number, number, number]
  enableZoom?: boolean
  /** true (default): free orbit, for the dev POC page where seeing the model from any angle
   * matters. false: a "spotlight/turntable" lock -- only horizontal (azimuthal) rotation is
   * allowed, the vertical (polar) angle is pinned to cameraPosition's own, so a drag can never
   * tip the mascot onto its head or under its feet (#106, #109). */
  enableTilt?: boolean
}) {
  // The polar angle cameraPosition already frames the shot at; locking min/max to this value (and
  // leaving azimuth free) is the standard three.js OrbitControls recipe for a turntable restricted
  // to one axis. Recomputed only when the camera preset changes, not every render.
  const polarAngle = useMemo(
    () => new Spherical().setFromVector3(new Vector3(...cameraPosition)).phi,
    [cameraPosition],
  )

  return (
    <Canvas camera={{ position: cameraPosition, fov: 45 }}>
      {/* Deliberately bright and fairly flat: the still art is flat-lit, and three.js divides light
          by pi, so the defaults (0.8 / 1.2) rendered every multiplied colour darker than its swatch. */}
      <ambientLight intensity={1.8} />
      <directionalLight position={[3, 5, 2]} intensity={1.2} />
      <Suspense fallback={null}>
        <group rotation-x={MathUtils.degToRad(POSES[pose].lean)} position-y={POSES[pose].lift}>
        <Center>
          <MascotModel
            modelUrl={modelUrl}
            ballUrl={ballUrl}
            regionMaskUrl={regionMaskUrl}
            handBone={handBone}
            ballScale={ballScale}
            ballOffset={ballOffset}
            irisToneX={irisToneX}
            irisToneY={irisToneY}
            armDownDegrees={armDownDegrees === undefined ? undefined : POSES[pose].armsDown(armDownDegrees)}
            jerseyColor={jerseyColor}
            eyeColor={eyeColor}
            showBall={showBall}
            matte={matte}
          />
        </Center>
        </group>
        {/* A soft contact shadow so the mascot stands on something, whatever the backdrop is. */}
        <ContactShadows position={[0, -0.5, 0]} opacity={0.45} scale={2.4} blur={2.6} far={1.2} resolution={256} />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={enableZoom}
        minPolarAngle={enableTilt ? undefined : polarAngle}
        maxPolarAngle={enableTilt ? undefined : polarAngle}
      />
    </Canvas>
  )
}
