# Project Knowledge — sports-training-ui

**Repo:** BojanKocijan/sports-training-ui (local checkout: `basketball/`)
**Owner:** @BojanKocijan
**Status:** active
**Pairs with:** [sports-training-api](https://github.com/BojanKocijan/sports-training-api)

> Living memory for this project. Read at session start; updated whenever the project's purpose, architecture, or open questions change — not just at PR time.

---

## Milestone 1 — Business case

### What we're building

A pedagogy-and-development tool for volunteer youth-sports trainers — not a club administration platform. A trainer opens the app on the field, runs a structured, age-appropriate training session with a live-synced timer, and logs how each kid/group is developing. A parent, given a code by the trainer, sees their child's schedule and progress. That's the whole product. No membership admin, no payment collection, no chat — those are explicitly out of scope (see positioning below).

### Why this is worth the time (the market case)

Researched the Dutch amateur sports club market (Sept 2026):

- Nearly every major sport federation in NL (KNVB/football, KNHB/hockey, KNKV/korfbal, Nevobo/volleyball, NHV/handball, and now NBB/basketball via **Club.Basketball.nl**, launched June 2025) already gives clubs free, often near-mandatory software for **administration**: membership, attendance records, payments/invoicing, communication.
- That means competing on club administration is a losing bet — we'd be building a free alternative to something clubs already get free from their own federation.
- **But none of those platforms touch training content or pedagogy.** No exercise library, no session planning/running tool, no per-skill development tracking. That gap is real, structural, and not specific to basketball — it's true across every federation surveyed.
- Basketball specifically tends to be a single-sport club (not commonly combined with other sports in the Dutch "omnivereniging" model), so the near-term addressable shape is "one club, one sport" — with room to add a second sport per club later as a paid add-on (see monetization below), not a requirement to build multi-sport complexity now.

**The business case in one sentence:** federations already solve "who's coming and who's paid" for free — we solve "what do we actually do at training and is it working," which nobody else provides.

### Monetization (the actual license unit)

One subscription per **sport, per club** (`sport_subscriptions`, already in the schema). A club with just basketball pays for one; a club that later adds a second sport pays for a second. No payment processing needed yet — subscriptions are provisioned manually until there's real demand to automate it.

### Go-to-market

1. **Freemium/pilot for the trainer** — the trainer uses the basic version (session planning, live timer, progress tracking) for free, with no conversation with the club needed. That's the marketing.
   - **Trainer as informal referrer** — once a trainer sees the value (like Dunckers now), give them a simple one-line message/link they can forward to the treasurer/president: *"I'm using this — the club needs to pay €X/season to keep access for all groups and parents."* The trainer doesn't need to "sell," just pass along the decision.
   - **Club pays, becomes a reference** — every new paying club becomes proof for the next one (same school-by-school pattern Seesaw used).
2. **Federation (NBB/Club.Basketball.nl) comes later** — once there are 5–10 paying clubs as proof, approach as a partner with a track record, not as an unknown competitor to their admin tool.

### Proof this isn't just theory

The first real club (Dunckers Hilversum, U8 + U10 groups) is already using the shipped product with real data: logged plans, rated player progress, an active live session. This milestone is about deepening that, not starting from zero.

### What's in this milestone

Everything currently open in both repos, organized by the positioning above:

**Content & pedagogy (the actual product wedge)**
- Exercises/categories move from hardcoded frontend data into the database, scoped by sport — a new sport becomes data, not a code change.
- Pedagogical guidance shown live during a session, scoped by age group — not just what to do, but how to coach it at that age.
- Gamification of the existing progress data (per-category badges, "tried it all", group milestones, a season progress map, jersey unlocks) — confirmed ideas only, age-scoped, no leaderboards ranking kids against each other.

**Parent access (the lightweight, code-based layer)**
- A trainer issues a parent a code scoped to their child's nickname — no club-admin role, no email/password, no payment tracking.
- Parent view: child + group progress, training schedule, upcoming matches.
- One-way trainer notes on a training (e.g. "cancelled, rain") and parent-reported absences — explicitly not a messaging channel; that's WhatsApp's job, not ours.

**Competition**
- Matches/results tracked per group — same shape as training plans, no new access model needed.

**Multi-sport, gated by subscription**
- When a club has more than one sport, each sport is filtered by whether the club actually subscribed to it (`sports` → `groups` filter chain).

**Loose ends from earlier work**
- Session-control ownership indicator when two trainers are both unlocked at once (low priority — accepted tradeoff, pick up only if it's caused a real collision).
- Player promotion flow (reassigning a player to a new group next season).

### Explicitly not in this milestone

Club membership administration, payment collection/processing, in-app two-way messaging with parents. These lose to free federation tooling or already-dominant consumer tools (WhatsApp) — see positioning above. Not ruled out forever, just not where the time goes now.

---

## 1. What this project does and why

A mobile-first React app for running a youth basketball club's training sessions, built around the U8 group first. A trainer unlocks a group with a passcode, picks or builds a training plan from the exercise library, and runs a live timer during the actual session on their phone — the same shared clock is visible/controllable from any unlocked trainer's device in that group (backed by `sports-training-api`). Exercise ratings and history are stored per-device in `localStorage`; anything shared across devices (plans, club/group info, the passcode check) goes through the API.

Screens today: **Groups** (roster/plans per group), **Players** (roster + progress per player), **Library** (browse/filter/rate exercises, build a custom or full 60-minute session), **Session** (the live run-through with bilingual coaching cues), plus **Setup** (pre-session checklist/coaching principles) and **Vocabulary** ("Words" — searchable bilingual Dutch/English coaching vocabulary), and a read-only **Parent view** unlocked by a trainer-issued single-child code.

**Why this exists:** the trainer needed something faster than paper/spreadsheets during an actual practice — pick exercises, see timing, rate what worked, without breaking flow mid-session. It grew from single-group U8 to a shape that could support multiple groups and (eventually) multiple sports.

---

## 2. Target users

| Role | Description |
|---|---|
| Trainer | Full access after entering the group's passcode: builds plans, runs the session, rates players/exercises. |
| Parent | Read-only single-child view via a trainer-issued code — no passcode, no write access. |

---

## 3. Architecture

| Layer | Choice | Why |
|---|---|---|
| Framework | React 19 + TypeScript, Vite 8 | |
| Styling | Tailwind v4 (`@tailwindcss/vite`) — no component library | Small app, direct utility classes; not a `@digital-ai/dot-components` project |
| Local persistence | `localStorage` (per-device exercise ratings/history) | Shared state (plans, passcode, club/group data) goes through `sports-training-api` via `src/lib/apiClient.ts` |
| Testing | Vitest + Testing Library, Playwright for e2e | |
| Hosting | Netlify, auto-deploy on push to `main`; unit suite runs before `vite build`, blocking a bad deploy | GitHub Pages hosting was dropped in favor of Netlify-only |

`src/components/` holds ~30 screen/widget components, wired into tabs in `App.tsx` via `SideNav`/`BottomNav`. No design-system layer — each component owns its own Tailwind classes directly.

**Known gap (found 2026-09-16):** interaction states are thin across the component set — only `SideNav` has any `hover:` classes, no component uses `focus-visible:`, and only 7 of 30 component files use any `aria-*` attribute. Planned as a slice-by-slice accessibility/interaction-state pass (see §5).

---

## 4. Key architectural decisions

| Decision | Rationale | Date |
|---|---|---|
| Setup + Vocabulary tabs unwired from nav | Descoped for now to focus on core training-session flow; component/data files kept in place (not deleted) so re-enabling is a one-line nav change, not a rebuild | 2026-09-16 |
| A11y/interaction-state pass done slice-by-slice (nav shell → widgets → forms), one PR per slice | Keeps each PR reviewable; nav shell first since every screen shares it | 2026-09-16 |
| Shared `src/components/ui/` primitives layer: `Button`, `Chip`, `Card`, `Modal` | Real duplication found across 30 components — 22 files hand-roll `type="button"`, the same `rounded-2xl border ... bg-white p-3` card shell appears 11+ times, pill/chip styling repeats, 3 separate modal overlays each reimplement `fixed inset-0`. Building hover/focus-visible/active/disabled/aria into each primitive once, rather than fixing every copy separately, is what makes the a11y pass tractable | 2026-09-16 |
| Primitives ship in the same PR as the nav-shell slice, not alone | Proves each primitive against a real screen immediately instead of shipping unused components | 2026-09-16 |

---

## 5. Active work

- **Descoping Setup + Vocabulary tabs "for now"** — remove the two tab entries from `SideNav`/`BottomNav` and their render branches in `App.tsx`; keep `SetupScreen.tsx`/`VocabularyScreen.tsx` and their data untouched for an easy revert later.
- **Accessibility + interaction-state pass**, one PR per slice:
  1. Nav shell — `SideNav`, `BottomNav`, `ClubHeader`, `GroupMenu`, `ThemeToggle`
  2. Core interactive widgets — `RatingWidget`, `CategoryChip`/`CategoryBadges`, `SelectableExerciseCard`, `ExerciseLibraryCard`
  3. Forms/modals — `PlayerDetailModal`, `PlanTrainingWizard`, `LockScreen`, `TrainerAccessBar`

## 6. Open questions / known issues

- [ ] #34 — Add harder U10 exercises beyond warm-ups, align levels across all categories.
- [ ] #26 — Roster: reassign a player to another group (promotion flow) — touches the same nav area as the descoping work above.
- [ ] #14 — Session tab: show who's controlling the shared clock when two trainers are both unlocked.

---

## 7. Data layer

`localStorage` for device-local state (exercise ratings/history). Everything shared across devices/trainers (plans, club/group data, passcode verification, live session clock) is fetched from `sports-training-api` — see that repo's `PROJECT_KNOWLEDGE.md` for the backend architecture.

---

## Changelog

- **2026-09-16** — File created; captured current scope, architecture, the a11y/interaction-state gap found in this session, and the plan to descope Setup/Vocabulary.
