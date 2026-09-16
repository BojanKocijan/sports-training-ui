import { expect, test } from '@playwright/test'

const API_URL = 'https://api.e2e-mock.invalid'
const GROUP_ID = 'u8'
const PASSCODE = 'e2e-test-code'

test('unlocks a group and can switch tabs via the bottom nav', async ({ page }) => {
  // The app is gated behind a per-group passcode (see LockScreen) -- mock the API this
  // smoke test needs instead of hitting the real network (also sidesteps CORS, since
  // ALLOWED_ORIGINS on the real API only permits the production origin).
  await page.route(`${API_URL}/groups`, (route) =>
    route.fulfill({
      json: [
        {
          id: GROUP_ID,
          name: 'U8',
          club_id: 'test-club',
          template_id: GROUP_ID,
          created_at: new Date().toISOString(),
          group_templates: { label: 'U8', emoji: '🏀', status: 'available' },
        },
      ],
    }),
  )
  await page.route(`${API_URL}/auth/verify-passcode`, (route) =>
    route.fulfill({ json: { valid: true, kind: 'trainer' } }),
  )
  await page.route(`${API_URL}/plans*`, (route) => route.fulfill({ json: [] }))
  await page.route(`${API_URL}/clubs`, (route) => route.fulfill({ json: [] }))
  await page.route(`${API_URL}/sessions/*`, (route) =>
    route.fulfill({
      json: { groupId: GROUP_ID, status: 'idle', elapsedSeconds: 0, updatedAt: new Date().toISOString() },
    }),
  )

  await page.goto('/')

  // Nothing is reachable pre-unlock -- no bottom nav yet.
  await expect(page.getByRole('navigation')).not.toBeVisible()

  await page.getByPlaceholder('Code').fill(PASSCODE)
  await page.getByRole('button', { name: /unlock/i }).click()

  const nav = page.getByRole('navigation')
  await expect(nav).toBeVisible()

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
