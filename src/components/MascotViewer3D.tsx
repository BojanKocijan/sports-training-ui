import { OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'

/**
 * POC only (sports-training-api#68) — loads a raw Meshy export with no rig, no animation,
 * and one baked (unsplit) material. This proves the react-three-fiber rendering pipeline and
 * gives real load-time/perf numbers on a ~1.34M-triangle mesh; it does not attempt per-region
 * recoloring or animation, both blocked on a properly rigged/segmented re-export.
 */
function MascotModel({ url }: { url: string }) {
  const { scene } = useGLTF(url)
  return <primitive object={scene} />
}

export function MascotViewer3D({ modelUrl }: { modelUrl: string }) {
  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1a1a1a' }}>
      <Canvas camera={{ position: [0, 1, 3], fov: 45 }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[3, 5, 2]} intensity={1.2} />
        <Suspense fallback={null}>
          <MascotModel url={modelUrl} />
        </Suspense>
        <OrbitControls enablePan={false} />
      </Canvas>
    </div>
  )
}
