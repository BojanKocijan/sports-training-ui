/** The note a parent shares with their child's trainer (any channel: WhatsApp, SMS, email...) to
 * ask to be added, since parents can't create their own account. CoachCub sends nothing itself. */
export function parentInviteMessage({ parentEmail, appUrl }: { parentEmail: string; appUrl: string }): string {
  return [
    "Hi! I'd like to follow my child's training progress in CoachCub.",
    parentEmail
      ? `Could you add my email (${parentEmail}) to my child's profile under parent access?`
      : "Could you add my email to my child's profile under parent access?",
    `Then I can sign in at ${appUrl} with an emailed code.`,
    '',
    `Take a look at the app: ${appUrl}`,
  ].join('\n')
}

/** mailto: link for the same note; the trainer's address is optional (the parent may only know
 * it once their mail app opens). */
export function parentInviteMailto({ trainerEmail, parentEmail, appUrl }: { trainerEmail: string; parentEmail: string; appUrl: string }): string {
  const subject = 'Please add me to CoachCub to follow my child'
  const to = trainerEmail ? encodeURIComponent(trainerEmail).replace(/%40/g, '@') : ''
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(parentInviteMessage({ parentEmail, appUrl }))}`
}
