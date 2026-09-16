import { describe, expect, it } from 'vitest'
import { exercises, exercisesForGroup, exercisesForSport, findExercise } from './exercises'
import { DEFAULT_SPORT_ID } from './sports'

describe('exercisesForSport', () => {
  it('returns the default sport library, matching exercises', () => {
    expect(exercisesForSport(DEFAULT_SPORT_ID)).toEqual(exercises)
  })

  it('returns an empty array for a sport with no content yet', () => {
    expect(exercisesForSport('korfball')).toEqual([])
  })
})

describe('exercisesForGroup', () => {
  it('includes untagged exercises for every group', () => {
    const forU8 = exercisesForGroup('u8')
    const forU12 = exercisesForGroup('u12')
    expect(forU8.some((e) => e.id === 'passing-partners')).toBe(true)
    expect(forU12.some((e) => e.id === 'passing-partners')).toBe(true)
  })

  it('keeps u8-only childish warm-ups out of u10', () => {
    expect(exercisesForGroup('u10').some((e) => e.id === 'wall-of-china')).toBe(false)
    expect(exercisesForGroup('u8').some((e) => e.id === 'wall-of-china')).toBe(true)
  })

  it('keeps u10-only warm-ups out of u8', () => {
    expect(exercisesForGroup('u8').some((e) => e.id === 'reaction-sprint')).toBe(false)
    expect(exercisesForGroup('u10').some((e) => e.id === 'reaction-sprint')).toBe(true)
  })
})

describe('findExercise', () => {
  it('finds an exercise by id', () => {
    expect(findExercise('welcome')?.title).toBe('Welcome circle')
  })

  it('returns undefined for an unknown id', () => {
    expect(findExercise('does-not-exist')).toBeUndefined()
  })
})
