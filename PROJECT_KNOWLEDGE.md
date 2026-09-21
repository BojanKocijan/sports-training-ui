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
   - **Trainer as informal referrer** — once a trainer sees the value (like Basketball App now), give them a simple one-line message/link they can forward to the treasurer/president: *"I'm using this — the club needs to pay €X/season to keep access for all groups and parents."* The trainer doesn't need to "sell," just pass along the decision.
   - **Club pays, becomes a reference** — every new paying club becomes proof for the next one (same school-by-school pattern Seesaw used).
2. **Federation (NBB/Club.Basketball.nl) comes later** — once there are 5–10 paying clubs as proof, approach as a partner with a track record, not as an unknown competitor to their admin tool.

### Realan vremenski okvir do profitabilnosti (Sept 2026)

Bootstrap side-project (solo osnivač + 1 developer, 20% profit-share) bez spoljnog kapitala — tempo rasta je strukturno sporiji od standardnih SaaS benchmark-ova jer nedostaju kapital i puno radno vreme koji te benchmark-ove čine mogućim.

Industrijski benchmark-ovi za profitabilnost startupa se ne primenjuju direktno na ovaj projekat, jer pretpostavljaju kapital i puno radno vreme osnivača koji ovde ne postoje:

| Referentna tačka | Standardni SaaS/VC benchmark | Ovaj projekat (bootstrap side-project) |
|---|---|---|
| Break-even | 2-5 godina (80% startupa) | 3-5+ godina, procena |
| €1M ARR ekvivalent ("ozbiljan" prihod) | 33 meseca od prvog klijenta (samo ~4% startupa) | Nije uporediva meta — cilj treba redefinisati na sopstvenu skalu |
| Održiv proizvod sa materijalnim prihodom | 24+ meseci minimum | 24+ meseci, potvrđeno projekcijama (12-18 klubova, €2-3.5k prometa do kraja 2. godine) |
| Pun exit/IPO nivo | 7-12+ godina | Nije relevantan cilj za ovaj projekat |

**Zašto je razlika strukturna, ne izvedbena:** standardni benchmark-ovi pretpostavljaju sales/marketing budžet (30%+ prihoda kod uspešnih B2B SaaS), puno radno vreme osnivača, i sposobnost brzog skaliranja akvizicije. Ovaj projekat radi bez sva tri faktora — sporiji tempo je posledica nedostajućih sastojaka, ne lošeg izvršenja.

