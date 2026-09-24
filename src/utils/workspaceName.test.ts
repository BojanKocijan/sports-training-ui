import { describe, expect, it } from 'vitest'
import { suggestWorkspaceName } from './workspaceName'

describe('suggestWorkspaceName', () => {
  it('turns a dotted email into a title-cased name', () => {
    expect(suggestWorkspaceName('bojan.kocijan@digital.ai')).toBe('Bojan Kocijan Basketball')
  })
  it('drops digits and handles a single word', () => {
    expect(suggestWorkspaceName('matejic.milan83@gmail.com')).toBe('Matejic Milan Basketball')
    expect(suggestWorkspaceName('kocijan@x.com')).toBe('Kocijan Basketball')
  })
  it('falls back when the local part has no letters', () => {
    expect(suggestWorkspaceName('1234@x.com')).toBe('My Basketball Team')
  })
})
