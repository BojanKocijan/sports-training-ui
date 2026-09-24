/** Trainer-facing skill grade (how good is this player at X). Deliberately NOT the 😐/🙂/🤩 mood
 * scale, which is reserved for the exercise-level "Kids liked it?" enjoyment rating (#149).
 * The wording is trainer-only: anything shown to a child or parent must render the 1-3 value as
 * a neutral visual (stars/dots), never these labels. */
export const SKILL_GRADES = [
  { value: 1, label: 'Needs more training' },
  { value: 2, label: 'Good' },
  { value: 3, label: 'Excellent' },
] as const

export const SKILL_GRADE_LEGEND = SKILL_GRADES.map((g) => `${g.value} ${g.label}`).join(' · ')
