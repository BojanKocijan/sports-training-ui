/** Bottom category dial (#106): a horizontal row of large, rounded-square icons that switches
 * which option grid is showing below, instead of the old one-screen-per-choice wizard steps or a
 * plain dropdown. Each category still saves via the same field it always did -- this only changes
 * how it's navigated to. */
export function CustomizationDial<Id extends string>({
  categories,
  active,
  onChange,
}: {
  categories: { id: Id; label: string; icon: string }[]
  active: Id
  onChange: (id: Id) => void
}) {
  return (
    <div role="tablist" aria-label="Customize" className="flex gap-2 overflow-x-auto pb-1">
      {categories.map((cat) => (
        <button
          key={cat.id}
          type="button"
          role="tab"
          aria-selected={active === cat.id}
          onClick={() => onChange(cat.id)}
          className={`flex shrink-0 flex-col items-center gap-1 rounded-2xl border px-3 py-2 transition-colors ${
            active === cat.id
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10'
              : 'border-black/10 bg-white dark:border-white/10 dark:bg-neutral-900'
          }`}
        >
          <span className="text-xl leading-none" aria-hidden="true">
            {cat.icon}
          </span>
          <span
            className={`text-[10px] font-bold ${
              active === cat.id ? 'text-orange-700 dark:text-orange-300' : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            {cat.label}
          </span>
        </button>
      ))}
    </div>
  )
}
