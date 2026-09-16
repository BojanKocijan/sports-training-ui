import { useTheme, type ThemePreference } from '../hooks/useTheme'
import { Button } from './ui/button'

const OPTIONS: { id: ThemePreference; label: string; emoji: string }[] = [
  { id: 'light', label: 'Light', emoji: '☀️' },
  { id: 'dark', label: 'Dark', emoji: '🌙' },
  { id: 'system', label: 'System', emoji: '🖥️' },
]

/** Three-way Light/Dark/System switch — see useTheme.ts for how the choice is applied and
 * persisted. Icon-only by default; each button carries its label for screen readers/tooltip. */
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
            className={isActive ? 'bg-card shadow-sm hover:bg-card' : 'opacity-50 hover:opacity-80'}
          >
            {opt.emoji}
          </Button>
        )
      })}
    </div>
  )
}
