import { useEffect, useState } from 'react'
import { api } from '../lib/apiClient'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

type Tier = {
  id: 'free' | 'coach' | 'club' | 'federation'
  label: string
  priceLabel: string
  additionalGroupLabel: string | null
  monthlyPriceLabel: string | null
  monthlyAdditionalGroupLabel: string | null
  seasonMonths: number | null
  items: string[]
  status: 'available' | 'planned'
}

export function TierCatalogDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [tiers, setTiers] = useState<Tier[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!open) return
    let active = true
    api.get<Tier[]>('/tiers').then(
      (data) => {
        if (active) {
          setTiers(data)
          setError(false)
        }
      },
      () => {
        if (active) {
          setTiers(null)
          setError(true)
        }
      },
    )
    return () => { active = false }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Packages</DialogTitle>
          <DialogDescription>
            FREE is available for assigned clubs. Paid packages and billing are planned; your current package is shown in the header.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p role="alert">Packages could not be loaded. Please try again later.</p>
        ) : tiers === null ? (
          <p role="status">Loading packages...</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2" aria-label="Planned packages">
            {tiers.map((tier) => (
              <section key={tier.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{tier.label}</h3>
                  <span className="text-xs text-muted-foreground">
                    {tier.status === 'available' ? 'Available' : 'Planned'}
                  </span>
                </div>
                {tier.seasonMonths && <p className="mt-2 text-xs font-semibold">Seasonal · {tier.seasonMonths} months</p>}
                <p className={tier.seasonMonths ? 'font-medium' : 'mt-2 font-medium'}>{tier.priceLabel}</p>
                {tier.additionalGroupLabel && (
                  <p className="text-muted-foreground">{tier.additionalGroupLabel}</p>
                )}
                {tier.monthlyPriceLabel && (
                  <div className="mt-2">
                    <p className="text-xs font-semibold">Monthly</p>
                    <p className="font-medium">{tier.monthlyPriceLabel}</p>
                    {tier.monthlyAdditionalGroupLabel && (
                      <p className="text-muted-foreground">{tier.monthlyAdditionalGroupLabel}</p>
                    )}
                  </div>
                )}
                <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
                  {tier.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </section>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
