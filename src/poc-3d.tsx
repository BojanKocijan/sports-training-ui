import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MascotViewer3D } from './components/MascotViewer3D'

const MODEL_URL = encodeURI(
  '/images/basketball/u8 u10/Leon/Original size/Leo boy/Meshy_AI_Leo_Hoops_0921094012_texture.glb',
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MascotViewer3D modelUrl={MODEL_URL} />
  </StrictMode>,
)
