/** Short in-app privacy notice — kept in sync with PRIVACY.md's fuller version and with what
 * the app actually does (see that file's own doc comment for the update discipline). Real
 * clubs and real accounts exist now, so this can no longer say "test app, no real data." */
export const PRIVACY_NOTICE_PARAGRAPHS: string[] = [
  'Coaches, club owners, and other staff sign in with their email address. We use it only to send a sign-in code or an invitation, and to know who made a change — we never sell it or use it for marketing.',
  "Parents don't provide an email today — a trainer gives them a one-time code that unlocks a read-only view of their own child's schedule and progress, nothing more. We plan to also support signing in parents by email in the future; this notice will be updated first if that changes what we collect from parents.",
  'Player data entered by trainers — nickname, jersey/eye color, gender, height, weight, mascot choice, and per-skill ratings — is stored to run the app\'s core features: training sessions, progress tracking, and the parent view.',
  'All of this is stored in a Supabase database (EU, Frankfurt). Sign-in and invitation emails are sent via Resend from coachcub.app. Neither is used for advertising or analytics, and no data is sold to third parties.',
  'Questions, or a request to access, export, or delete your data? Email support@coachcub.app.',
]
