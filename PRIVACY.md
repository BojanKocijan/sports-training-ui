# Privacy

Last updated: 2026-09-24

CoachCub (coachcub.app) helps volunteer youth-sports trainers run training sessions and share a child's progress with their parent. Here's exactly what data it stores, who processes it, and what it deliberately does not collect.

## What is stored, and where

| Data | Who provides it | Where | Personal data? |
|---|---|---|---|
| Email address | Club owners, admins, trainers, co-coaches | Supabase Auth | Yes — used only to sign in (a one-time code) and to know who made a change |
| Player profile — nickname, jersey color, eye color, gender, height, weight, mascot choice | Trainers, about a player in their group | Supabase database | Yes, but not linked to any parent/guardian contact detail |
| Per-skill training ratings | Trainers, logged after a session | Supabase database | Tied to a player record, not to any adult's identity |
| Parent email address | Trainers, when they link a parent to a child (the parent then confirms it) | Supabase database and Supabase Auth | Yes — used only to send the invitation and sign-in codes, and to show that parent their own child's progress |
| Exercise library (drills, steps, cues) | — | Bundled in the app's code | No — static content |
| "Kids liked it?" ratings, last-picked group, setup checklist | The person using a device | `localStorage`, on that device only | No — device-local, never transmitted |

**Parents now sign in with an email address.** A trainer enters a parent's email on their child's profile; the parent gets an invitation email, confirms it, and then signs in with a one-time code. That unlocks a read-only view of that child's own schedule and progress, and nothing else. The earlier one-time parent codes have been retired. This document was updated after parent email sign-in shipped, not before as we had said it would be; it is corrected here.

## Who processes this data

| Processor | Role | Region |
|---|---|---|
| **Supabase** | Database + account authentication (Postgres, Auth) | Frankfurt, Germany (EU) |
| **Resend** | Sends sign-in-code and invitation emails, from `no-reply@coachcub.app` | — |

Neither is used for advertising, analytics, or profiling. No data is sold or shared with any other third party. No payment processing is active today (the app is FREE-tier only for now — see the tiers described in the app itself).

## Trainer, owner, and co-coach accounts

Staff sign in with their email address via a one-time sign-in code (no password is ever created or stored). An account is created only when someone with existing access (a platform admin, or a club owner/admin) invites that email address. The app knows *who* made a change, tied to that account — this replaced an earlier version of the app that used one shared, anonymous team passcode.

## Parent access

A trainer links a parent's email address to a specific player. The parent must confirm the email (via the invitation) and sign in with a one-time code sent to it. Access is read-only and scoped to the children linked to that email: their schedule and their own progress. It cannot be used to see any other child, join a trainer account, or change anything. A trainer can unlink a parent at any time, which ends that access. Trainers and platform admins can see which parent emails are linked to which child.

## Artwork

The mascots and the landing-page video are AI-generated, guided by the experience of an illustrator and a 3D artist.

## localStorage

The parts of the app that remember things on your own device (ratings drafts, your last-picked group, a setup checklist) use your browser's `localStorage`. That data:
- never leaves your device or gets sent to any server,
- is cleared if you clear your browser's site data,
- is separate for every device/browser you use the app from.

## Data residency

All shared data (accounts, player records, ratings) lives in a Supabase (Postgres) project hosted in Frankfurt, Germany — inside the EU/EEA.

## Your rights

You can ask to access, export, or delete the personal data associated with your account (for a parent, that includes the email address linked to your child; your trainer can also unlink it). Email **support@coachcub.app**.

## If this changes

Before the app starts processing payments, or adding any other new category of personal data, this document will be updated first, along with a proper lawful basis and (once the app is offered commercially at scale) a data processing agreement with each processor and a lawyer-reviewed policy.
