import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Small pill-shaped tag — for filter/category selection (see the widgets slice: CategoryChip,
 * CategoryBadges) and any other "pick one of several small labeled options" UI. Not for
 * primary actions or nav — use Button for those.
 *
 * No shadcn equivalent by this name exists (their closest primitives — Badge, Toggle — don't
 * match this exact "selectable filter pill" shape), so this stays hand-rolled, but on the same
 * CSS-variable tokens and `cn()` helper as everything else for consistency. */
export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  children?: ReactNode
}

export function Chip({ selected = false, className, type = 'button', children, ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-40',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        selected
          ? 'border-primary bg-accent text-accent-foreground'
          : 'border-border bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
