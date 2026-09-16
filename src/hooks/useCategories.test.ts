import { describe, expect, it } from 'vitest'
import { categoryInfo, type Category } from './useCategories'

const categories: Category[] = [
  { id: 'shooting', label: 'Shooting', emoji: '🎯' },
  { id: 'warmup', label: 'Warm-up & Fun', emoji: '🔥' },
]

describe('categoryInfo', () => {
  it('finds a category by id', () => {
    expect(categoryInfo(categories, 'shooting')).toEqual({ id: 'shooting', label: 'Shooting', emoji: '🎯' })
  })

  it('falls back to a sensible default for an unknown id', () => {
    expect(categoryInfo(categories, 'does-not-exist')).toEqual({
      id: 'does-not-exist',
      label: 'does-not-exist',
      emoji: '🏀',
    })
  })
})
