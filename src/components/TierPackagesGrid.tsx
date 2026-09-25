export type TierPackage = {
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

/** Read-only card grid of the tier catalog (see sports-training-api's GET /tiers) — pricing,
 * season/monthly rates, and each tier's feature list (which is where sharing/inviting shows up:
 * "Owner + limited co-coaches", "Trainer management", "Shared club exercise library",
 * "Federation admins", etc.). Shared by the public Packages dialog and the platform-admin
 * Pricing & limits page so both read from the same source instead of duplicating markup. */
export function TierPackagesGrid({ tiers }: { tiers: TierPackage[] }) {
  return (
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
  )
}
