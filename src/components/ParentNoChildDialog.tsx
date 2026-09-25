import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from './ui/dialog'
import { ParentNoChildCard } from './ParentNoChildCard'

/** The one modal shell for "no child linked yet", shared by the sign-in flow (LandingPage) and the
 * signed-in parent-intent mismatch (App): same Dialog, same Cancel placement, wherever it opens. */
export function ParentNoChildDialog({ open, onOpenChange, trainerAccess, note, notParentLabel, onNotParent, onCancel }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trainerAccess: ReturnType<typeof useTrainerAccess>
  note?: string
  notParentLabel?: string
  onNotParent: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-2xl">
        <DialogTitle className="sr-only">No child linked yet</DialogTitle>
        <DialogDescription className="sr-only">Ask your child's trainer to add your email.</DialogDescription>
        <ParentNoChildCard trainerAccess={trainerAccess} note={note} notParentLabel={notParentLabel} onNotParent={onNotParent} />
        {/* Below the card, same as every other step of the sign-in dialog: it always cancels the whole thing. */}
        <DialogClose asChild>
          <button type="button" onClick={onCancel}
            className="mt-3 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-neutral-900 shadow-md hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-700">
            Cancel
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  )
}
