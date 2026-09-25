import { IconBallBasketball, IconClipboardList, IconHeartHandshake, type Icon } from '@tabler/icons-react'
import { useState } from 'react'
import { CategoryIcon } from './CategoryIcon'
import { PrivacyPolicyScreen } from './PrivacyPolicyScreen'
import type { useTrainerAccess } from '../hooks/useTrainerAccess'
import { SignInCard } from './SignInCard'
import { Card } from './ui/card'
import { XIcon } from 'lucide-react'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from './ui/dialog'
import type { AuthMode, SignInIntent } from '../lib/signInIntent'
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
  const frame = 'aspect-video w-full overflow-hidden rounded-3xl bg-[#f1e4cc] shadow-lg'

  if (still) {
    return (
      <div className={frame}>
        <img src="/videos/sports-montage-v2-poster.webp" alt="Playful animal mascots playing different sports" className="h-full w-full object-cover" />
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
        poster="/videos/sports-montage-v2-poster.webp"
        aria-label="Playful animal mascots playing different sports"
      >
        {/* Phone-sized encodes first (WebM before MP4 where supported), then the 720p ones. The clip
          * is a seamless loop: its tail is cross-faded into its head. */}
        <source src="/videos/sports-montage-v2-405.webm" type="video/webm" media="(max-width: 767px)" />
        <source src="/videos/sports-montage-v2-405.mp4" type="video/mp4" media="(max-width: 767px)" />
        <source src="/videos/sports-montage-v2-720.webm" type="video/webm" />
        <source src="/videos/sports-montage-v2-720.mp4" type="video/mp4" />
      </video>
    </div>
  )
}

/** Public front door: what the app is, who it is for, and the sign-in. Shown whenever nobody is
 * signed in. Sign-in is for trainers; parents get in after a trainer invites their email. */
/** What the sign-in dialog shows: for a signed-in account with no access yet, the next step for the
 * way they said they were coming in (trainer: name a workspace; parent: ask the trainer to link
 * their child). Otherwise the sign-in form for the chosen role, with the parent information first
 * for parents. */
/** Where the sign-in dialog is: a role and/or a mode still to pick (null), or both chosen. */
interface AuthFlow { role: SignInIntent | null; mode: AuthMode | null }

function AccessCard({ trainerAccess, flow, onChange }: {
  trainerAccess: ReturnType<typeof useTrainerAccess>
  flow: AuthFlow | null
  onChange: (next: AuthFlow) => void
}) {
  const [intent, setIntent] = useState(getSignInIntent)
  if (trainerAccess.needsWorkspace) {
    if (intent === 'parent') {
      return <ParentNoChildCard trainerAccess={trainerAccess} onNotParent={() => { setSignInIntent('trainer'); setIntent('trainer') }} />
    }
    return <WorkspaceOnboardingCard trainerAccess={trainerAccess} onNotTrainer={() => { setSignInIntent('parent'); setIntent('parent') }} />
  }
  const role = flow?.role ?? null
  const mode = flow?.mode ?? null
  if (!role || !mode) {
    // One question at a time: who they are (unless the page already knew), then new or existing.
    const options: { label: string; role: SignInIntent; mode: AuthMode }[] = ([
      ['New trainer', 'trainer', 'signup'], ['Existing trainer', 'trainer', 'login'],
      ['New parent', 'parent', 'signup'], ['Existing parent', 'parent', 'login'],
    ] as const).map(([label, r, m]) => ({ label, role: r, mode: m })).filter((o) => !role || o.role === role)
    return (
      <Card className="w-full rounded-3xl p-5 shadow-lg">
        <h2 className="text-lg font-bold dark:text-white">{role ? `Are you new, ${role === 'trainer' ? 'trainer' : 'parent'}?` : 'Welcome to CoachCub'}</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {role ? 'New here, or already have an account?' : 'How are you coming in?'}
        </p>
        <div className="mt-4 grid gap-3">
          {options.map((o) => (
            <button key={o.label} type="button" onClick={() => { setSignInIntent(o.role); onChange({ role: o.role, mode: o.mode }) }}
              className={o.mode === 'signup'
                ? 'rounded-xl bg-orange-500 py-3 text-sm font-bold text-white'
                : 'rounded-xl border border-orange-500 py-3 text-sm font-bold text-orange-600 dark:text-orange-300'}>
              {o.label}{o.mode === 'signup' ? ': sign up' : ': log in'}
            </button>
          ))}
        </div>
      </Card>
    )
  }
  return (
    <>
      {role === 'parent' && (
        <div className="mb-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-neutral-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-neutral-200">
          <p className="font-bold text-neutral-900 dark:text-neutral-50">Following your child?</p>
          <p className="mt-1">
            Their trainer adds your email to your child's profile. Sign up or log in with that email to
            see your child's progress. If it isn't linked yet, we'll help you ask the trainer. If you
            also coach, one account is both trainer and parent, and you can switch between the two
            views from the account menu.
          </p>
        </div>
      )}
      <SignInCard
        trainerAccess={trainerAccess} role={role} mode={mode}
        onSwitchRole={(next) => { setSignInIntent(next); onChange({ role: next, mode }) }}
        onSwitchMode={(next) => onChange({ role, mode: next })}
      />
    </>
  )
}

