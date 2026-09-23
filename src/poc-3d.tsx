import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MascotViewer3D } from './components/MascotViewer3D'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MascotViewer3D />
  </StrictMode>,
)
