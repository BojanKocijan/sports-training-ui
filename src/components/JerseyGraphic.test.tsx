import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { MascotAvatar } from '../hooks/useMascotAvatars'
import { JerseyGraphic } from './JerseyGraphic'

let avatars: MascotAvatar[] = []

vi.mock('../hooks/useMascotAvatars', () => ({
  useMascotAvatars: () => ({ avatars, loading: false }),
}))

function imageSrcs(container: HTMLElement) {
  return Array.from(container.querySelectorAll('img')).map((img) => img.getAttribute('src'))
}

const apiRow: MascotAvatar = {
  id: 'row-1',
  mascot_id: 'shark',
  sport_id: 'basketball',
  stage: 'baby',
  jersey_color: null,
  gender: 'boy',
  image_url: 'images/api/base.webp',
  jersey_mask_url: 'images/api/jersey-{color}.svg',
  jersey_layout: { left: 0.1, top: 0.2, width: 0.3, height: 0.4 },
  eyes_mask_url: 'images/api/eyes-{color}.svg',
  eyes_layout: { left: 0.5, top: 0.6, width: 0.1, height: 0.1 },
  number_layout: null,
  logo_layout: null,
}

describe('JerseyGraphic (dynamic art)', () => {
  beforeEach(() => {
    avatars = []
  })

  it('renders the lion boy with the chosen jersey and eye colors by default', () => {
    const { container } = render(
      <JerseyGraphic color="red" eyeColor="green" number={null} nickname="Mila" />,
    )

    expect(imageSrcs(container)).toEqual([
      '/images/basketball/u8%20u10/Leon/Web%20size/leon-baby-boy.webp',
      '/images/basketball/u8%20u10/Leon/Web%20size/leon-baby-jersey-red.svg',
      '/images/basketball/u8%20u10/Leon/Web%20size/leon-baby-eyes-green.svg',
      '/images/basketball/u8%20u10/Leon/Web%20size/leon-baby-eyes-highlights.svg',
    ])
  })

  it('renders the shark girl from her own eye mask, highlights and box', () => {
    const { container } = render(
      <JerseyGraphic
        color="purple"
        eyeColor="brown"
        gender="girl"
        mascotId="shark"
        number={null}
        nickname="Nala"
      />,
    )

    expect(imageSrcs(container)).toEqual([
      '/images/basketball/u8%20u10/Shark/Web%20size/shark-baby-girl.webp',
      '/images/basketball/u8%20u10/Shark/Web%20size/shark-baby-jersey-purple.svg',
      '/images/basketball/u8%20u10/Shark/Web%20size/shark-baby-eyes-girl-brown.svg',
      '/images/basketball/u8%20u10/Shark/Web%20size/shark-baby-eyes-girl-highlights.svg',
    ])

    // The girl's eye box differs from the boy's (her eyes sit lower), so both eye layers must be
    // placed with her own box, not the boy's or the lion's.
    const eyeLayer = container.querySelectorAll('img')[2] as HTMLImageElement
    expect(eyeLayer.style.left).toBe('36.096%')
    expect(eyeLayer.style.top).toBe('24.893%')
  })

  it('places the shark boy eyes at the designer layout', () => {
    const { container } = render(
      <JerseyGraphic color="blue" mascotId="shark" number={null} nickname="Finn" />,
    )

    const eyeLayer = container.querySelectorAll('img')[2] as HTMLImageElement
    expect(eyeLayer.style.left).toBe('36.542%')
    expect(eyeLayer.style.top).toBe('23.538%')
  })

  it('falls back to the lion for a mascot with no art yet', () => {
    const { container } = render(
      <JerseyGraphic color="blue" mascotId="unicorn" number={null} nickname="Sparkle" />,
    )

    expect(imageSrcs(container)[0]).toContain('leon-baby-boy.webp')
  })

  it('draws the jersey number only when one is set', () => {
    const { container, rerender } = render(
      <JerseyGraphic color="blue" number={7} nickname="Mila" />,
    )
    expect(container.textContent).toContain('7')

    rerender(<JerseyGraphic color="blue" number={null} nickname="Mila" />)
    expect(container.textContent).not.toMatch(/\d/)
  })

  it('uses the avatar row from the API and resolves its relative URLs against the base path', () => {
    avatars = [apiRow]
    const { container } = render(
      <JerseyGraphic
        color="yellow"
        eyeColor="blue"
        mascotId="shark"
        groupId="u8"
        number={null}
        nickname="Finn"
      />,
    )

    const srcs = imageSrcs(container)
    expect(srcs[0]).toBe(`${import.meta.env.BASE_URL}images/api/base.webp`)
    expect(srcs[1]).toBe(`${import.meta.env.BASE_URL}images/api/jersey-yellow.svg`)
    expect(srcs[2]).toBe(`${import.meta.env.BASE_URL}images/api/eyes-blue.svg`)
    // A row with no highlights column (predates it) keeps its eye shine via the lion default.
    expect(srcs[3]).toBe('/images/basketball/u8%20u10/Leon/Web%20size/leon-baby-eyes-highlights.svg')
  })
})
