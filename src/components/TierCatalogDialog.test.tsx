import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { api } from '../lib/apiClient'
import { TierCatalogDialog } from './TierCatalogDialog'

vi.mock('../lib/apiClient', () => ({
  api: { get: vi.fn() },
}))

describe('planned tier catalog', () => {
  it('loads the API catalog and displays prices and limits without offering activation', async () => {
    vi.mocked(api.get).mockResolvedValueOnce([
      {
        id: 'free', label: 'FREE', priceLabel: '€0', additionalGroupLabel: null,
        monthlyPriceLabel: null, monthlyAdditionalGroupLabel: null, seasonMonths: null,
        items: ['1 sport', '1 group', '15 players', '1 trainer', 'Full core feature set', 'No expiry'],
        status: 'available',
      },
      {
        id: 'coach', label: 'COACH / TEAM', priceLabel: '€60 / season first group',
        additionalGroupLabel: '€50 / additional group',
        monthlyPriceLabel: '€5.99 / month first group',
        monthlyAdditionalGroupLabel: '€4.99 / month additional group', seasonMonths: 12,
        items: ['Custom exercises'], status: 'planned',
      },
    ])

    render(<TierCatalogDialog open onOpenChange={() => {}} />)

    await waitFor(() => expect(api.get).toHaveBeenCalledWith('/tiers'))
    expect(await screen.findByText('€60 / season first group')).toBeInTheDocument()
    expect(screen.getByText('€50 / additional group')).toBeInTheDocument()
    expect(screen.getByText('€5.99 / month first group')).toBeInTheDocument()
    expect(screen.getByText('€4.99 / month additional group')).toBeInTheDocument()
    expect(screen.getByText('15 players')).toBeInTheDocument()
    expect(screen.getByText(/Paid packages and billing are planned/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /buy|activate|subscribe/i })).not.toBeInTheDocument()
  })
})
