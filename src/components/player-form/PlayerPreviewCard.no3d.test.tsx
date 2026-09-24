import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PlayerPreviewCard } from './PlayerPreviewCard'

// The 3D mascot is off in the app for now (MASCOT_3D_ENABLED = false, #114 parked): even a mascot
// that has a 3D model only gets the still image, with no 3D toggle, ball switch or backdrops.
describe('PlayerPreviewCard with the 3D mascot switched off', () => {
  it('shows no 3D toggle or 3D controls', () => {
    render(
      <PlayerPreviewCard nickname="Leo" jerseyColor="blue" jerseyNumber={7} groupId="u8" mascotId="lion" />,
    )
    expect(screen.queryByRole('button', { name: '3D model' })).not.toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Backdrop' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Ball')).not.toBeInTheDocument()
  })
})
