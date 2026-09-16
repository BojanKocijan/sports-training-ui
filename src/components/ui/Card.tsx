import type { ElementType, HTMLAttributes, ReactNode } from 'react'

type Padding = 'none' | 'sm' | 'md'

const PADDING: Record<Padding, string> = {
  none: '',
  sm: 'p-3',
  md: 'px-4 py-3',
}

/** The bordered white/dark-neutral container shell that was hand-copied across ~11 components
 * (`rounded-2xl border ... bg-white p-3 ...`). `elevated` adds a shadow instead of relying on
 * the border alone — for things that float above content, like the GroupMenu dropdown, rather
 * than sitting inline in the page flow. `as` lets it render as something other than a `div`
 * (e.g. `ul` for a dropdown that's semantically a list) without losing the shared shell. */
export interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: ElementType
  padding?: Padding
  elevated?: boolean
  children?: ReactNode
}

export function Card({ as: Tag = 'div', padding = 'sm', elevated = false, className = '', children, ...rest }: CardProps) {
  return (
    <Tag
      className={`rounded-2xl border border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900 ${
        elevated ? 'shadow-lg' : ''
      } ${PADDING[padding]} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
