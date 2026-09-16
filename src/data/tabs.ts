// 'setup' and 'vocabulary' stay in the union so App.tsx's SetupScreen/VocabularyScreen
// imports and their (currently unreachable) render branches keep type-checking — see
// PROJECT_KNOWLEDGE.md §4 for why they're pulled from TABS instead of deleted outright.
export type Tab = 'setup' | 'groups' | 'players' | 'library' | 'session' | 'vocabulary'

export const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'groups', label: 'Planner', emoji: '👥' },
  { id: 'players', label: 'Players', emoji: '🧒' },
  { id: 'library', label: 'Library', emoji: '🏀' },
  { id: 'session', label: 'Session', emoji: '⏱️' },
]
