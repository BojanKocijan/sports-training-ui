import { describe, expect, it } from 'vitest'
import { parentInviteMailto, parentInviteMessage } from './parentInvite'

describe('parentInviteMessage', () => {
  it('includes the parent email and the app link', () => {
    const message = parentInviteMessage({ parentEmail: 'mum@example.com', appUrl: 'https://coachcub.app' })
    expect(message).toContain('mum@example.com')
    expect(message).toContain('https://coachcub.app')
  })
  it('still reads well without an email', () => {
    expect(parentInviteMessage({ parentEmail: '', appUrl: 'https://x.app' })).toContain('add my email to my child')
  })

  it('builds a mailto link, with or without the trainer address', () => {
    const withTo = parentInviteMailto({ trainerEmail: 'coach@example.com', parentEmail: 'mum@example.com', appUrl: 'https://x.app' })
    expect(withTo.startsWith('mailto:coach@example.com?subject=')).toBe(true)
    expect(decodeURIComponent(withTo.split('&body=')[1])).toContain('mum@example.com')
    expect(parentInviteMailto({ trainerEmail: '', parentEmail: '', appUrl: 'https://x.app' }).startsWith('mailto:?subject=')).toBe(true)
  })
})
