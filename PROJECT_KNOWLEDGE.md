# Project Knowledge — sports-training-ui

**Repo:** BojanKocijan/sports-training-ui (local checkout: `basketball/`)
**Owner:** @BojanKocijan
**Status:** active
**Pairs with:** [sports-training-api](https://github.com/BojanKocijan/sports-training-api)

> Living memory for this project. Read at session start; updated whenever the project's purpose, architecture, or open questions change — not just at PR time.

---

## Milestone 1 — Business case

### What we're building

A pedagogy-and-development tool for volunteer youth-sports trainers — not a club administration platform. A trainer opens the app on the field, runs a structured, age-appropriate training session with a live-synced timer, and logs how each kid/group is developing. A parent, invited by the trainer at the email linked to their child, gets a read-only view of that child's schedule and progress. That's the whole product. No membership admin, no payment collection, no chat — those are explicitly out of scope (see positioning below).

### Why this is worth the time (the market case)

Researched the Dutch amateur sports club market (Sept 2026):

- Nearly every major sport federation in NL (KNVB/football, KNHB/hockey, KNKV/korfbal, Nevobo/volleyball, NHV/handball, and now NBB/basketball via **Club.Basketball.nl**, launched June 2025) already gives clubs free, often near-mandatory software for **administration**: membership, attendance records, payments/invoicing, communication.
- That means competing on club administration is a losing bet — we'd be building a free alternative to something clubs already get free from their own federation.
- **But none of those platforms touch training content or pedagogy.** No exercise library, no session planning/running tool, no per-skill development tracking. That gap is real, structural, and not specific to basketball — it's true across every federation surveyed.
- Basketball specifically tends to be a single-sport club (not commonly combined with other sports in the Dutch "omnivereniging" model), so the near-term addressable shape is "one club, one sport" — with room to add a second sport per club later as a paid add-on (see monetization below), not a requirement to build multi-sport complexity now.

**The business case in one sentence:** federations already solve "who's coming and who's paid" for free — we solve "what do we actually do at training and is it working," which nobody else provides.

### Proposed tiers and licensing (FREE capacity enforced locally; paid tiers planned)

The founder's proposed packages replace the earlier idea of one subscription per sport per club. `sport_subscriptions` is an existing placeholder, **not** an entitlement or billing system. Paid pricing and features are proposals; FREE capacity rules are implemented in the tracked schema/migration, but take effect on the hosted database only after that migration is applied. Payment processing is not active.

COACH / TEAM and CLUB should offer a choice of **monthly or seasonal billing**. The working assumption is a 12-month season. Proposed seasonal prices are about 16–17% below the total of 12 monthly payments; they are pricing proposals, not active checkout. FREE never expires, and FEDERATION keeps custom pricing.

| Tier | Seasonal price | Monthly price | Capacity and included capabilities |
|---|---|---|---|
| **FREE** | **€0** | **€0** | 1 sport, 1 group, 6 players, 1 trainer; full core feature set; no expiry. |
| **COACH / TEAM** | **€60 for the first group; €50 per additional group** | **€5.99 for the first group; €4.99 per additional group** | Standard roster included; owner plus limited co-coaches; personal/team workspace, custom exercises, custom training templates, parent access, progress, and live session. |
| **CLUB** | **€280 including 5 groups; €45 per additional group** | **€27.99 including 5 groups; €4.49 per additional group** | Central billing, club admin, trainer management, shared club exercise library and training templates, cross-group visibility, club-owned historical data. |
| **FEDERATION** | **Custom pricing** | **Custom pricing** | Multiple clubs and sports, federation admins, shared federation content/templates, cross-club governance and reporting. |

At 5 groups COACH / TEAM costs €260 and CLUB €280 for a season; both cost €460 at 9 groups. CLUB becomes cheaper only from 10 groups, so its earlier value proposition is governance, shared assets and club-owned history rather than a volume discount.

“Full core” means existing planning, live sessions, player progress and parent access remain available on FREE within its capacity limits; listing them under COACH / TEAM does not make them paid-only. Custom exercises and reusable templates are separate from the existing shared exercise library and dated training plans.

**Platform superadmins** have full feature and tenant access without payment or expiry through a verified Auth account and TOTP MFA. They do not use a group passcode or browser-held service key. Explicit support context and audit trail remain future work.

**Implementation direction:** `clubs` remains the workspace behind FREE, COACH / TEAM and CLUB, with `groups.club_id` ownership. Named trainer identity and membership are now tracked by the API migration. Parent access uses a named Auth identity matched to child-scoped `parent_links`; it does not create a trainer membership. Before multi-club rollout, finish tenant filtering for remaining public reference endpoints and add paid licence/entitlement and billing records. Preserve historical data on downgrade or lapse; block over-limit writes instead of deleting data.

### Canonical account roles and authorization scopes

Roles and product tiers are separate concepts: a **role** determines what a person may do and in which scope; a **tier** determines workspace capacity/features.

- **Superadmin** — platform-wide role stored separately from club memberships (`platform_admins`). Requires a named Supabase Auth account plus TOTP/AAL2. Has access across clubs/groups, does not require a subscription and does not consume a trainer seat.
- **Owner** — club/workspace-wide role. Stored as a club-level membership with `group_id = NULL`. An Owner implicitly has trainer capabilities in every group belonging to that workspace via `groups.club_id`; do not create a duplicate Trainer membership just so the Owner can coach. On FREE the Owner is the single adult/trainer seat.
- **Club admin** — club/workspace-wide administrative role with `group_id = NULL`. Administration alone does not grant training-write capabilities. If a Club admin also coaches, give that user an additional group-scoped Trainer membership for the relevant group(s).
- **Trainer** — group-scoped role. `group_id` is required and training access is limited to explicitly assigned groups.
- **Co-coach** — group-scoped role. `group_id` is required and access is limited to explicitly assigned groups; exact paid-tier seat limits remain a future business rule.
- **Parent** — a named Supabase Auth identity, but not a `trainer_memberships` role. Access is read-only and comes only from `parent_links` rows whose email matches the confirmed Auth email; each link is scoped to one child.
- **Federation admin** — future federation-scoped role. It must live in a separate federation membership model, not in `trainer_memberships`.

Membership scope invariants:
- `owner` and `club_admin` => `group_id IS NULL`
- `trainer` and `co_coach` => `group_id IS NOT NULL`
- an Owner can train a group when `owner.club_id == group.club_id`
- a Club admin cannot train merely because they are a Club admin
- Superadmin authorization is independent from club memberships
- Parent authorization is independent from trainer memberships and is derived only from the authenticated email's child links

### Canonical authentication, invitation, and account lifecycle

This section is the cross-repository source of truth for authentication in `sports-training-api` and `sports-training-ui`. The UI copy must mirror it. If an older changelog entry or issue description conflicts with this section, this section describes the current behavior.

**Identity and role resolution**
- One normalized email represents one Supabase Auth identity. Deleting a workspace, changing the login screen, or adding another role never creates a second identity for the same email.
- The login choice expresses the person's intent; it does not grant or remove authorization. After authentication, the API derives `admin`, `trainer`, and `parent` roles from `platform_admins`, live `trainer_memberships`, and child-scoped `parent_links`.
- One identity may have several roles. The UI may open the requested valid view and allow switching views, while the API remains the authority for every protected request.
- Group passcodes and parent codes are no longer authentication mechanisms. No credential belongs in a request URL.

**Trainer entry**
- **New trainer** is self-service signup for an email that has no Auth account. `POST /auth/signup/request` sends the branded confirmation email. After link/OTP verification, the authenticated account names a workspace and chooses the first available basketball group through `POST /auth/workspace`; creation is atomic and starts on FREE.
- Signup for an existing email returns `409` with “Log in instead.” This is intentional even when that identity's previous workspace was soft-deleted: identity ownership must be proven through login before a new workspace can be created.
- **Existing trainer** covers owners, club admins, invited trainers, returning trainers, and platform superadmins. `POST /auth/request-code` uses `shouldCreateUser: false` and always returns the same generic response so it cannot reveal whether an account exists. The email contains a one-click sign-in link and an email-bound OTP fallback.
- An owner/club admin invites a trainer to selected groups. The Auth invitation and membership are created together; `trainer_memberships.confirmed_at = NULL` is shown as **Pending**. A pending email can be corrected and re-sent. A successful invite-link or OTP session marks it **Confirmed**. Confirmed access cannot be silently reassigned to another email.
- A platform superadmin signs in through **Existing trainer**. The `platform_admins` record, not the selected login button or email string in UI code, grants platform access. Production superadmin access also requires TOTP/AAL2.

**Parent entry**
- Parents do not self-register or create workspaces. The parent entry point goes directly to login; there is no new/existing-parent choice.
- A trainer links an email to one child. A new Auth identity receives the **Invite user** email with a one-click **Accept invitation** link. An existing identity receives the ordinary one-click sign-in email with the OTP retained as a fallback.
- `parent_links.confirmed_at = NULL` is shown as **Pending**. Before confirmation, the trainer may use **Correct email** and **Save & resend**. A successful invite-link session through `GET /auth/me` or an OTP session through `POST /auth/verify-code` marks matching links **Confirmed**. Confirmed links cannot be silently reassigned.
- Parent authorization is read-only and limited to children linked to the authenticated, normalized email. A parent never receives a trainer membership and cannot read the whole roster or perform trainer writes.

**Email links, sessions, and UI state**
- The canonical Auth templates live under `supabase/templates/`: confirmation for self-service signup, invite for a new invited identity, and magic-link/OTP for ordinary login. Hosted Supabase templates must mirror these files, `UI_BASE_URL` must be an allowed redirect, and production requires configured SMTP.
- Invite and magic links establish the Supabase session directly. OTP remains a fallback and must be verified together with its email; a code alone is not an identity.
- When a link opens with a new session fragment, that incoming session takes precedence over any saved browser session before account routing. This prevents a newly invited trainer/parent from being shown as the admin who happened to be logged in previously.
- Switching role or login/signup mode clears stale authentication errors so an “account already exists” message is not carried into another flow.

**Workspace soft delete and returning owners**
- Deleting a workspace is a soft delete: `clubs.deleted_at` is set. Club data and historical membership rows remain in Postgres, while every access/discovery query excludes deleted clubs. The user therefore loses access to the deleted workspace without destroying history.
- Workspace deletion never deletes the Supabase Auth identity. That identity may also be a parent, superadmin, or member of another live workspace, and deleting it would be an unsafe cross-scope side effect.
- A returning owner must choose **Existing trainer / Log in instead** and authenticate with the existing email. If the identity has no live workspace and no linked child, the UI shows **Name your workspace**.
- `create_self_service_workspace` blocks a second live workspace but ignores historical memberships whose club is soft-deleted. The authenticated returning owner can therefore create a new FREE workspace while the old workspace remains deleted and auditable.

FREE authorization:
- one non-expiring workspace
- one sport
- one ordinary group
- 15 players by default, adjustable per workspace by a platform superadmin
- one adult account, which is the Owner and also performs the trainer role operationally
- the Owner's club-level membership provides access to the FREE group's training functionality

**Business rules still to settle before paid enforcement:** confirm the 12-month season and proposed monthly prices; renewal/grace behavior; monthly cancellation and switching between billing intervals; “standard roster” size; co-coach seat count; COACH / TEAM and CLUB sport allowances; whether prices include VAT; ownership/transfer on upgrade and downgrade. FREE remains non-expiring regardless of those decisions. The migration assigns the existing U8/U10 club to FREE with its current data grandfathered: no new groups or players while above the FREE limits; existing player edits and same-club promotions continue. Trainer group passcodes are removed; the FREE trainer seat is a named Auth account.

### Go-to-market

1. **FREE for the trainer** — the trainer uses the basic version (session planning, live timer, progress tracking) for free, with no conversation with the club needed. That's the marketing.
   - **Trainer as informal referrer** — once a trainer sees the value, give them a simple message/link they can forward to the treasurer/president: the club can pay for more groups, collaboration and shared content, while the core remains free within FREE limits. The trainer doesn't need to "sell," just pass along the decision.
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
- **Godina 3-4 (skaliranje unutar niše):** ako retencija sezona-na-sezonu prelazi 80% i reference dovode nove klubove organski, razmotriti veće enterprise/federation ugovore iznad predložene početne CLUB cene (€280/sezona), i eventualno drugi sport (rukomet ili odbojka, ne fudbal zbog KNVB-ovog besplatnog Rinus alata) — realan cilj 50-100 klubova, prvi profit vredan pomena
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
- **Child-scoped parent email invitations** are the delivery mechanism for that progress data. Parents use named Auth identities and receive read-only access only to linked children; the invitation must remain lightweight as the sport list grows.
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

**Parent access (the lightweight, invite-based layer)**
- A trainer links a parent email to a child and sends an invitation — no club-admin role, password or payment tracking.
- A new parent accepts the invitation link and enters the app directly. An existing account receives a one-click sign-in link with email + OTP retained only as a fallback.
- The parent entry point goes directly to existing-parent login; parents do not use the self-service new-workspace signup choice.
- `parent_links.confirmed_at` changes from pending only after a successful authenticated invite-link or OTP session. Pending emails may be corrected and re-sent; confirmed links cannot be silently reassigned.
- Parent view: child + group progress, training schedule, upcoming matches.
- One-way trainer notes on a training (e.g. "cancelled, rain") and parent-reported absences — explicitly not a messaging channel; that's WhatsApp's job, not ours.

**Competition**
- Matches/results tracked per group — same shape as training plans, no new access model needed.

**Multi-sport, gated by entitlements**
- FREE is limited to one sport; FEDERATION includes multiple clubs and sports. COACH / TEAM and CLUB sport allowances remain a business decision. Filter groups/content by the active tenant and its entitlements, not by the old `sport_subscriptions` placeholder alone.

**Loose ends from earlier work**
- Session-control ownership indicator when two trainers are both unlocked at once (low priority — accepted tradeoff, pick up only if it's caused a real collision).
- Player promotion flow (reassigning a player to a new group next season).

### Explicitly not in this milestone

Club membership administration, payment collection/processing, in-app two-way messaging with parents. These lose to free federation tooling or already-dominant consumer tools (WhatsApp) — see positioning above. Not ruled out forever, just not where the time goes now.

---

## 1. What this project does and why

A mobile-first React app for running a youth basketball club's training sessions, built around the U8 group first. An invited trainer signs in with an email code and opens a group assigned to their account, picks or builds a training plan from the exercise library, and runs a live timer during the actual session on their phone — the same shared clock is visible/controllable from any unlocked trainer's device in that group (backed by `sports-training-api`). Exercise ratings and history are stored per-device in `localStorage`; anything shared across devices (plans, club/group info, account authorization) goes through the API.

Screens today: **Groups** (roster/plans per group), **Players** (roster + progress per player), **Library** (browse/filter/rate exercises, build a custom or full 60-minute session), **Session** (the live run-through with bilingual coaching cues), plus **Setup** (pre-session checklist/coaching principles) and **Vocabulary** ("Words" — searchable bilingual Dutch/English coaching vocabulary), and a read-only **Parent view** unlocked by the parent's confirmed email links to specific children.

**Why this exists:** the trainer needed something faster than paper/spreadsheets during an actual practice — pick exercises, see timing, rate what worked, without breaking flow mid-session. It grew from single-group U8 to a shape that could support multiple groups and (eventually) multiple sports.

---

## 2. Target users

| Role | Description |
|---|---|
| Trainer | Uses an invited email Auth account with group membership to build plans, run sessions and rate players/exercises. |
| Parent | Named Auth account with read-only access to children linked by a trainer to the confirmed email — no trainer membership, roster access or write access. |

---

## 3. Architecture

| Layer | Choice | Why |
|---|---|---|
| Framework | React 19 + TypeScript, Vite 8 | |
| Styling | Tailwind v4 (`@tailwindcss/vite`) — no component library | Small app, direct utility classes; not a `@digital-ai/dot-components` project |
| Local persistence | `localStorage` (per-device exercise ratings/history) | Shared state (plans, account authorization, club/group data) goes through `sports-training-api` via `src/lib/apiClient.ts` |
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
- [ ] #125 — New mascot animals planned after lion/shark: black panther, tiger, crocodile, dinosaur, goat. Original-size art starting to arrive under `public/images/basketball/u8 u10/<Animal>/Original size/` (panther, tiger in place as of 2026-09-23); still needs the Web-size webp conversion + jersey/eye overlay tracing per animal before any of them are wired into `JerseyGraphic.tsx`'s `FALLBACK_DYNAMIC_AVATAR`.

---

## 7. Data layer

`localStorage` for device-local state (exercise ratings/history). Everything shared across devices/trainers (plans, club/group data, account authorization, live session clock) is fetched from `sports-training-api` — see that repo's `PROJECT_KNOWLEDGE.md` for the backend architecture.

---

## Changelog

- **2026-09-26** — Authentication and account lifecycle aligned across API, UI and hosted Supabase. Trainers now have explicit new-vs-existing entry: new emails confirm ownership before atomically creating a FREE workspace, while existing/invited trainers and superadmins use generic one-click/OTP login. Parents are invite-only and go directly to login; pending parent/trainer emails are visible, correctable and re-sent, and become confirmed only after an authenticated invite-link or OTP session. Incoming link sessions override stale saved browser sessions, and changing auth mode clears stale errors. Auth templates now have separate confirmation, invite and magic-link/OTP behavior. Workspace deletion remains a data-preserving soft delete: access to the deleted club stops, the Auth identity remains, and the same authenticated identity may create a new workspace because historical memberships in deleted clubs no longer count as live access.
- **2026-09-25** — Historical first version of split signup/login, now superseded by the canonical lifecycle above. Parents no longer choose new vs existing; they are invited by a trainer and enter through parent login.

- **2026-09-22** — Historical migration phase, now superseded by the canonical auth lifecycle above: invited email accounts, club/group memberships and platform-admin TOTP replaced trainer group passcodes and anonymous private-table reads.
- **2026-09-21** — Local UI uses strict port 5174 and calls the sibling API on port 3002, avoiding other local services. Both projects require Node 22+; the API must allow the exact UI origin. The API client trims trailing slashes and sends JSON Content-Type only for requests with a body, so GET requests no longer trigger unnecessary preflights.

- **2026-09-20** — sports-training-api#26 Age-scoped pedagogical guidance is now carried with database-backed exercises and shown only on the live `ExerciseTimeline`. The UI resolves the note by the active group's stable `templateId` (not its renameable display name), labels it with the template's display label, and omits the block when no note has been authored.
- **2026-09-19** — sports-training-api#65 Parent-code reads now use `POST /players/:id/parent-code/read` with the trainer passcode in the JSON body. The old credential-bearing GET query URL was removed so browser history and URL logging cannot capture the trainer passcode; the UI action test enforces that no parent-code request URL contains `passcode=`.
- **2026-09-16** — File created; captured current scope, architecture, the a11y/interaction-state gap found in this session, and the plan to descope Setup/Vocabulary.
- **2026-09-17** — Added competitive scouting summary (§ Milestone 1); reframed positioning after review — this is a child development & progress-sharing tool for parents, not a practice planner with a parent screen attached. Per-skill progress tracking + child-scoped parent access + age-scoped psychology framing are the load-bearing differentiators for the multi-sport milestone, not sport count or zero-PII alone.
- **2026-09-20** — Added gamification/AI-coach competitor scan (§ Milestone 1): 5StarKidz, Sportlingo, and smaller stat-tracker apps are all B2C (parent pays) — none combine gamified parent-facing progress with this app's B2B2C model. Confirms individual (non-comparative) gamification over an AI-coach feature, and links the gamification badges already in progress to the future 3D mascot concept.
- **2026-09-21** — Added realistic timeline-to-profitability (§ Milestone 1): bootstrap side-project without external capital runs 3-5+ years to break-even vs. standard 2-5 year SaaS/VC benchmarks — the gap is structural (no sales budget, no founder full-time, no fast-scaling acquisition), not a sign of underperformance. Phased plan through Year 5+, with an explicit end-of-2027/2028-season checkpoint to decide continue/pivot/reassess.
- **2026-09-21** — Corrected "Proof this isn't just theory" → "Current status (honest)" (§ Milestone 1): the app is one week old, zero paying clubs, 3 trainers using it unpaid. Removes the earlier "first real club" framing, which overstated current traction against the pipeline projections elsewhere in this milestone.
