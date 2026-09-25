import { Calendar } from './Calendar'

export function TrainingDateStep({
  date,
  onChange,
  groupLabel,
  takenDateSet,
}: {
  date: string
  onChange: (date: string) => void
  groupLabel: string
  takenDateSet: Set<string>
}) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Training date</label>
      <div className="mt-1">
        <Calendar value={date} onChange={onChange} markedDates={takenDateSet} disabledDates={takenDateSet} />
      </div>
      {date && takenDateSet.has(date) && (
        <p className="mt-2 text-xs font-semibold text-red-600">
          {groupLabel} already has a training on this date, pick another day.
        </p>
      )}
      <p className="mt-2 flex items-center gap-1.5 text-xs text-neutral-400">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-500" /> already has a training planned
      </p>
    </div>
  )
}
