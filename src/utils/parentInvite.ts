/** A mailto: link a parent can use to ask their child's trainer to add them (parents can't
 * create their own account). Nothing is sent by CoachCub, so it can't be abused as a mail relay. */
export function parentInviteMailto({ trainerEmail, parentEmail, appUrl }: {
  trainerEmail: string
  parentEmail: string
  appUrl: string
}): string {
  const subject = 'Please add me to CoachCub to follow my child'
  const body = [
    'Hi,',
    '',
    "I'd like to follow my child's training progress in CoachCub.",
    parentEmail
      ? `Could you add my email (${parentEmail}) to my child's profile under parent access?`
      : "Could you add my email to my child's profile under parent access?",
    `Then I can sign in at ${appUrl} with an emailed code.`,
    '',
    `Take a look at the app: ${appUrl}`,
    '',
    'Thanks!',
  ].join('\n')
  return `mailto:${encodeURIComponent(trainerEmail).replace(/%40/g, '@')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
