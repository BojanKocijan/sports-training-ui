import { TABS, type Tab } from '../data/tabs'
import { Button } from './ui/button'

export type { Tab } from '../data/tabs'

/** Phone/tablet navigation — a thumb-reachable bottom bar. Hidden at desktop width (see
 * SideNav), where a fixed bottom-of-screen tab strip spanning a wide viewport stops making
 * ergonomic sense — it's not thumb-reachable on a laptop, and a left rail is the established
 * desktop pattern for primary navigation. */
export function BottomNav({
  active,
  onChange,
}: {
  active: Tab
  onChange: (tab: Tab) => void
}) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="mx-auto flex max-w-md md:max-w-3xl">
        {TABS.map((tab) => {
          const isActive = tab.id === active
          return (
            <Button
              key={tab.id}
              variant="ghost"
              // Button's `cn()` (clsx + tailwind-merge) resolves same-property conflicts by
              // which class comes last, so this text color reliably wins over ghost's own
              // without needing Tailwind's `!important` modifier.
              className={`w-full flex-col gap-0.5 rounded-none py-2.5 text-[11px] font-medium ${
                isActive ? 'text-primary' : ''
              }`}
              onClick={() => onChange(tab.id)}
            >
              <span className="text-xl leading-none">{tab.emoji}</span>
              {tab.label}
            </Button>
          )
        })}
      </div>
    </nav>
  )
}
