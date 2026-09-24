import { describe, expect, it } from 'vitest'
import type { Exercise } from '../hooks/useExercises'
import type { PlayerCategoryStat } from '../hooks/usePlayerProgress'
import { homeExercisesFor, mascotMessages, practiceCategories, rollUpToTopLevel } from './parentGuidance'

const stat = (categoryId: string, average: number, count = 3): PlayerCategoryStat => ({ categoryId, average, count, lastRatedAt: '2026-09-20' })
const ex = (id: string, categories: string[], durationMinutes: number, extra: Partial<Exercise> = {}): Exercise =>
  ({ id, emoji: '🏀', title: id, categories, durationMinutes, goal: 'g', steps: [], ...extra })

describe('practiceCategories', () => {
  it('picks categories averaging 1.5 or lower, lowest first, at most three', () => {
    const result = practiceCategories([stat('a', 1.2), stat('b', 2.8), stat('c', 1.0), stat('d', 1.5), stat('e', 1.4), stat('f', 1.1)])
    expect(result.map((s) => s.categoryId)).toEqual(['c', 'f', 'a'])
  })
})

describe('homeExercisesFor', () => {
  it('returns non-break exercises for the category, shortest first, two at most, respecting group', () => {
    const list = [ex('long', ['dribbling'], 15), ex('short', ['dribbling'], 5), ex('break', ['dribbling'], 1, { isBreak: true }),
      ex('mid', ['dribbling'], 8), ex('u10only', ['dribbling'], 2, { groups: ['u10'] }), ex('other', ['shooting'], 3)]
    expect(homeExercisesFor(list, 'dribbling', 'u8').map((e) => e.id)).toEqual(['short', 'mid'])
    expect(homeExercisesFor(list, 'dribbling', 'u10').map((e) => e.id)).toEqual(['u10only', 'short'])
  })
})

describe('mascotMessages', () => {
  const label = (id: string) => id.toUpperCase()
  it('greets a child with no ratings yet', () => {
    expect(mascotMessages('Milo', [], label)[0]).toMatch(/Hi Milo/)
  })
  it('praises a strength, counts effort and frames a low category as practising together', () => {
    const messages = mascotMessages('Milo', [stat('dribbling', 2.6, 5), stat('defense', 1.2, 4)], label)
    expect(messages.join('|')).toContain('DRIBBLING is going great')
    expect(messages.join('|')).toContain('9 skills rated')
    expect(messages.join('|')).toContain('More time to practise DEFENSE together')
    expect(messages.join('|').toLowerCase()).not.toMatch(/fail|bad|weak|sad/)
  })
})

describe('rollUpToTopLevel', () => {
  it('merges sub-skills into their top-level category with a count-weighted average', () => {
    const parentOf = (id: string) => (id.startsWith('dribbling_') ? 'dribbling' : null)
    const result = rollUpToTopLevel([stat('dribbling', 2, 1), stat('dribbling_strong', 1, 3), stat('passing', 3, 2)], parentOf)
    expect(result.find((r) => r.categoryId === 'dribbling')).toMatchObject({ count: 4, average: 1.25 })
    expect(result.find((r) => r.categoryId === 'passing')).toMatchObject({ count: 2, average: 3 })
  })
})
