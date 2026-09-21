import { Center, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useRef, useState } from 'react'
import type { Mesh, MeshStandardMaterial, Texture } from 'three'

/**
 * POC only (sports-training-api#68) — loads Leon's static (un-rigged) Meshy export. The rigged
 * export deformed the shoes, so poses are exported as separate static models instead.
 */

type PbrOriginals = {
  normalMap: Texture | null
  metalnessMap: Texture | null
  roughnessMap: Texture | null
  metalness: number
  roughness: number
}

function MascotModel({ url, matte }: { url: string; matte: boolean }) {
  const { scene } = useGLTF(url)
  const originals = useRef(new Map<MeshStandardMaterial, PbrOriginals>())

  // The Meshy export bakes shading into its normal + metallic/roughness maps. "Matte" drops
  // them (flat, cartoon-like look); toggling off restores the originals.
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

  return <primitive object={scene} />
}

export function MascotViewer3D({ modelUrl }: { modelUrl: string }) {
  const [matte, setMatte] = useState(true)

  return (
    <div className="viewer">
      <Canvas camera={{ position: [1.8, 0.8, 3.2], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />
        <Suspense fallback={null}>
          <Center>
            <MascotModel url={modelUrl} matte={matte} />
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
