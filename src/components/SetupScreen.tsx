import { coachRoles, coachingPrinciples, setupChecklist } from '../data/coaching'
import { useChecklist } from '../hooks/useChecklist'

export function SetupScreen() {
  const { checked, toggle, resetAll } = useChecklist('u8-setup-checklist', setupChecklist.length)
  const doneCount = checked.filter(Boolean).length

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 pb-24 pt-4 md:max-w-2xl">
      <header>
        <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-50">
          Before the children arrive
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 md:max-w-lg">
          Group: 8–10 children · Main goals: have fun, learn names, dribble, pass, shoot, finish
          as a team.
        </p>
      </header>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Set up checklist
          </h2>
          <span className="text-xs font-semibold text-neutral-400">
            {doneCount}/{setupChecklist.length}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {setupChecklist.map((item, i) => (
            <label
              key={item}
              className="flex cursor-pointer items-start gap-3 rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-neutral-900"
            >
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => toggle(i)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-orange-500"
              />
              <span
                className={`text-sm ${checked[i] ? 'text-neutral-400 line-through' : 'text-neutral-700 dark:text-neutral-200'}`}
              >
                {item}
              </span>
            </label>
          ))}
        </div>
        {doneCount > 0 && (
          <button
            type="button"
            onClick={resetAll}
            className="mt-2 text-xs font-semibold text-neutral-400 active:text-neutral-600"
          >
            Clear checklist
          </button>
        )}
      </section>

      {/* Long-form reading content stays at a readable width rather than stretching to the
          wider container — a paragraph spanning a whole desktop screen is harder to read, not
          easier. */}
      <section className="md:max-w-lg">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Coach roles
        </h2>
        <div className="space-y-2">
          {coachRoles.map((r) => (
            <div
              key={r.role}
              className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-neutral-700 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200"
            >
              <span className="font-semibold text-orange-600 dark:text-orange-400">{r.role}:</span>{' '}
              {r.description}
            </div>
          ))}
        </div>
        <p className="mt-2 rounded-2xl bg-orange-50 px-4 py-3 text-sm font-medium text-orange-800 dark:bg-orange-500/10 dark:text-orange-300">
          Demonstrate first; speak second. Use the same hand signals and key words in both
          languages.
        </p>
      </section>

      <section className="md:max-w-lg">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Coaching principles
        </h2>
        <div className="space-y-2">
          {coachingPrinciples.map((p) => (
            <div
              key={p}
              className="flex gap-2 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-neutral-700 dark:border-white/10 dark:bg-neutral-900 dark:text-neutral-200"
            >
              <span className="text-orange-500">•</span>
              {p}
            </div>
          ))}
        </div>
      </section>

      <section className="md:max-w-lg">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Privacy
        </h2>
        <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 dark:border-white/10 dark:bg-neutral-900">
          <p className="text-sm text-neutral-700 dark:text-neutral-200">
            This app stores no names, photos, or any information about the children who attend
            training. Shared training plans (just a date, a group, and which exercises) live in a
            shared database, unlocked by a team-wide trainer code, not a personal account.
            Everything else (ratings, your setup checklist) stays only on your own device.
          </p>
          <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
            Full details in <code>PRIVACY.md</code> in the project repository.
          </p>
        </div>
      </section>
    </div>
  )
}
