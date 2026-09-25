import { useState } from 'react'
import type { ExerciseIcon } from '../hooks/useExercises'
import { EMOJI_LIBRARY } from './EmojiLibrary'
import { EXERCISE_ICON_IDS, EXERCISE_ICON_LIBRARY } from './ExerciseIconLibrary'

/** A trainer's icon choice for their own custom exercise: pick one from our icon library, or
 * pick an emoji from a curated grid — the seeded library is moving to icon-library-only icons
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
        <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-8">
          {EMOJI_LIBRARY.map((emoji) => {
            const active = value.kind === 'emoji' && value.value === emoji
            return (
              <button
                key={emoji}
                type="button"
                aria-label={emoji}
                aria-pressed={active}
                onClick={() => onChange({ kind: 'emoji', value: emoji })}
                className={`flex h-10 w-10 items-center justify-center rounded-xl border-2 text-xl ${
                  active ? 'border-orange-500 bg-orange-50 dark:bg-orange-500/10' : 'border-border bg-card'
                }`}
              >
                {emoji}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