**Fazni plan:**
- **Godina 1-2 (validacija):** 10-20 klubova, €2.000-3.500 godišnjeg prometa, profit koji pokriva troškove i simboličan iznos — cilj je dokazana retencija i reference, ne zarada
- **Godina 3-4 (skaliranje unutar niše):** ako retencija sezona-na-sezonu prelazi 80% i reference dovode nove klubove organski, razmotriti prelazak na klub-wide/enterprise pricing (€800-1.500/sezona, vidi Tier 3 "Club" u issue #67) i eventualno drugi sport (rukomet ili odbojka, ne fudbal zbog KNVB-ovog besplatnog Rinus alata) — realan cilj 50-100 klubova, prvi profit vredan pomena
- **Godina 5+:** tek na ovom nivou postaje relevantno pitanje stalnog posla za oboje (osnivača i developera) — pod uslovom da prethodne faze potvrde model

**Checkpoint:** kraj sezone 2027/2028 — eksplicitna tačka odluke da li nastaviti kao side-project, agresivnije pivotovati (enterprise pricing, dodatni sport, mogući spoljni kapital), ili preispitati ceo pristup. Metrika uspeha do tada: broj klubova, retencija sezona-na-sezonu, ne apsolutni profit.

### Competitive scouting (Sept 2026)

A scan of 19 youth-sports coaching apps across basketball, soccer, swimming, and multi-sport platforms (full report: `scratchpad_competitors.html`, triggered by finding levelupbasket.com), framed against the plan to generalize this app beyond basketball-only.

**Findings:**
- 13 apps are sport-specific single-lane players (basketball: Level Up, Elite Hoops, Jr. NBA Coach, The Hoops Geek; soccer: SoccerXpert, SoccerDrive; swimming: SwimShare, MySwimPro, Swim Coach App).
- 6 apps already do multi-sport practice planning: TeamSnap, Coach Planner, Practice Plan App, MOJO Sports, Sportlingo, planet.training. **"Supports many sports" alone is not a differentiator** — it already has six direct competitors.
- Every one of those 19 apps is built coach-outward — planning, roster, attendance, comms. Where a parent view exists at all, it's a schedule/RSVP feed, not per-skill development. Athlete-facing apps (MySwimPro) get closer but serve adults training themselves, not a coach reporting on a child.

**Reframed positioning (this is the actual product, not a side effect):** this app is a **child development & progress-sharing tool for parents**, not a practice planner that happens to have a parent screen. The training session is where the data comes from; the parent-facing progress view is the product. That reframes what's load-bearing for the multi-sport milestone:
- **Per-skill, per-kid progress tracking** is the core data model, not a bolt-on — must generalize cleanly across sports.
- **Parent-code sharing** (no login, no PII, nickname only — see `PRIVACY.md`) is the delivery mechanism for that progress data, and needs to stay zero-account as the sport list grows.
- **Age-scoped, no-leaderboard framing** (progress against yourself, not ranked against teammates) is the psychology layer already planned in this milestone (pedagogical guidance, gamification) — it's what makes the progress data mean something to a parent instead of being a number. This is the piece nothing in the competitive set does.

Sport count and exercise-library breadth are table stakes (six competitors already there); the progress-and-psychology layer for parents is not in any of the 19 apps reviewed.

### Gamification + AI-coach competitors (Sept 2026)

A follow-up scan specifically for apps combining progress tracking, gamification, and a parent-facing view for kids — the closest analogs to this app's planned gamification layer (§ above) and the 3D mascot concept (see `PROJECT_KNOWLEDGE.md` mascot notes).

**Findings:**
- **5StarKidz** — closest analog: season-long match/training tracking, an **AI coach** giving personalized tips/drills, **gamification** (badges, progress trophies), and an explicit parent view where parents follow their kid's progress and celebrate milestones together. Youth football (soccer), currently outside the US App Store top 30 — not mass-adopted.
- **Sportlingo** — gamified lessons (streaks, badges, challenges), coaches build AI-assisted training plans, individual + team progress on one dashboard. Multi-sport (soccer, basketball, baseball…), $4.99 starting price. Already listed above as a multi-sport practice-planning competitor; this adds the gamification angle.
- **Balls Utopia / Skill Track / Pivot: Athletics** — smaller parent-facing stat trackers (mostly older-kid/parent self-logged post-game data), shallow gamification (streak badges only), no coach in the loop, no pedagogical content.

**What this means for positioning:**
- All three gamification/AI-coach competitors above are **B2C — the parent pays directly**. This app's model is **B2B2C** (club/trainer pays, parent access is free) — nobody in this set combines that distribution with a gamified, parent-facing progress view. That's a real differentiation opening on top of the psychology-layer gap already identified above.
- 5StarKidz's AI-coach approach exists and has **not achieved mass adoption** (outside top 30) — a signal against building an AI-coach feature here; the human trainer + visual progress tracking is the stronger, cheaper wedge, not an AI replacement for the trainer.
- Gamification should stay **individual, not comparative** — progress shown as a kid's own visual arc (e.g. badges, or the mascot growing/unlocking a new look as skills are rated), never a leaderboard ranking kids against each other. This matches the age-scoped, no-leaderboard framing already planned in this milestone and avoids the comparison/pressure risk that youth sports pedagogy (LTAD framework) warns against for this age group.
- Natural next step once gamification badges (already in progress, see Changelog) are proven out: connect visual progress to the 3D mascot concept (mascot "grows"/unlocks look as the kid progresses) rather than building it as a separate feature.

### Current status (honest, Sept 2026)

The app is **one week old**. There are **no paying clubs yet** — zero revenue. What exists today: **3 trainers** (Basketball App, U8 + U10 groups) using the shipped product with real, unpaid, informal usage — logged plans, rated player progress, an active live session. That's real signal (people are actually using it on the field), but it is not yet "proof" of a paying club, retention, or demand — it's pre-validation, week one. Every projection elsewhere in this milestone (10-20 clubs by year 2, etc.) is a target, not a trendline extrapolated from current traction — there isn't enough traction yet to extrapolate from.

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
| First-pass gamification badges in `PlayerDetailModal` ("Tried it all", "Consistent", "Rising star") | Pulls forward a slice of the Milestone 1 gamification plan (per-category badges, confirmed-ideas-only, no leaderboards) using data already loaded for the Stats tab — no new endpoint. Thresholds (5 ratings, 2.5 avg) are a first guess, not user-tested; revisit once real usage data exists | 2026-09-17 |

---

## 5. Active work

- **Descoping Setup + Vocabulary tabs "for now"** — remove the two tab entries from `SideNav`/`BottomNav` and their render branches in `App.tsx`; keep `SetupScreen.tsx`/`VocabularyScreen.tsx` and their data untouched for an easy revert later.
- **Accessibility + interaction-state pass**, one PR per slice:
  1. Nav shell — `SideNav`, `BottomNav`, `ClubHeader`, `GroupMenu`, `ThemeToggle`
  2. Core interactive widgets — `RatingWidget`, `CategoryChip`/`CategoryBadges`, `SelectableExerciseCard`, `ExerciseLibraryCard`
  3. Forms/modals — `PlayerDetailModal`, `PlanTrainingWizard`, `LockScreen`, `TrainerAccessBar`

## 6. Open questions / known issues

- [ ] Visual tone pass: current reference app found for this category (MyKidDid, US-only, App Store) reads as too serious/corporate for what this app should feel like — light, sporty, clean, and fun instead. Not yet scheduled against a specific slice; fold into whichever widgets/forms slice comes after the primitives PR (#44) lands, or split out as its own pass once the primitives' current neutral/orange palette is reviewed against this direction.

- [ ] #34 — Add harder U10 exercises beyond warm-ups, align levels across all categories.
- [ ] #26 — Roster: reassign a player to another group (promotion flow) — touches the same nav area as the descoping work above.
- [ ] #14 — Session tab: show who's controlling the shared clock when two trainers are both unlocked.

---

## 7. Data layer

`localStorage` for device-local state (exercise ratings/history). Everything shared across devices/trainers (plans, club/group data, passcode verification, live session clock) is fetched from `sports-training-api` — see that repo's `PROJECT_KNOWLEDGE.md` for the backend architecture.

---

## Changelog

- **2026-09-19** — sports-training-api#65 Parent-code reads now use `POST /players/:id/parent-code/read` with the trainer passcode in the JSON body. The old credential-bearing GET query URL was removed so browser history and URL logging cannot capture the trainer passcode; the UI action test enforces that no parent-code request URL contains `passcode=`.
- **2026-09-16** — File created; captured current scope, architecture, the a11y/interaction-state gap found in this session, and the plan to descope Setup/Vocabulary.
- **2026-09-17** — Added competitive scouting summary (§ Milestone 1); reframed positioning after review — this is a child development & progress-sharing tool for parents, not a practice planner with a parent screen attached. Per-skill progress tracking + parent-code sharing + age-scoped psychology framing are the load-bearing differentiators for the multi-sport milestone, not sport count or zero-PII alone.
- **2026-09-20** — Added gamification/AI-coach competitor scan (§ Milestone 1): 5StarKidz, Sportlingo, and smaller stat-tracker apps are all B2C (parent pays) — none combine gamified parent-facing progress with this app's B2B2C model. Confirms individual (non-comparative) gamification over an AI-coach feature, and links the gamification badges already in progress to the future 3D mascot concept.
- **2026-09-21** — Added realistic timeline-to-profitability (§ Milestone 1): bootstrap side-project without external capital runs 3-5+ years to break-even vs. standard 2-5 year SaaS/VC benchmarks — the gap is structural (no sales budget, no founder full-time, no fast-scaling acquisition), not a sign of underperformance. Phased plan through Year 5+, with an explicit end-of-2027/2028-season checkpoint to decide continue/pivot/reassess.
- **2026-09-21** — Corrected "Proof this isn't just theory" → "Current status (honest)" (§ Milestone 1): the app is one week old, zero paying clubs, 3 trainers using it unpaid. Removes the earlier "first real club" framing, which overstated current traction against the pipeline projections elsewhere in this milestone.
