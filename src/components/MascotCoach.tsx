import { useEffect, useRef, useState } from 'react'
import type { PlayerCategoryStat } from '../hooks/usePlayerProgress'
import { mascotMessages } from '../utils/parentGuidance'

/** The mascot "talks" to the parent and child from the child's real ratings (#113): tap for the next
 * message. It only ever encourages: strengths, effort, and "more time to practise this together"
 * for a low category, never a failure state (#106). */
export function MascotCoach({ nickname, stats, labelFor }: {
  nickname: string
  stats: PlayerCategoryStat[]
  labelFor: (categoryId: string) => string
}) {
  const messages = mascotMessages(nickname, stats, labelFor)
  const [index, setIndex] = useState(0)
  const [cheering, setCheering] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  function next() {
    setIndex((i) => (i + 1) % messages.length)
    setCheering(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCheering(false), 700)
  }

  return (
    <button
      type="button"
      onClick={next}
      aria-label="Hear another message from your mascot"
      className="mt-3 block w-full rounded-3xl border border-orange-200 bg-orange-50 p-4 text-left dark:border-orange-500/30 dark:bg-orange-500/10"
    >
      <p aria-live="polite" className={`text-base font-semibold text-neutral-900 dark:text-neutral-50 ${cheering ? 'animate-bounce' : ''}`}>
        {messages[index % messages.length]}
      </p>
      {messages.length > 1 && <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">Tap for another message</p>}
    </button>
  )
}
