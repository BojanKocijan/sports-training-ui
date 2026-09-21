import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MascotViewer3D } from './components/MascotViewer3D'

const MODEL_URL = encodeURI(
  '/images/basketball/u8 u10/Leon/Original size/Leo boy/anthropomorphic_lion_bones_fixed.glb',
)
const BALL_URL = encodeURI(
  '/images/basketball/u8 u10/Leon/Original size/Meshy_AI_cartoon_basketball_lo_0921102916_texture_1k.glb',
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MascotViewer3D modelUrl={MODEL_URL} ballUrl={BALL_URL} />
  </StrictMode>,
)
