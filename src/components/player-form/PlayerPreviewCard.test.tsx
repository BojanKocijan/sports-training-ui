import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { PlayerPreviewCard } from './PlayerPreviewCard'

const state = vi.hoisted(() => ({ throwOnRender: false }))

// three.js needs WebGL, which happy-dom doesn't have -- the real scene is covered by the POC
// page; these tests are about the toggle wiring around it.
vi.mock('../Mascot3DPreview', () => ({
  default: ({
    mascotId,
    jerseyColor,
    eyeColor,
    showBall,
  }: {
    mascotId: string
    jerseyColor: string | null
    eyeColor: string | null
    showBall: boolean
  }) => {
    if (state.throwOnRender) throw new Error('WebGL unavailable')
    return (
      <div
        data-testid="mascot-3d"
        data-mascot={mascotId}
        data-color={jerseyColor ?? ''}
        data-eyes={eyeColor ?? ''}
        data-ball={String(showBall)}
      />
    )
  },
}))

vi.mock('../JerseyGraphic', () => ({
  JerseyGraphic: ({ mascotId }: { mascotId?: string | null }) => (
    <div data-testid="still" data-mascot={mascotId ?? ''} />
  ),
}))

const baseProps = { nickname: 'Mila', jerseyColor: 'blue' as const, jerseyNumber: 7 }

afterEach(() => {
  state.throwOnRender = false
  vi.restoreAllMocks()
})

describe('PlayerPreviewCard', () => {
  it('shows the still image by default, with a still/3D toggle for the lion', () => {
    render(<PlayerPreviewCard {...baseProps} mascotId="lion" />)

    expect(screen.getByTestId('still')).toBeInTheDocument()
    expect(screen.queryByTestId('mascot-3d')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Still image' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '3D model' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('treats a missing mascotId as the default lion', () => {
    render(<PlayerPreviewCard {...baseProps} />)

    expect(screen.getByRole('button', { name: '3D model' })).toBeInTheDocument()
  })

  it('switches to the 3D model and passes the jersey colour through', async () => {
    const user = userEvent.setup()
    render(<PlayerPreviewCard {...baseProps} mascotId="lion" />)

    await user.click(screen.getByRole('button', { name: '3D model' }))

    const model = await screen.findByTestId('mascot-3d')
    expect(model).toHaveAttribute('data-color', 'blue')
    expect(screen.queryByTestId('still')).not.toBeInTheDocument()
  })

  it('follows jersey colour changes while in 3D and can switch back to the still image', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<PlayerPreviewCard {...baseProps} mascotId="lion" />)
    await user.click(screen.getByRole('button', { name: '3D model' }))
    expect(await screen.findByTestId('mascot-3d')).toHaveAttribute('data-color', 'blue')

    rerender(<PlayerPreviewCard {...baseProps} jerseyColor="red" mascotId="lion" />)
    expect(screen.getByTestId('mascot-3d')).toHaveAttribute('data-color', 'red')

    await user.click(screen.getByRole('button', { name: 'Still image' }))
    expect(screen.getByTestId('still')).toBeInTheDocument()
    expect(screen.queryByTestId('mascot-3d')).not.toBeInTheDocument()
  })

  it('passes the eye colour to the 3D model, and none when no eye colour is chosen', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<PlayerPreviewCard {...baseProps} eyeColor="green" mascotId="lion" />)
    await user.click(screen.getByRole('button', { name: '3D model' }))
    expect(await screen.findByTestId('mascot-3d')).toHaveAttribute('data-eyes', 'green')

    rerender(<PlayerPreviewCard {...baseProps} eyeColor="brown" mascotId="lion" />)
    expect(screen.getByTestId('mascot-3d')).toHaveAttribute('data-eyes', 'brown')

    rerender(<PlayerPreviewCard {...baseProps} eyeColor={null} mascotId="lion" />)
    expect(screen.getByTestId('mascot-3d')).toHaveAttribute('data-eyes', '')
  })

  it('has a ball switch that only appears in 3D and defaults to on', async () => {
    const user = userEvent.setup()
    render(<PlayerPreviewCard {...baseProps} mascotId="lion" />)
    expect(screen.queryByRole('checkbox', { name: 'Ball' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '3D model' }))
    const model = await screen.findByTestId('mascot-3d')
    const ball = screen.getByRole('checkbox', { name: 'Ball' })
    expect(ball).toBeChecked()
    expect(model).toHaveAttribute('data-ball', 'true')

    await user.click(ball)
    expect(screen.getByTestId('mascot-3d')).toHaveAttribute('data-ball', 'false')
  })

  it('offers no 3D toggle for a mascot without a 3D model', () => {
    render(<PlayerPreviewCard {...baseProps} mascotId="dolphin" />)

    expect(screen.getByTestId('still')).toHaveAttribute('data-mascot', 'dolphin')
    expect(screen.queryByRole('button', { name: '3D model' })).not.toBeInTheDocument()
  })

  it('offers 3D for the shark boy and tells the preview which mascot to show', async () => {
    const user = userEvent.setup()
    render(<PlayerPreviewCard {...baseProps} mascotId="shark" gender="boy" />)

    await user.click(screen.getByRole('button', { name: '3D model' }))

    expect(await screen.findByTestId('mascot-3d')).toHaveAttribute('data-mascot', 'shark')
  })

  it('treats a shark with no gender as a boy, like the still image does', () => {
    render(<PlayerPreviewCard {...baseProps} mascotId="shark" />)

    expect(screen.getByRole('button', { name: '3D model' })).toBeInTheDocument()
  })

  it('offers no 3D for the shark girl (only the boy model exists)', () => {
    render(<PlayerPreviewCard {...baseProps} mascotId="shark" gender="girl" />)

    expect(screen.getByTestId('still')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '3D model' })).not.toBeInTheDocument()
  })

  it('drops back to the still image when the gender changes to one without a model', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<PlayerPreviewCard {...baseProps} mascotId="shark" gender="boy" />)
    await user.click(screen.getByRole('button', { name: '3D model' }))
    await screen.findByTestId('mascot-3d')

    rerender(<PlayerPreviewCard {...baseProps} mascotId="shark" gender="girl" />)

    expect(screen.getByTestId('still')).toBeInTheDocument()
    expect(screen.queryByTestId('mascot-3d')).not.toBeInTheDocument()
  })

  it('drops back to the still image when the mascot changes away from the lion', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<PlayerPreviewCard {...baseProps} mascotId="lion" />)
    await user.click(screen.getByRole('button', { name: '3D model' }))
    await screen.findByTestId('mascot-3d')

    rerender(<PlayerPreviewCard {...baseProps} mascotId="dolphin" />)

    expect(screen.getByTestId('still')).toBeInTheDocument()
    expect(screen.queryByTestId('mascot-3d')).not.toBeInTheDocument()
  })

  it('falls back to the still image if the 3D view fails to render', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    state.throwOnRender = true
    const user = userEvent.setup()
    render(<PlayerPreviewCard {...baseProps} mascotId="lion" />)

    await user.click(screen.getByRole('button', { name: '3D model' }))

    expect(await screen.findByTestId('still')).toBeInTheDocument()
    expect(screen.queryByTestId('mascot-3d')).not.toBeInTheDocument()
  })
})