export function LandingPage({ trainerAccess }: { trainerAccess: ReturnType<typeof useTrainerAccess> }) {
  const [privacyOpen, setPrivacyOpen] = useState(false)
  // Which role's sign-in dialog is open. A signed-in account that still needs a workspace (or a
  // child link) opens it automatically, since that is the next step for them.
  const [flow, setFlow] = useState<AuthFlow | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const open = flow !== null || (trainerAccess.needsWorkspace && !dismissed)
  const choose = (role: SignInIntent) => { setSignInIntent(role); setFlow({ role, mode: null }); setDismissed(false) }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-white text-neutral-900 dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-950 dark:text-neutral-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <a href="/" aria-label="CoachCub home" className="rounded-xl dark:bg-white dark:px-2 dark:py-1">
          <img src="/logos/coachcub-logo.webp" alt="CoachCub" width={1844} height={403} className="h-9 w-auto md:h-11" />
        </a>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button type="button" onClick={() => { setFlow({ role: null, mode: null }); setDismissed(false) }}
            className="whitespace-nowrap rounded-full bg-orange-500 px-4 py-2 text-sm font-bold text-white hover:bg-orange-600">
            Sign in
          </button>
        </div>
      </header>

      <main id="top">
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pb-12 pt-6 md:grid-cols-[5fr_7fr] md:pt-12">
          <div>
            <p className="inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
              For youth basketball trainers
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Every practice is a step towards a bigger cub.
            </h1>
            <p className="mt-4 max-w-xl text-lg text-neutral-600 dark:text-neutral-300">
              CoachCub is built for trainers: plan trainings, rate skills in two taps and invite parents.
              Kids pick a mascot that grows with their skills, and invited parents follow the progress.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" onClick={() => choose('trainer')}
                className="rounded-full bg-orange-500 px-6 py-3 text-base font-bold text-white hover:bg-orange-600">
                I'm a trainer
              </button>
              <button type="button" onClick={() => choose('parent')}
                className="rounded-full border-2 border-orange-500 px-6 py-3 text-base font-bold text-orange-600 hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-500/10">
                I'm a parent
              </button>
            </div>
          </div>

          <HeroVideo />
        </section>

        <section className="mx-auto max-w-6xl px-4 py-10">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">One app, three happy teams</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
              <IconBallBasketball aria-hidden className="h-4 w-4" stroke={2} />
              Basketball available now
            </span>
          </div>
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
        <p>Trainers, <button type="button" onClick={() => choose('trainer')} className="font-semibold text-orange-600 underline">sign up or log in</button> to set up your group and invite parents.</p>
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

      <Dialog open={open} onOpenChange={(next) => { if (!next) { setFlow(null); setDismissed(true) } }}>
        <DialogContent showCloseButton={false} className="max-w-md border-0 bg-transparent p-0 shadow-none ring-0">
          {/* Its own row above the cards, so it reads as closing the whole dialog, not the note. */}
          <div className="flex justify-end">
            <DialogClose asChild>
              <button type="button" aria-label="Close"
                className="grid size-9 place-items-center rounded-full bg-white text-neutral-900 shadow-md hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-700">
                <XIcon className="size-4" aria-hidden="true" />
              </button>
            </DialogClose>
          </div>
          <DialogTitle className="sr-only">Sign in to CoachCub</DialogTitle>
          <DialogDescription className="sr-only">Choose whether you are new or already have an account, then use your email.</DialogDescription>
          <AccessCard trainerAccess={trainerAccess} flow={flow} onChange={(next) => { setFlow(next); setDismissed(false) }} />
        </DialogContent>
      </Dialog>
      {privacyOpen && <PrivacyPolicyScreen onClose={() => setPrivacyOpen(false)} />}
    </div>
  )
}
