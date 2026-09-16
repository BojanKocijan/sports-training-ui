import { useState } from 'react'
import { toLocalIso } from '../utils/format'
import { Button } from './ui/button'
import { Card } from './ui/card'

const WEEKDAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function monthLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

/** Mon-first day-of-week index (0 = Monday .. 6 = Sunday) for a JS Date. */
function mondayIndex(d: Date) {
  return (d.getDay() + 6) % 7
}

export function Calendar({
  value,
  onChange,
  markedDates,
  disabledDates,
  minDate,
}: {
  value: string
  onChange: (iso: string) => void
  /** Dates (YYYY-MM-DD) that already have something scheduled — shown with a dot badge. */
  markedDates: Set<string>
  /** Dates that can't be picked (e.g. already taken for this group) — shown struck through. */
  disabledDates: Set<string>
  /** Earliest selectable date (YYYY-MM-DD), inclusive. Defaults to today. */
  minDate?: string
}) {
  const min = minDate ?? toLocalIso(new Date())
  const initialMonth = value ? new Date(`${value}T00:00:00`) : new Date(`${min}T00:00:00`)
  const [viewMonth, setViewMonth] = useState(new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1))

  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = mondayIndex(firstOfMonth)

  const cells: (Date | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ]

  function goToPrevMonth() {
    setViewMonth(new Date(year, month - 1, 1))
  }

  function goToNextMonth() {
    setViewMonth(new Date(year, month + 1, 1))
  }

  return (
    <Card size="sm" className="px-3">
      <div className="mb-2 flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon-sm"
          shape="pill"
          onClick={goToPrevMonth}
          aria-label="Previous month"
        >
          ‹
        </Button>
        <p className="text-sm font-bold text-neutral-900 dark:text-neutral-50">{monthLabel(viewMonth)}</p>
        <Button
          variant="ghost"
          size="icon-sm"
          shape="pill"
          onClick={goToNextMonth}
          aria-label="Next month"
        >
          ›
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-neutral-400">
        {WEEKDAY_LABELS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`blank-${i}`} />
          const iso = toLocalIso(d)
          const isSelected = iso === value
          const isMarked = markedDates.has(iso)
          const isDisabled = iso < min || disabledDates.has(iso)

          return (
            <Button
              key={iso}
              variant={isSelected ? 'default' : 'ghost'}
              disabled={isDisabled}
              onClick={() => onChange(iso)}
              className={`relative h-10 w-full flex-col gap-0 rounded-xl text-sm font-medium ${
                isDisabled ? 'text-neutral-300 dark:text-neutral-700' : ''
              }`}
            >
              {d.getDate()}
              {isMarked && (
                <span
                  aria-hidden
                  className={`absolute bottom-1 h-1 w-1 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-orange-500'
                  }`}
                />
              )}
            </Button>
          )
        })}
      </div>
    </Card>
  )
}
