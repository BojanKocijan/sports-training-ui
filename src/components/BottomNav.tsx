import { TABS, type Tab } from '../data/tabs'
import { Button } from './ui/Button'

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
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-black/10 bg-white/95 backdrop-blur
                 pb-[env(safe-area-inset-bottom)] dark:border-white/10 dark:bg-neutral-900/95 lg:hidden"
    >
      <div className="mx-auto flex max-w-md md:max-w-3xl">
        {TABS.map((tab) => {
          const isActive = tab.id === active
          return (
            <Button
              key={tab.id}
              variant="ghost"
              shape="rounded"
              fullWidth
              // `!text-*` (Tailwind's important-modifier) because this needs to win over the
              // ghost variant's own text color, and two same-property utility classes on one
              // element don't reliably override by source order in the className string.
              className={`flex-col gap-0.5 rounded-none py-2.5 text-[11px] font-medium ${
                isActive ? '!text-orange-600 dark:!text-orange-400' : ''
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
