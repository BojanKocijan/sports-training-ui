import { describe, expect, it } from 'vitest'
import { parentInviteMailto } from './parentInvite'

describe('parentInviteMailto', () => {
  it('addresses the trainer and includes the parent email and app link', () => {
    const link = parentInviteMailto({ trainerEmail: 'coach@example.com', parentEmail: 'mum@example.com', appUrl: 'https://coachcub.app' })
    expect(link.startsWith('mailto:coach@example.com?subject=')).toBe(true)
    const body = decodeURIComponent(link.split('&body=')[1])
    expect(body).toContain('mum@example.com')
    expect(body).toContain('https://coachcub.app')
  })
})
