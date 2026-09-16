import type { ButtonHTMLAttributes, ReactNode } from 'react'

/** Small pill-shaped tag — for filter/category selection (see the widgets slice: CategoryChip,
 * CategoryBadges) and any other "pick one of several small labeled options" UI. Not for
 * primary actions or nav — use Button for those. */
export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
  children?: ReactNode
}

export function Chip({ selected = false, className = '', type = 'button', children, ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold
        transition-colors disabled:cursor-not-allowed disabled:opacity-40
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950
        ${
          selected
            ? 'border-orange-500 bg-orange-50 text-orange-700 dark:border-orange-400 dark:bg-orange-500/10 dark:text-orange-300'
            : 'border-black/10 bg-neutral-50 text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 dark:border-white/10 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:active:bg-neutral-600'
        } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
