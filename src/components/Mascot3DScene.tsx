import { Center, OrbitControls, useGLTF, useTexture } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Color, MathUtils, Quaternion, Vector3, Vector4 } from 'three'
import type { Group, Mesh, MeshStandardMaterial, Object3D, Texture } from 'three'
import type { EyeColor, JerseyColor } from '../hooks/usePlayers'
import { DEFAULT_JERSEY_TINT, EYE_TINTS, JERSEY_TINTS, type Mascot3DConfig } from '../lib/mascot3d'

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
const glslFloats = (v: number[]) => v.map((n) => n.toFixed(4)).join(', ')

/** The two shader chunks for one mascot. The iris tone table differs per model, so the GLSL is
 * built from the config. Declarations (uniforms, tone table, helper) go above main(); the body
 * replaces map_fragment. */
function buildTintShader(iris: Mascot3DConfig['irisTone']) {
  const n = iris.x.length
  const decls = /* glsl */ `
uniform sampler2D uRegionMask;
uniform vec3 uJerseyTint;
uniform vec4 uEyeTint;
const float IRIS_X[${n}] = float[${n}](${glslFloats(iris.x)});
const float IRIS_Y[${n}] = float[${n}](${glslFloats(iris.y)});
float irisTone( float l ) {
  for ( int i = 0; i < ${n - 1}; i++ ) {
    if ( l < IRIS_X[i + 1] ) return mix( IRIS_Y[i], IRIS_Y[i + 1], ( l - IRIS_X[i] ) / ( IRIS_X[i + 1] - IRIS_X[i] ) );
  }
  return IRIS_Y[${n - 1}];
}
`
  const body = /* glsl */ `
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
  return { decls, body }
}

function useRegionTint(
  scene: Group,
  mask: Texture,
  jerseyHex: string,
  eyeHex: string | null,
  irisTone: Mascot3DConfig['irisTone'],
) {
  const shader = useMemo(() => buildTintShader(irisTone), [irisTone])
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
      mat.onBeforeCompile = (compiled) => {
        compiled.uniforms.uRegionMask = uniforms.uRegionMask
        compiled.uniforms.uJerseyTint = uniforms.uJerseyTint
        compiled.uniforms.uEyeTint = uniforms.uEyeTint
        compiled.fragmentShader = `${shader.decls}\n${compiled.fragmentShader}`.replace(
          '#include <map_fragment>',
          shader.body,
        )
      }
      // The compiled program depends on the tone table, so it must be part of the cache key.
      mat.customProgramCacheKey = () => `region-tint-${irisTone.x.join(',')}`
      mat.needsUpdate = true
    })
  }, [scene, uniforms, shader, irisTone])

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
  config,
  jerseyColor,
  eyeColor,
  showBall,
  matte,
}: {
  config: Mascot3DConfig
  jerseyColor: JerseyColor | null
  eyeColor: EyeColor | null
  showBall: boolean
  matte: boolean
}) {
  const { scene } = useGLTF(config.modelUrl)
  const { scene: ballSource } = useGLTF(config.ballUrl)
  const ball = useMemo(() => ballSource.clone(), [ballSource])
  // glTF UVs have their origin top-left, so the mask must not be flipped on upload.
  const mask = useTexture(config.regionMaskUrl, (t) => {
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
    config.irisTone,
  )
  useArmsDown(scene, config.armDownDegrees)

  useEffect(() => {
    if (!showBall) return
    const hand = scene.getObjectByName(config.ball.bone)
    if (!hand) {
      console.warn(`Mascot3DScene: bone "${config.ball.bone}" not found; ball not attached`)
      return
    }
    ball.position.set(...config.ball.offset)
    ball.scale.setScalar(config.ball.scale)
    hand.add(ball)
    return () => {
      hand.remove(ball)
    }
  }, [scene, ball, showBall, config.ball])

  return <primitive object={scene} />
}

/** A mascot's 3D canvas (sports-training-api#68, #99, #101, #104): the rigged Tripo export in its
 * rest pose (arms lowered in code when its config asks), jersey and irises recoloured through a UV
 * region mask, optionally holding a ball parented to a hand bone. Fills its parent, so the parent
 * decides the size. */
export function Mascot3DScene({
  config,
  jerseyColor,
  eyeColor,
  showBall,
  matte = true,
  cameraPosition,
  enableZoom = true,
}: {
  config: Mascot3DConfig
  jerseyColor: JerseyColor | null
  eyeColor: EyeColor | null
  showBall: boolean
  matte?: boolean
  /** Overrides the config's preview camera (the hidden POC page uses a wider shot). */
  cameraPosition?: [number, number, number]
  enableZoom?: boolean
}) {
  return (
    <Canvas camera={{ position: cameraPosition ?? config.cameraPosition, fov: 45 }}>
      {/* Deliberately bright and fairly flat: the still art is flat-lit, and three.js divides light
          by pi, so the defaults (0.8 / 1.2) rendered every multiplied colour darker than its swatch. */}
      <ambientLight intensity={1.8} />
      <directionalLight position={[3, 5, 2]} intensity={1.2} />
      <Suspense fallback={null}>
        <Center>
          <MascotModel
            config={config}
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
