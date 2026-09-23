import {
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
          groups: [{ id: 'u8', name: 'U8', playerCount: 7 }],
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

      parents: [
        {
          linkId: 'link-1',
          email: 'mum@example.com',
          childId: 'player-1',
          childName: 'Lion',
          groupId: 'u8',
          groupName: 'U8',
          clubId: 'club-1',
          status: 'active',
          createdAt: '2026-09-23T07:00:00.000Z',
          lastSignInAt: '2026-09-23T09:00:00.000Z',
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
  it('shows platform data and account access', async () => {
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

    // Overview: platform admins are listed, workspaces appear in the sidebar and as cards.
    expect(screen.getByText('superadmin@example.com')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Workspaces' })).toHaveTextContent('Basketball App')

    // Opening a workspace shows its own details, trainers and parents.
    await userEvent.click(within(screen.getByRole('navigation', { name: 'Workspaces' })).getByRole('button', { name: /Basketball App/ }))
    expect(screen.getByRole('heading', { name: 'Basketball App' })).toBeInTheDocument()
    expect(screen.getByText('U8')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: /trainers/i }))
    expect(screen.getByText('owner@example.com')).toBeInTheDocument()
    expect(screen.getByText('All groups')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('tab', { name: /parents/i }))
    expect(screen.getByText('mum@example.com')).toBeInTheDocument()
    expect(screen.getByText('Lion')).toBeInTheDocument()
    expect(screen.getByText('Confirmed')).toBeInTheDocument()

    // Back to the platform overview from the sidebar.
    await userEvent.click(screen.getByRole('button', { name: 'Platform overview' }))
    expect(screen.getByRole('heading', { name: 'Platform overview' })).toBeInTheDocument()
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
