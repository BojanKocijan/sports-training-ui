import {
  fireEvent,
  render,
  screen,
} from '@testing-library/react'
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import { SuperAdminDashboard } from './SuperAdminDashboard'

vi.mock('../hooks/useAdminOverview', () => ({
  useAdminOverview: () => ({
    loading: false,
    error: null,
    refresh: vi.fn(),

    overview: {
      stats: {
        workspaces: 1,
        staffAccounts: 1,
        platformAdmins: 1,
        groups: 2,
        players: 7,
      },

      workspaces: [
        {
          id: 'club-1',
          slug: 'basketball-app',
          name: 'Basketball App',
          tier: 'free',
          groupCount: 2,
          playerCount: 7,
          staffCount: 1,
          ownerCount: 1,
          primaryGroupId: 'u8',
        },
      ],

      access: [
        {
          userId: 'owner-1',
          email: 'owner@example.com',
          clubId: 'club-1',
          workspace: 'Basketball App',
          groupId: null,
          groupName: null,
          role: 'owner',
          active: true,
          status: 'active',
          createdAt: '2026-09-22T10:00:00.000Z',
          lastSignInAt: '2026-09-22T11:00:00.000Z',
        },
      ],

      platformAdmins: [
        {
          userId: 'admin-1',
          email: 'superadmin@example.com',
          createdAt: '2026-09-22T09:00:00.000Z',
          lastSignInAt: '2026-09-22T12:00:00.000Z',
        },
      ],
    },
  }),
}))

describe('SuperAdminDashboard', () => {
  it('shows platform data and account access', () => {
    render(
      <SuperAdminDashboard
        onOpenTrainingApp={vi.fn()}
        onLogout={vi.fn()}
        onInviteOwner={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('heading', {
        name: 'Platform overview',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByRole('heading', {
        name: 'Basketball App',
      }),
    ).toBeInTheDocument()

    expect(
      screen.getByText('owner@example.com'),
    ).toBeInTheDocument()

    expect(
      screen.getByText('superadmin@example.com'),
    ).toBeInTheDocument()

    // Free is the workspace tier here, not the Superadmin tier.
    expect(
      screen.getByText(/^free$/i),
    ).toBeInTheDocument()
  })

  it('opens the regular training app on demand', () => {
    const onOpenTrainingApp = vi.fn()

    render(
      <SuperAdminDashboard
        onOpenTrainingApp={onOpenTrainingApp}
        onLogout={vi.fn()}
        onInviteOwner={vi.fn()}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Open training app',
      }),
    )

    expect(
      onOpenTrainingApp,
    ).toHaveBeenCalledOnce()
  })
})
