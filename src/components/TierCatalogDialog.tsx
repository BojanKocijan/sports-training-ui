import { useEffect, useState } from 'react'
import { api } from '../lib/apiClient'
import { TierPackagesGrid, type TierPackage } from './TierPackagesGrid'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

export function TierCatalogDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [tiers, setTiers] = useState<TierPackage[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!open) return
    let active = true
    api.get<TierPackage[]>('/tiers').then(
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
          <TierPackagesGrid tiers={tiers} />
        )}
      </DialogContent>
    </Dialog>
  )
}
