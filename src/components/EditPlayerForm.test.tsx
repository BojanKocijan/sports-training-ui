import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Player } from '../hooks/usePlayers'
import { EditPlayerForm } from './EditPlayerForm'

vi.mock('./player-form/JerseyColorPicker', () => ({
  JerseyColorPicker: () => null,
}))

vi.mock('./player-form/MascotPicker', () => ({
  MascotPicker: () => null,
}))

vi.mock('./player-form/PlayerPreviewCard', () => ({
  PlayerPreviewCard: () => null,
}))

const player: Player = {
  id: 'player-1',
  group_id: 'u8',
  nickname: 'Mila',
  jersey_number: 12,
  jersey_color: 'blue',
  height_cm: 128,
  weight_kg: 27,
  mascot_id: 'lion',
  created_at: '2026-09-01T10:00:00.000Z',
  updated_at: '2026-09-01T10:00:00.000Z',
}

describe('EditPlayerForm', () => {
  it('allows promotion to another available group and excludes coming-soon groups', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()

    render(
      <EditPlayerForm
        player={player}
        groups={[
          {
            id: 'u8',
            name: 'U8',
            status: 'available',
          },
          {
            id: 'u10',
            name: 'U10',
            status: 'available',
          },
          {
            id: 'u12',
            name: 'U12',
            status: 'coming_soon',
          },
        ]}
        saving={false}
        saveError={null}
        onCancel={() => {}}
        onSave={onSave}
      />,
    )

    const groupSelect = screen.getByLabelText(/group/i)

    expect(groupSelect).toHaveValue('u8')
    expect(screen.getByRole('option', { name: 'U8' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'U10' })).toBeInTheDocument()
    expect(
      screen.queryByRole('option', { name: 'U12' }),
    ).not.toBeInTheDocument()

    await user.selectOptions(groupSelect, 'u10')

    expect(groupSelect).toHaveValue('u10')

    await user.click(screen.getByRole('button', { name: /^save$/i }))

    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith(
      'Mila',
      12,
      'blue',
      128,
      27,
      'u10',
      'lion',
    )
  })
})
