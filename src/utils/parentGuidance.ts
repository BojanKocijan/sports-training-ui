import type { Exercise } from '../hooks/useExercises'
import type { PlayerCategoryStat } from '../hooks/usePlayerProgress'

/** Categories whose average rating is at or below this get a "practise together" suggestion. The
 * scale is 1-3, so <= 1.5 means the ratings so far are mostly 1s. (#131: average, not latest, so
 * one off day doesn't flip a category.) */
export const PRACTICE_THRESHOLD = 1.5
export const MAX_PRACTICE_CATEGORIES = 3
export const EXERCISES_PER_CATEGORY = 2

/** Categories to practise together, lowest first. Never described to a child as a failure. */
export function practiceCategories(stats: PlayerCategoryStat[]): PlayerCategoryStat[] {
  return stats
    .filter((s) => s.count > 0 && s.average <= PRACTICE_THRESHOLD)
    .sort((a, b) => a.average - b.average)
    .slice(0, MAX_PRACTICE_CATEGORIES)
}

/** Home-practice picks for one category: real exercises (not breaks) that train it, for this age
 * group when the exercise is group-specific, shortest first as a stand-in for "easy to do at
 * home" (the library has no equipment or home-friendly flag yet). */
export function homeExercisesFor(exercises: Exercise[], categoryId: string, groupTemplateId?: string): Exercise[] {
  return exercises
    .filter((e) => !e.isBreak && e.categories.includes(categoryId))
    .filter((e) => !e.groups?.length || !groupTemplateId || e.groups.includes(groupTemplateId))
    .sort((a, b) => a.durationMinutes - b.durationMinutes)
    .slice(0, EXERCISES_PER_CATEGORY)
}

/** Encouraging things the mascot can say, from the child's real ratings. Effort and strengths
 * first; a low category is always "more time to practise this together", never a judgement (#106). */
export function mascotMessages(nickname: string, stats: PlayerCategoryStat[], labelFor: (categoryId: string) => string): string[] {
  const rated = stats.filter((s) => s.count > 0)
  if (rated.length === 0) {
    return [`Hi ${nickname}! Your skills will show up here after your first training. See you on the court! 🏀`]
  }
  const messages: string[] = []
  const best = [...rated].sort((a, b) => b.average - a.average)[0]
  if (best.average >= 2) messages.push(`🌟 ${labelFor(best.categoryId)} is going great, ${nickname}!`)
  const total = rated.reduce((sum, s) => sum + s.count, 0)
  messages.push(`💪 ${total} ${total === 1 ? 'skill' : 'skills'} rated so far. Every practice counts!`)
  const growing = [...rated].sort((a, b) => b.count - a.count)[0]
  if (growing.count >= 3) messages.push(`🚀 You keep working on ${labelFor(growing.categoryId)}. That effort is what makes you better.`)
  for (const s of practiceCategories(rated).slice(0, 2)) {
    messages.push(`💡 More time to practise ${labelFor(s.categoryId)} together this week, and it will grow fast!`)
  }
  return messages
}
