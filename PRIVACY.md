# Privacy

Last updated: 2026-09-23

CoachCub (coachcub.app) helps volunteer youth-sports trainers run training sessions and share a child's progress with their parent. Here's exactly what data it stores, who processes it, and what it deliberately does not collect.

## What is stored, and where

| Data | Who provides it | Where | Personal data? |
|---|---|---|---|
| Email address | Club owners, admins, trainers, co-coaches | Supabase Auth | Yes — used only to sign in (a one-time code) and to know who made a change |
| Player profile — nickname, jersey color, eye color, gender, height, weight, mascot choice | Trainers, about a player in their group | Supabase database | Yes, but not linked to any parent/guardian contact detail |
| Per-skill training ratings | Trainers, logged after a session | Supabase database | Tied to a player record, not to any adult's identity |
| Parent access code | Generated per player, given to a parent by the trainer | Supabase database, checked server-side | The code itself isn't personal data; it unlocks a read-only view scoped to one child |
| Exercise library (drills, steps, cues) | — | Bundled in the app's code | No — static content |
| "Kids liked it?" ratings, last-picked group, setup checklist | The person using a device | `localStorage`, on that device only | No — device-local, never transmitted |

**Parents do not provide an email address today.** A parent's only credential is a one-time code from their child's trainer, which unlocks a read-only view of that child's own schedule and progress — nothing else, and no way to see other children or edit anything. **This is expected to change**: parent sign-in by email is a planned feature. If and when that ships, this document and the in-app notice will be updated first, before any parent email is collected.

## Who processes this data

| Processor | Role | Region |
|---|---|---|
| **Supabase** | Database + account authentication (Postgres, Auth) | Frankfurt, Germany (EU) |
| **Resend** | Sends sign-in-code and invitation emails, from `no-reply@coachcub.app` | — |

Neither is used for advertising, analytics, or profiling. No data is sold or shared with any other third party. No payment processing is active today (the app is FREE-tier only for now — see the tiers described in the app itself).

## Trainer, owner, and co-coach accounts

Staff sign in with their email address via a one-time sign-in code (no password is ever created or stored). An account is created only when someone with existing access (a platform admin, or a club owner/admin) invites that email address. The app knows *who* made a change, tied to that account — this replaced an earlier version of the app that used one shared, anonymous team passcode.

## Parent access

A trainer generates a code for a specific player and shares it with that child's parent directly (not sent by the app). The code unlocks a read-only view scoped to that one child: their schedule and their own progress. It cannot be used to see any other child, join a trainer account, or change anything.

## localStorage

The parts of the app that remember things on your own device (ratings drafts, your last-picked group, a setup checklist) use your browser's `localStorage`. That data:
- never leaves your device or gets sent to any server,
- is cleared if you clear your browser's site data,
- is separate for every device/browser you use the app from.

## Data residency

All shared data (accounts, player records, ratings) lives in a Supabase (Postgres) project hosted in Frankfurt, Germany — inside the EU/EEA.

## Your rights

You can ask to access, export, or delete the personal data associated with your account (or, for a parent, ask the trainer to do this on your behalf, since the app doesn't hold a parent contact detail to reach you directly). Email **support@coachcub.app**.

## If this changes

Before the app starts collecting parent email addresses, processing payments, or adding any other new category of personal data, this document will be updated first, along with a proper lawful basis and (once the app is offered commercially at scale) a data processing agreement with each processor and a lawyer-reviewed policy.
