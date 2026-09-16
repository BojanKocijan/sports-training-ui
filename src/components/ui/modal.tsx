import { Dialog as DialogPrimitive } from "radix-ui"
import type { ReactNode } from "react"
import { Button } from "./button"

// Tailwind needs the full class name literally in source to generate it — a template-literal
// `z-${n}` never matches anything, so the two z-index levels this app actually uses are spelled
// out here instead of interpolated.
const Z_INDEX = {
  30: "z-30",
  40: "z-40",
} as const

/** Full-screen takeover sheet — the exact shell that PrivacyPolicyScreen, PlayerDetailModal, and
 * PlanTrainingWizard each hand-rolled separately (`fixed inset-0 flex flex-col`, a header with a
 * title and a close button, safe-area top padding, a scrollable body). This is a mobile-first
 * app, so "modal" here means a full page takeover, not shadcn's own centered-card `DialogContent`
 * — hence building on the raw Radix primitive (same one dialog.tsx imports from) instead of
 * reusing that component.
 *
 * Radix gets us: focus trapped inside while open, Escape closes it, focus returns to whatever
 * opened it on close. No visual backdrop is rendered (no DialogOverlay) since the full-screen
 * content already covers the page — there's nothing behind it to dim. */
export function Modal({
  title,
  onClose,
  zIndex = 40,
  children,
}: {
  title: string
  onClose: () => void
  zIndex?: keyof typeof Z_INDEX
  children?: ReactNode
}) {
  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className={`fixed inset-0 ${Z_INDEX[zIndex]} flex flex-col bg-background outline-none`}
        >
          <header className="flex shrink-0 items-center justify-between border-b border-border bg-card px-4 py-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
            <div className="mx-auto flex w-full max-w-md items-center justify-between">
              <DialogPrimitive.Title asChild>
                <h2 className="font-heading text-base font-semibold text-foreground">{title}</h2>
              </DialogPrimitive.Title>
              <DialogPrimitive.Close asChild>
                <Button variant="secondary" size="sm" shape="pill">
                  Close
                </Button>
              </DialogPrimitive.Close>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto px-4 py-4">
            <div className="mx-auto max-w-md">{children}</div>
          </main>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
