import { TABS, type Tab } from '../data/tabs'
import { Button } from './ui/Button'

/** Desktop navigation — a left rail, sticky under the club header. Hidden below `lg`, where
 * BottomNav takes over; the two are mutually exclusive; not two navs at once. */
export function SideNav({
  active,
  onChange,
}: {
  active: Tab
  onChange: (tab: Tab) => void
}) {
  return (
    <nav
      className="sticky top-0 hidden w-56 shrink-0 flex-col gap-1 self-start border-r border-black/10
                 bg-white px-3 py-4 lg:flex lg:min-h-screen dark:border-white/10 dark:bg-neutral-900"
    >
      {TABS.map((tab) => (
        <Button
          key={tab.id}
          variant="ghost"
          active={tab.id === active}
          fullWidth
          className="justify-start gap-3"
          onClick={() => onChange(tab.id)}
        >
          <span className="text-lg leading-none">{tab.emoji}</span>
          {tab.label}
        </Button>
      ))}
    </nav>
  )
}
