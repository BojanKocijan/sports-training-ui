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

vi.mock('../hooks/useSportTierLimits', () => ({
  useSportTierLimits: () => ({
    loading: false,
    error: null,
    refresh: vi.fn(),
    limits: [{ sportId: 'basketball', tier: 'free', maxPlayers: 15, updatedAt: '2026-09-25T00:00:00Z' }],
  }),
}))

vi.mock('../hooks/useTierCatalog', () => ({
  useTierCatalog: () => ({
    loading: false,
    error: null,
    refresh: vi.fn(),
    tiers: [
      {
        id: 'free', label: 'FREE', priceLabel: '€0', additionalGroupLabel: null,
        monthlyPriceLabel: null, monthlyAdditionalGroupLabel: null, seasonMonths: null,
        items: ['1 sport', '1 group', '15 players', '1 trainer', 'Full core feature set', 'No expiry'],
        status: 'available',
      },
      {
        id: 'coach', label: 'COACH / TEAM', priceLabel: '€60 / season first group',
        additionalGroupLabel: '€50 / additional group', monthlyPriceLabel: null,
        monthlyAdditionalGroupLabel: null, seasonMonths: 12,
        items: ['Owner + limited co-coaches'], status: 'planned',
      },
    ],
  }),
}))

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

    // Overview: one Workspaces card (total, free vs paid); admins are listed; workspaces are a nav entry, not a list.
    expect(screen.getByRole('button', { name: /Workspaces: 1 total, 1 free, 0 paid/ })).toBeInTheDocument()
    expect(screen.getByText('superadmin@example.com')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Admin sections' })
    expect(nav).not.toHaveTextContent('Basketball App')

    // Workspaces opens a table; a row opens the workspace with its trainers and parents.
    await userEvent.click(within(nav).getByRole('button', { name: /^Workspaces/ }))
    expect(screen.getByRole('heading', { name: 'Workspaces' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Basketball App' }))
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

  it('shows the sport pricing/limits page with the Basketball default from useSportTierLimits', async () => {
    render(
      <SuperAdminDashboard
        onOpenTrainingApp={vi.fn()}
        onLogout={vi.fn()}
        onInviteOwner={vi.fn()}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Pricing & limits' }))
    expect(screen.getByRole('heading', { name: 'Pricing & limits' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Basketball' })).toBeInTheDocument()
    expect(screen.getByText('Free trial')).toBeInTheDocument()
    expect(screen.getByLabelText('Basketball Free trial max players')).toHaveValue(15)

    // Full tier catalog (pricing, status, features incl. sharing/inviting) underneath.
    expect(screen.getByRole('heading', { name: 'What each tier includes' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'FREE' })).toBeInTheDocument()
    expect(screen.getByText('Owner + limited co-coaches')).toBeInTheDocument()
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

  it('offers the parent view in the account menu only when the admin has a linked child', async () => {
    const onOpenParentView = vi.fn()
    const { rerender } = render(
      <SuperAdminDashboard onOpenTrainingApp={vi.fn()} onLogout={vi.fn()} onInviteOwner={vi.fn()} />,
    )
    await userEvent.click(screen.getByRole('button', { name: /superadmin account menu/i }))
    expect(screen.queryByRole('menuitem', { name: /parent view/i })).not.toBeInTheDocument()
    await userEvent.keyboard('{Escape}')

    rerender(
      <SuperAdminDashboard onOpenTrainingApp={vi.fn()} onLogout={vi.fn()} onInviteOwner={vi.fn()} onOpenParentView={onOpenParentView} />,
    )
    await userEvent.click(screen.getByRole('button', { name: /superadmin account menu/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /parent view/i }))
    expect(onOpenParentView).toHaveBeenCalled()
  })
})
