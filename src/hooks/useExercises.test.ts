import { describe, expect, it } from 'vitest'
import { exercisesForGroup, findExercise, guidanceForGroup, type Exercise } from './useExercises'

const exercises: Exercise[] = [
  { id: 'shared', emoji: '🏀', title: 'Shared drill', categories: ['dribbling'], durationMinutes: 5, goal: 'g', steps: [] },
  { id: 'u8-only', emoji: '👋', title: 'U8 only', categories: ['warmup'], durationMinutes: 5, goal: 'g', steps: [], groups: ['u8'] },
  { id: 'u10-only', emoji: '🚦', title: 'U10 only', categories: ['warmup'], durationMinutes: 5, goal: 'g', steps: [], groups: ['u10'] },
]

describe('findExercise', () => {
  it('finds an exercise by id', () => {
    expect(findExercise(exercises, 'shared')?.title).toBe('Shared drill')
  })

  it('returns undefined for an unknown id', () => {
    expect(findExercise(exercises, 'does-not-exist')).toBeUndefined()
  })
})

describe('exercisesForGroup', () => {
  it('includes untagged exercises for every group', () => {
    expect(exercisesForGroup(exercises, 'u8').some((e) => e.id === 'shared')).toBe(true)
    expect(exercisesForGroup(exercises, 'u10').some((e) => e.id === 'shared')).toBe(true)
    expect(exercisesForGroup(exercises, 'u12').some((e) => e.id === 'shared')).toBe(true)
  })

  it('excludes exercises tagged for a different group', () => {
    expect(exercisesForGroup(exercises, 'u10').some((e) => e.id === 'u8-only')).toBe(false)
    expect(exercisesForGroup(exercises, 'u8').some((e) => e.id === 'u10-only')).toBe(false)
  })

  it('includes exercises tagged for the matching group', () => {
    expect(exercisesForGroup(exercises, 'u8').some((e) => e.id === 'u8-only')).toBe(true)
    expect(exercisesForGroup(exercises, 'u10').some((e) => e.id === 'u10-only')).toBe(true)
  })
})

describe('guidanceForGroup', () => {
  const sharedWithGuidance: Exercise = {
    ...exercises[0],
    guidance: [
      { groupTemplateId: 'u8', note: 'Keep instructions short.' },
      { groupTemplateId: 'u10', note: 'Ask players what they noticed.' },
    ],
  }

  it('selects only the active age-band note', () => {
    expect(guidanceForGroup(sharedWithGuidance, 'u8')).toBe('Keep instructions short.')
    expect(guidanceForGroup(sharedWithGuidance, 'u10')).toBe('Ask players what they noticed.')
  })

  it('returns no note for an age band without authored guidance', () => {
    expect(guidanceForGroup(sharedWithGuidance, 'u12')).toBeUndefined()
  })
})
