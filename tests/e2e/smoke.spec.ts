import { expect, test } from '@playwright/test'
import { login, mockGate } from './support/mockApi'

test('unlocks a group and can switch tabs via the bottom nav', async ({ page }) => {
  await mockGate(page)

  await page.goto('/')

  // Nothing is reachable pre-unlock -- no bottom nav yet.
  await expect(page.getByRole('navigation')).not.toBeVisible()

  await login(page)
  const nav = page.getByRole('navigation')

  await page.getByRole('button', { name: /library/i }).click()
  await expect(page.getByRole('button', { name: /library/i })).toBeVisible()

  await page.getByRole('button', { name: /planner/i }).click()
  await expect(page.getByRole('button', { name: /planner/i })).toBeVisible()

  // Desktop (>=1024px, see playwright.config.ts's 'desktop' project) gets a left side rail
  // instead of the phone/tablet bottom tab bar (see SideNav vs BottomNav) -- confirm whichever
  // one is actually rendered sits where it should, not just that *a* nav exists.
  const viewport = page.viewportSize()
  const box = await nav.boundingBox()
  if (!viewport || !box) throw new Error('Expected a viewport and a visible nav bounding box')

  if (viewport.width >= 1024) {
    expect(box.x).toBeLessThan(50) // pinned to the left edge
  } else {
    expect(viewport.height - (box.y + box.height)).toBeLessThan(50) // pinned to the bottom edge
  }
})
