import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { SignInCard } from './SignInCard'

const MASCOT_BASE = '/images/basketball/u8%20u10'

// Plain baby-stage art, no jersey overlay: the landing page shows the characters, not a roster.
const MASCOTS = [
  { name: 'Lion', src: `${MASCOT_BASE}/Leon/Web%20size/leon-baby-boy.webp`, tint: 'bg-orange-100 dark:bg-orange-500/15' },
  { name: 'Tiger', src: `${MASCOT_BASE}/Tiger/Web%20size/tiger-baby-boy.webp`, tint: 'bg-amber-100 dark:bg-amber-500/15' },
  { name: 'Shark', src: `${MASCOT_BASE}/Shark/Web%20size/shark-baby-boy.webp`, tint: 'bg-sky-100 dark:bg-sky-500/15' },
  { name: 'Panther', src: `${MASCOT_BASE}/Panther/Web%20size/panther-baby-girl.webp`, tint: 'bg-violet-100 dark:bg-violet-500/15' },
  { name: 'Dino', src: `${MASCOT_BASE}/Dinosaur/Web%20size/dino-baby-boy.webp`, tint: 'bg-emerald-100 dark:bg-emerald-500/15' },
  { name: 'Goat', src: `${MASCOT_BASE}/Goat/Web%20size/goat-baby-girl.webp`, tint: 'bg-rose-100 dark:bg-rose-500/15' },
  { name: 'Croc', src: `${MASCOT_BASE}/Crocodile/Web%20size/crocodile-baby-boy.webp`, tint: 'bg-lime-100 dark:bg-lime-500/15' },
  { name: 'Lioness', src: `${MASCOT_BASE}/Leon/Web%20size/leon-baby-girl.webp`, tint: 'bg-yellow-100 dark:bg-yellow-500/15' },
]

const AUDIENCES = [
  {
    title: 'For kids',
    emoji: '🏀',
    text: 'Pick your own mascot, give it your jersey colour and number, and watch it grow as your skills do. Every practice earns you something.',
  },
  {
    title: 'For parents',
    emoji: '👨‍👩‍👧',
    text: 'See how your child is doing at a glance: their mascot, skill by skill progress and the next trainings. Your trainer invites you by email.',
  },
  {
    title: 'For trainers',
    emoji: '📋',
    text: 'Plan trainings, rate skills in two taps, keep every player’s history, and invite parents to follow along. No spreadsheets.',
  },
]

// Fictional demo data only: an example of what a parent sees, not a real player.
const DEMO_SKILLS = [
  { label: 'Dribbling', emoji: '⚡', value: 2.6 },
  { label: 'Shooting', emoji: '🎯', value: 2.1 },
  { label: 'Passing', emoji: '🤝', value: 2.9 },
  { label: 'Defense', emoji: '🛡️', value: 1.8 },
]

const UPCOMING_SPORTS = ['Football', 'Volleyball', 'Handball']

/** Public front door: what the app is, who it is for, and the sign-in. Shown whenever nobody is
 * signed in. Sign-in is for trainers; parents get in after a trainer invites their email. */
export function LandingPage({ trainerAccess }: { trainerAccess: ReturnType<typeof useTrainerAccess> }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white text-neutral-900 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950 dark:text-neutral-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <a href="#top" aria-label="CoachCub home" className="rounded-xl dark:bg-white dark:px-2 dark:py-1">
          <img src="/logos/coachcub-logo.webp" alt="CoachCub" width={1844} height={403} className="h-9 w-auto md:h-11" />
        </a>
        <a href="#sign-in" className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">
          Trainer sign in
        </a>
      </header>

      <main id="top">
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-6 md:grid-cols-2 md:pt-12">
          <div>
            <p className="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
              Youth basketball, made playful
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Every practice is a step towards a bigger cub.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-neutral-600 dark:text-neutral-300">
              Kids pick a mascot that grows with their skills. Trainers rate drills in two taps.
              Parents follow the progress and cheer them on.
            </p>
            <div className="mt-6 flex items-end gap-3" aria-hidden>
              {MASCOTS.slice(0, 3).map((m, i) => (
                <div
                  key={m.name}
                  className={`overflow-hidden rounded-3xl ${m.tint} ${i === 1 ? 'h-40 w-32 md:h-52 md:w-40' : 'h-32 w-24 md:h-44 md:w-32'}`}
                >
                  <img src={m.src} alt="" className="h-full w-full object-contain" loading="eager" />
                </div>
              ))}
            </div>
          </div>

          <div id="sign-in" className="mx-auto w-full max-w-md scroll-mt-6">
            <SignInCard trainerAccess={trainerAccess} />
            <p className="mt-3 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Parents: your child’s trainer invites you by email. Confirm it, then sign in here with the same address.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">One app, three happy teams</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {AUDIENCES.map((a) => (
              <article key={a.title} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                <p className="text-3xl" aria-hidden>{a.emoji}</p>
                <h3 className="mt-2 text-lg font-bold">{a.title}</h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{a.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid items-center gap-8 rounded-3xl bg-orange-500 p-6 text-white md:grid-cols-2 md:p-10">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Progress you can actually see</h2>
              <p className="mt-3 text-orange-50">
                Every rating a trainer logs moves the skill bars. Low on a skill? It becomes “more time to
                practise this together”, never a failing grade. Effort and courage count too.
              </p>
            </div>
            <div className="rounded-3xl bg-white p-4 text-neutral-900 shadow-lg dark:bg-neutral-900 dark:text-neutral-50" aria-label="Example progress card">
              <div className="flex items-center gap-3">
                <div className="h-16 w-14 shrink-0 overflow-hidden rounded-2xl bg-amber-100 dark:bg-amber-500/15">
                  <img src={MASCOTS[1].src} alt="" className="h-full w-full object-contain" loading="lazy" />
                </div>
                <div>
                  <p className="text-base font-bold">Milo’s progress</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Example · 12 trainings</p>
                </div>
              </div>
              <div className="mt-3 space-y-2">
                {DEMO_SKILLS.map((s) => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="w-28 shrink-0 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                      {s.emoji} {s.label}
                    </span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
                      <div className="h-full rounded-full bg-orange-500" style={{ width: `${(s.value / 3) * 100}%` }} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs font-medium text-neutral-400">{s.value.toFixed(1)}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 rounded-xl bg-orange-50 px-3 py-2 text-xs text-orange-800 dark:bg-orange-500/10 dark:text-orange-300">
                💡 More time to practise <strong>Defense</strong> together this week.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Meet the team</h2>
          <p className="mt-1 text-neutral-600 dark:text-neutral-300">Every child picks the mascot that feels like them.</p>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {MASCOTS.map((m) => (
              <li key={m.name} className={`flex flex-col items-center rounded-3xl p-3 ${m.tint}`}>
                <img src={m.src} alt={`${m.name} the mascot`} className="h-40 w-full object-contain" loading="lazy" />
                <span className="mt-1 text-sm font-bold">{m.name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">Starting with basketball</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white">🏀 Basketball · available now</span>
            {UPCOMING_SPORTS.map((sport) => (
              <span key={sport} className="rounded-full border border-dashed border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-400 dark:border-neutral-700">
                {sport} · soon
              </span>
            ))}
            <span className="rounded-full border border-dashed border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-400 dark:border-neutral-700">
              more coming soon
            </span>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-10 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <p>Trainers, <a href="#sign-in" className="font-semibold text-orange-600 underline">sign in</a> to set up your group and invite parents.</p>
      </footer>
    </div>
  )
}
