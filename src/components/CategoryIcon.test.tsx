import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CategoryIcon } from './CategoryIcon'

describe('CategoryIcon', () => {
  it('draws an icon for a known skill category', () => {
    const { container } = render(<CategoryIcon id="dribbling" fallback="⛹️" />)
    expect(container.querySelector('svg')).not.toBeNull()
    expect(container).not.toHaveTextContent('⛹️')
  })

  it('uses the parent category icon for a sub-skill', () => {
    const { container } = render(<CategoryIcon id="dribbling_weak_hand" fallback="🤚" />)
    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('keeps the emoji for a category it has no icon for', () => {
    const { container } = render(<CategoryIcon id="brand_new_skill" fallback="🧠" />)
    expect(container.querySelector('svg')).toBeNull()
    expect(container).toHaveTextContent('🧠')
  })
})
