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

  it('keeps softened-for-beginners drills out of u10', () => {
    expect(exercisesForGroup('u10').some((e) => e.id === 'shooting-stations')).toBe(false)
    expect(exercisesForGroup('u10').some((e) => e.id === 'mini-game')).toBe(false)
    expect(exercisesForGroup('u8').some((e) => e.id === 'shooting-stations')).toBe(true)
    expect(exercisesForGroup('u8').some((e) => e.id === 'mini-game')).toBe(true)
  })

  it('keeps the harder u10 drills out of u8', () => {
    const harderU10Ids = [
      'two-ball-dribbling',
      'dribble-under-pressure',
      'give-and-go-passing',
      'shooting-form-progression',
      'closeout-defense',
      'live-3v3-halfcourt',
    ]
    const forU8 = exercisesForGroup('u8')
    const forU10 = exercisesForGroup('u10')
    for (const id of harderU10Ids) {
      expect(forU8.some((e) => e.id === id)).toBe(false)
      expect(forU10.some((e) => e.id === id)).toBe(true)
    }
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
