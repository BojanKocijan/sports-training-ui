import { describe, expect, it } from 'vitest'
import type { ApiGroup } from '../hooks/useGroups'
import type { LinkedChild } from '../lib/accountSession'
import { childOptions } from './childOptions'

const group = (id: string, templateLabel: string, sportName?: string): ApiGroup =>
  ({ id, templateId: id, templateLabel, name: templateLabel, emoji: '🏀', status: 'available', sportName, sportEmoji: sportName === 'Swimming' ? '🏊' : '🏀' })
const child = (id: string, nickname: string, group_id: string): LinkedChild =>
  ({ id, nickname, group_id, jersey_number: null, jersey_color: null, eye_color: null, gender: null, mascot_id: null })

describe('childOptions', () => {
  it('labels each child with its sport and age group so the same child in two sports is distinguishable', () => {
    const options = childOptions(
      [child('a', 'Milo', 'swim-u8'), child('b', 'Milo', 'bb-u8')],
      [group('bb-u8', 'U8', 'Basketball'), group('swim-u8', 'U8', 'Swimming')],
    )
    expect(options.map((o) => o.label)).toEqual(['Milo · 🏀 Basketball U8', 'Milo · 🏊 Swimming U8'])
  })
  it('falls back to the name when the group is unknown', () => {
    expect(childOptions([child('a', 'Milo', 'gone')], [])).toEqual([{ id: 'a', label: 'Milo' }])
  })
})
