import { useEffect } from 'react'

/** Basketball's accent, and the app's built-in default — exactly Tailwind's own orange-500 hex. */
const DEFAULT_ACCENT = '#f97316'

/** shade -> [percent of the accent color, mixed toward] approximating a 10-stop Tailwind-style
 * scale from a single brand color. Not pixel-matched to any real designed palette — good enough
 * until sports-training-ui#220's icon/mascot theming lands with real per-sport art direction. */
const RAMP: [shade: number, percentAccent: number, mixToward: 'white' | 'black'][] = [
  [50, 4, 'white'],
  [100, 10, 'white'],
  [200, 22, 'white'],
  [300, 38, 'white'],
  [400, 65, 'white'],
  [600, 88, 'black'],
  [700, 72, 'black'],
  [800, 56, 'black'],
  [900, 42, 'black'],
]

/**
 * Recolors the app to the active group's sport (sports-training-ui#220) by overriding Tailwind's
 * own `--color-orange-*` scale — every existing `orange-500`, `bg-orange-50`, etc. utility class
 * across the app follows automatically, with no per-component changes needed. Same trick
 * index.css already uses to re-point `--color-neutral-*` for dark mode.
 *
 * Basketball's accent is exactly Tailwind's real orange-500, so its shades are left as Tailwind's
 * own (removing any override) rather than regenerated through the approximate ramp above —
 * today's look stays pixel-identical.
 */
export function useSportTheme(accentColor: string | undefined) {
  useEffect(() => {
    const root = document.documentElement
    const properties = ['500', ...RAMP.map(([shade]) => String(shade))].map((shade) => `--color-orange-${shade}`)

    if (!accentColor || accentColor === DEFAULT_ACCENT) {
      for (const property of properties) root.style.removeProperty(property)
      return
    }

    root.style.setProperty('--color-orange-500', accentColor)
    for (const [shade, percent, mixToward] of RAMP) {
      root.style.setProperty(`--color-orange-${shade}`, `color-mix(in oklch, ${accentColor} ${percent}%, ${mixToward})`)
    }

    return () => {
      for (const property of properties) root.style.removeProperty(property)
    }
  }, [accentColor])
}
