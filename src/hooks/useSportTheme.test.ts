import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { useSportTheme } from './useSportTheme'

const ALL_SHADES = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900']

afterEach(() => {
  for (const shade of ALL_SHADES) document.documentElement.style.removeProperty(`--color-orange-${shade}`)
})

describe('useSportTheme', () => {
  it('leaves the default orange scale untouched for basketball\'s own accent', () => {
    renderHook(() => useSportTheme('#f97316'))
    for (const shade of ALL_SHADES) {
      expect(document.documentElement.style.getPropertyValue(`--color-orange-${shade}`)).toBe('')
    }
  })

  it('leaves the default orange scale untouched when no accent color is known yet', () => {
    renderHook(() => useSportTheme(undefined))
    for (const shade of ALL_SHADES) {
      expect(document.documentElement.style.getPropertyValue(`--color-orange-${shade}`)).toBe('')
    }
  })

  it('overrides every orange shade for a different sport\'s accent', () => {
    renderHook(() => useSportTheme('#16a34a'))
    expect(document.documentElement.style.getPropertyValue('--color-orange-500')).toBe('#16a34a')
    for (const shade of ALL_SHADES.filter((s) => s !== '500')) {
      expect(document.documentElement.style.getPropertyValue(`--color-orange-${shade}`)).toContain('#16a34a')
    }
  })

  it('clears the override on unmount', () => {
    const { unmount } = renderHook(() => useSportTheme('#16a34a'))
    unmount()
    for (const shade of ALL_SHADES) {
      expect(document.documentElement.style.getPropertyValue(`--color-orange-${shade}`)).toBe('')
    }
  })
})
