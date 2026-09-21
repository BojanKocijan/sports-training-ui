import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ExerciseTimeline, type TimelineEntry } from './ExerciseTimeline'

vi.mock('./CategoryBadges', () => ({ CategoryBadges: () => null }))
vi.mock('./RatingWidget', () => ({ RatingWidget: () => null }))

const currentEntry: TimelineEntry = {
  exercise: {
    id: 'shared-drill',
    emoji: '🏀',
    title: 'Shared drill',
    categories: ['dribbling'],
    durationMinutes: 5,
    goal: 'Keep control of the ball.',
    steps: ['Start slowly.'],
    guidance: [
      { groupTemplateId: 'u8', note: 'Change the challenge before attention drops.' },
      { groupTemplateId: 'u10', note: 'Ask players which constraint improved control.' },
    ],
  },
  startSec: 0,
  endSec: 300,
}

function renderTimeline(groupTemplateId: string, groupTemplateLabel: string) {
  return render(
    <ExerciseTimeline
      currentEntry={currentEntry}
      remainingLabel="4:30"
      segmentPct={10}
      groupTemplateId={groupTemplateId}
      groupTemplateLabel={groupTemplateLabel}
      onRate={() => {}}
      ratingAverage={null}
      ratingCount={0}
    />,
  )
}

describe('ExerciseTimeline pedagogical guidance', () => {
  it('shows only the note for the active age band inside the live exercise', () => {
    renderTimeline('u8', 'U8')

    expect(screen.getByLabelText('Coaching guidance for U8')).toHaveTextContent(
      'Change the challenge before attention drops.',
    )
    expect(screen.queryByText('Ask players which constraint improved control.')).not.toBeInTheDocument()
  })

  it('omits the guidance block when no note is authored for the age band', () => {
    renderTimeline('u12', 'U12')

    expect(screen.queryByLabelText('Coaching guidance for U12')).not.toBeInTheDocument()
  })
})
