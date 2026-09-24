import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTheme, type ThemePreference } from '../hooks/useTheme'
import { Button } from './ui/button'

const OPTIONS: { id: ThemePreference; label: string; Icon: LucideIcon }[] = [
  { id: 'light', label: 'Light', Icon: Sun },
  { id: 'dark', label: 'Dark', Icon: Moon },
  { id: 'system', label: 'System', Icon: Monitor },
]

/** Three-way Light/Dark/System switch — see useTheme.ts for how the choice is applied and
 * persisted. Icon-only (outlined, filled when selected); each button carries its label for screen readers/tooltip. */
export function ThemeToggle() {
  const { preference, setPreference } = useTheme()

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="flex shrink-0 gap-0.5 rounded-full border border-border bg-muted p-0.5"
    >
      {OPTIONS.map((opt) => {
        const isActive = opt.id === preference
        return (
          <Button
            key={opt.id}
            variant="ghost"
            shape="pill"
            size="icon-xs"
            role="radio"
            aria-checked={isActive}
            aria-label={opt.label}
            title={opt.label}
            onClick={() => setPreference(opt.id)}
            // Deliberately not the `active` variant (that's the orange-brand "selected"
            // look) — this is a neutral raised-chip toggle, a different visual language.
            className={isActive ? 'bg-card text-primary shadow-sm hover:bg-card' : 'text-muted-foreground opacity-70 hover:opacity-100'}
          >
            {/* Outlined when off, filled when it is the current choice. */}
            <opt.Icon className="size-4" fill={isActive ? 'currentColor' : 'none'} aria-hidden="true" />
          </Button>
        )
      })}
    </div>
  )
}
