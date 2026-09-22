import { describe, expect, it } from 'vitest'
import { BACKDROPS, DEFAULT_BACKDROP, MASCOTS_3D } from './mascot3d'

// The config-driven toggle (PlayerPreviewCard) trusts every entry here to be well-formed --
// these are the invariants Mascot3DScene relies on without checking itself.
describe('MASCOTS_3D', () => {
  it('lists the lion and the shark', () => {
    expect(Object.keys(MASCOTS_3D).sort()).toEqual(['lion', 'shark'])
  })

  it.each(Object.entries(MASCOTS_3D))('%s has a well-formed config', (_id, config) => {
    expect(config.modelUrl).toMatch(/\.glb$/)
    expect(config.ballUrl).toMatch(/\.glb$/)
    expect(config.regionMaskUrl).toMatch(/\.png$/)
    expect(config.ballScale).toBeGreaterThan(0)
    expect(config.ballOffset).toHaveLength(3)
    expect(config.previewCamera).toHaveLength(3)
    expect(config.pocCamera).toHaveLength(3)
    // The iris tone table is a piecewise-linear map: same length, strictly increasing X, and both
    // ends anchored at 0 (a fully dark iris stays fully dark).
    expect(config.irisToneX.length).toBe(config.irisToneY.length)
    expect(config.irisToneX.length).toBeGreaterThanOrEqual(3)
    expect(config.irisToneX[0]).toBe(0)
    expect(config.irisToneY[0]).toBe(0)
    for (let i = 1; i < config.irisToneX.length; i++) {
      expect(config.irisToneX[i]).toBeGreaterThan(config.irisToneX[i - 1])
    }
  })
})

describe('BACKDROPS', () => {
  it('has a label and a class for every entry, and DEFAULT_BACKDROP points at a real one', () => {
    for (const backdrop of Object.values(BACKDROPS)) {
      expect(backdrop.label.length).toBeGreaterThan(0)
      expect(backdrop.className.length).toBeGreaterThan(0)
    }
    expect(BACKDROPS[DEFAULT_BACKDROP]).toBeDefined()
  })
})
