import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md'
type Shape = 'rounded' | 'pill'

/** Base classes shared by every variant — this is where the focus-visible ring lives, so it's
 * impossible to add a new variant that forgets one. Nothing in this app had a visible keyboard
 * focus indicator before this component (inputs only had a focus:border color change; buttons
 * had none at all). */
const BASE =
  'inline-flex items-center justify-center gap-1.5 font-semibold transition-colors ' +
  'disabled:cursor-not-allowed disabled:opacity-40 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-neutral-950'

const SIZE: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
}

/** Square padding instead of the horizontal-heavy default, for icon-only buttons (e.g. a single
 * emoji/icon with no label) so they read as a control, not a clipped label. */
const ICON_ONLY_SIZE: Record<Size, string> = {
  sm: 'p-1.5 text-xs',
  md: 'p-2 text-sm',
}

const SHAPE: Record<Shape, string> = {
  rounded: 'rounded-xl',
  pill: 'rounded-full',
}

const VARIANT: Record<Variant, string> = {
  primary:
    'bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700',
  secondary:
    'border border-black/10 bg-white text-neutral-700 hover:bg-neutral-50 active:bg-neutral-100 ' +
    'dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:active:bg-neutral-700',
  ghost:
    'text-neutral-600 hover:bg-neutral-100 active:bg-neutral-200 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:active:bg-neutral-700',
}

/** Selected/current state overrides the variant's own colors — used for nav items and menu
 * options, where "this is the active one" matters more than which variant it started as. */
const ACTIVE = 'bg-orange-50 text-orange-700 hover:bg-orange-50 dark:bg-orange-500/10 dark:text-orange-300 dark:hover:bg-orange-500/10'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  shape?: Shape
  /** Renders the active/selected treatment regardless of `variant`. */
  active?: boolean
  /** Square padding for a single icon/emoji with no visible label — pair with an `aria-label`. */
  iconOnly?: boolean
  fullWidth?: boolean
  children?: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  shape = 'rounded',
  active = false,
  iconOnly = false,
  fullWidth = false,
  className = '',
  type = 'button',
  children,
  ...rest
}: ButtonProps) {
  const sizeClasses = iconOnly ? ICON_ONLY_SIZE[size] : SIZE[size]
  return (
    <button
      type={type}
      className={`${BASE} ${sizeClasses} ${SHAPE[shape]} ${active ? ACTIVE : VARIANT[variant]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
