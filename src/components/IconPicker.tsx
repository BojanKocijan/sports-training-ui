import { useState } from 'react'
import type { ExerciseIcon } from '../hooks/useExercises'
import { EXERCISE_ICON_IDS, EXERCISE_ICON_LIBRARY } from './ExerciseIconLibrary'

/** A trainer's icon choice for their own custom exercise: pick one from our icon library, or
 * type/paste any emoji of their own — the seeded library is moving to icon-library-only icons
 * (#203), but a custom exercise stays the trainer's own choice either way. */
export function IconPicker({ value, onChange }: { value: ExerciseIcon; onChange: (icon: ExerciseIcon) => void }) {
  const [tab, setTab] = useState<ExerciseIcon['kind']>(value.kind)

  return (
    <div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('library')}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            tab === 'library' ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground'
          }`}
        >
          Icon library
        </button>
        <button
          type="button"
          onClick={() => setTab('emoji')}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            tab === 'emoji' ? 'bg-orange-500 text-white' : 'bg-muted text-muted-foreground'
          }`}
        >
          Emoji
        </button>
      </div>

      {tab === 'library' ? (
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-8">
          {EXERCISE_ICON_IDS.map((id) => {
            const Glyph = EXERCISE_ICON_LIBRARY[id]
            const active = value.kind === 'library' && value.value === id
            return (
              <button
                key={id}
                type="button"
                aria-label={id}
                aria-pressed={active}
                onClick={() => onChange({ kind: 'library', value: id })}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 ${
                  active ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-border bg-card'
                }`}
              >
                <Glyph aria-hidden className="h-5 w-5 text-orange-500" stroke={2} />
              </button>
            )
          })}
        </div>
      ) : (
        <div className="mt-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Emoji</label>
          <input
            type="text"
            inputMode="text"
            maxLength={8}
            value={value.kind === 'emoji' ? value.value : ''}
            onChange={(e) => onChange({ kind: 'emoji', value: e.target.value })}
            placeholder="🏀"
            className="mt-1 block w-20 rounded-xl border border-border bg-card px-3 py-2 text-center text-2xl"
          />
        </div>
      )}
    </div>
  )
}
