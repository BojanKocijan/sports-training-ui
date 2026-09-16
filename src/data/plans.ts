import type { CategoryId } from '../hooks/useCategories'

export interface Plan {
  id: string
  title: string
  emoji: string
  /** Exercise ids in run order. */
  exerciseIds: string[]
}

export const fullU8Session: Plan = {
  id: 'full-u8-session',
  title: 'Full U8 Session (60 min)',
  emoji: '🏀',
  exerciseIds: [
    'welcome',
    'wall-of-china',
    'mario-jump-crab-cheetah',
    'everybody-dribbles',
    'break',
    'treasure-dribbling',
    'passing-partners',
    'shooting-stations',
    'mini-game',
    'team-finish',
  ],
}

/** Quick-start focus presets: pick a couple of themes and go, no manual filtering needed. */
export const focusPresets: { title: string; emoji: string; categories: CategoryId[] }[] = [
  { title: 'Dribbling + Fun', emoji: '⛹️', categories: ['dribbling', 'warmup'] },
  { title: 'Passing + Shooting', emoji: '🎯', categories: ['passing', 'shooting'] },
  {
    title: 'Defense & Movement',
    emoji: '🛡️',
    categories: ['defense', 'agility', 'teamplay'],
  },
]
