import { describe, expect, it } from 'vitest'
import { EYE_COLORS, JERSEY_COLORS } from '../hooks/usePlayers'
import { EYE_TINTS, JERSEY_TINTS, MASCOTS_3D, get3dConfig } from './mascot3d'

describe('get3dConfig', () => {
  it('returns the lion for any gender, including none', () => {
    expect(get3dConfig('lion')).toBe(MASCOTS_3D.lion)
    expect(get3dConfig('lion', 'boy')).toBe(MASCOTS_3D.lion)
    expect(get3dConfig('lion', 'girl')).toBe(MASCOTS_3D.lion)
  })

  it('returns the shark for a boy or an unspecified gender, but not a girl', () => {
    expect(get3dConfig('shark', 'boy')).toBe(MASCOTS_3D.shark)
    expect(get3dConfig('shark')).toBe(MASCOTS_3D.shark)
    expect(get3dConfig('shark', null)).toBe(MASCOTS_3D.shark)
    expect(get3dConfig('shark', 'girl')).toBeNull()
  })

  it('returns null for a mascot without a 3D model', () => {
    expect(get3dConfig('dolphin')).toBeNull()
  })
})

describe('MASCOTS_3D', () => {
  it.each(Object.entries(MASCOTS_3D))('%s has a usable iris tone table', (_id, config) => {
    const { x, y } = config.irisTone
    expect(x.length).toBe(y.length)
    expect(x.length).toBeGreaterThanOrEqual(2)
    // the shader interpolates between neighbours, so x must be strictly increasing
    x.slice(1).forEach((value, i) => expect(value).toBeGreaterThan(x[i]))
    expect(x[0]).toBe(0)
  })

  it.each(Object.entries(MASCOTS_3D))('%s has all its asset urls', (_id, config) => {
    expect(config.modelUrl).toMatch(/\.glb$/)
    expect(config.ballUrl).toMatch(/\.glb$/)
    expect(config.regionMaskUrl).toMatch(/\.png$/)
  })

  it('has a tint for every jersey and eye colour', () => {
    JERSEY_COLORS.forEach((color) => expect(JERSEY_TINTS[color]).toMatch(/^#[0-9a-f]{6}$/i))
    EYE_COLORS.forEach((color) => expect(EYE_TINTS[color]).toMatch(/^#[0-9a-f]{6}$/i))
  })
})
