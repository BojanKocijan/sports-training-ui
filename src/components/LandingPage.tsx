import { IconBallBasketball, IconClipboardList, IconHeartHandshake, type Icon } from '@tabler/icons-react'
import { useState } from 'react'
import { CategoryIcon } from './CategoryIcon'
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { SignInCard } from './SignInCard'
import { ThemeToggle } from './ThemeToggle'
import { WorkspaceOnboardingCard } from './WorkspaceOnboardingCard'
import { ParentNoChildCard } from './ParentNoChildCard'
import { getSignInIntent, setSignInIntent } from '../lib/signInIntent'

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

const AUDIENCES: { title: string; icon: Icon; text: string }[] = [
  {
    title: 'For kids',
    icon: IconBallBasketball,
    text: 'Pick your own mascot, give it your jersey colour and number, and watch it grow as your skills do. Every practice earns you something.',
  },
  {
    title: 'For parents',
    icon: IconHeartHandshake,
    text: 'See how your child is doing at a glance: their mascot, skill by skill progress and the next trainings. Your trainer invites you by email.',
  },
  {
    title: 'For trainers',
    icon: IconClipboardList,
    text: 'Plan trainings, rate skills in two taps, keep every player’s history, and invite parents to follow along. No spreadsheets.',
  },
]

// Fictional demo data only: an example of what a parent sees, not a real player.
const DEMO_SKILLS = [
  { id: 'dribbling', label: 'Dribbling', value: 2.6 },
  { id: 'shooting', label: 'Shooting', value: 2.1 },
  { id: 'passing', label: 'Passing', value: 2.9 },
  { id: 'defense', label: 'Defense', value: 1.8 },
]

const UPCOMING_SPORTS = ['Football', 'Volleyball', 'Handball']

/** True when the visitor asked the OS for less motion or turned on Data Saver: those get the
 * still poster instead of a downloading, looping video. */
function prefersStill() {
  try {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches || Boolean(connection?.saveData)
  } catch {
    return false
  }
}

/** The sports-montage mascot clip. The clip has no transparency, so it sits in a
 * rounded card tinted like its own backdrop; the poster paints instantly while it loads. */
function HeroVideo() {
  const [still] = useState(prefersStill)
  const frame = 'mt-6 aspect-video w-full max-w-xl overflow-hidden rounded-3xl bg-[#f1e4cc] shadow-md'

  if (still) {
    return (
      <div className={frame}>
        <img src="/videos/sports-montage-poster.webp" alt="Playful animal mascots playing different sports" className="h-full w-full object-cover" />
      </div>
    )
  }
  return (
    <div className={frame}>
      <video
        className="h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/videos/sports-montage-poster.webp"
        aria-label="Playful animal mascots playing different sports"
      >
        {/* Phone-sized encodes first (WebM before MP4 where supported), then the 720p ones. The clip
          * is a seamless loop: its tail is cross-faded into its head. */}
        <source src="/videos/sports-montage-405.webm" type="video/webm" media="(max-width: 767px)" />
        <source src="/videos/sports-montage-405.mp4" type="video/mp4" media="(max-width: 767px)" />
        <source src="/videos/sports-montage-720.webm" type="video/webm" />
        <source src="/videos/sports-montage-720.mp4" type="video/mp4" />
      </video>
    </div>
  )
}

/** Public front door: what the app is, who it is for, and the sign-in. Shown whenever nobody is
 * signed in. Sign-in is for trainers; parents get in after a trainer invites their email. */
/** Sign-in, or, for a signed-in account with no access yet, the next step for the way they said
 * they were coming in (trainer: name a workspace; parent: ask the trainer to link their child). */
function AccessCard({ trainerAccess }: { trainerAccess: ReturnType<typeof useTrainerAccess> }) {
  const [intent, setIntent] = useState(getSignInIntent)
  if (!trainerAccess.needsWorkspace) return <SignInCard trainerAccess={trainerAccess} />
  if (intent === 'parent') {
    return <ParentNoChildCard trainerAccess={trainerAccess} onNotParent={() => { setSignInIntent('trainer'); setIntent('trainer') }} />
  }
  return <WorkspaceOnboardingCard trainerAccess={trainerAccess} onNotTrainer={() => { setSignInIntent('parent'); setIntent('parent') }} />
}

export function LandingPage({ trainerAccess }: { trainerAccess: ReturnType<typeof useTrainerAccess> }) {
  const [privacyOpen, setPrivacyOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white text-neutral-900 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950 dark:text-neutral-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <a href="#top" aria-label="CoachCub home" className="rounded-xl dark:bg-white dark:px-2 dark:py-1">
          <img src="/logos/coachcub-logo.webp" alt="CoachCub" width={1844} height={403} className="h-9 w-auto md:h-11" />
        </a>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a href="#sign-in" className="rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">
            Sign in
          </a>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto grid max-w-6xl items-start gap-8 px-4 pb-12 pt-6 md:grid-cols-2 md:pt-12">
          <div>
            <p className="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
              For youth sports trainers · Basketball available now
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Every practice is a step towards a bigger cub.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-neutral-600 dark:text-neutral-300">
              CoachCub is built for trainers: plan trainings, rate skills in two taps and invite parents.
              Kids pick a mascot that grows with their skills, and invited parents follow the progress.
            </p>
            <div id="sign-in" className="mt-6 w-full max-w-md scroll-mt-6">
              <AccessCard trainerAccess={trainerAccess} />
            </div>
          </div>

          <div className="w-full">
            <HeroVideo />
            <div className="mt-4 max-w-xl rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-neutral-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-neutral-200">
              <p className="font-bold text-neutral-900 dark:text-neutral-50">Are you a parent?</p>
              <p className="mt-1">
                To follow your child you need to be invited by their trainer: they add your email to your
                child's profile. Once you're added, choose "I'm a parent" and sign in with that email to see
                your child's progress. If you also coach, one account is both trainer and parent, and you can
                switch between the two views from the account menu.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">One app, three happy teams</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {AUDIENCES.map((a) => (
              <article key={a.title} className="rounded-3xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-neutral-900">
                <a.icon aria-hidden className="h-9 w-9 text-orange-500" stroke={1.75} />
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
                      <CategoryIcon id={s.id} className="mr-1 h-3.5 w-3.5 align-[-2px]" />
                      {s.label}
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
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Our mascots and the hero video are AI-generated, guided by the experience of an illustrator and a 3D artist.
          </p>
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
        <p className="mx-auto mt-4 max-w-xl">
          Our mascots and the hero video are AI-generated, guided by the experience of an illustrator and a 3D artist.
        </p>
        <p className="mt-3">
          <button type="button" onClick={() => setPrivacyOpen(true)} className="font-semibold underline">
            Privacy
          </button>
          {' · '}
          <a href="mailto:support@coachcub.app" className="underline">support@coachcub.app</a>
        </p>
      </footer>
      {privacyOpen && <PrivacyPolicyScreen onClose={() => setPrivacyOpen(false)} />}
    </div>
  )
}
