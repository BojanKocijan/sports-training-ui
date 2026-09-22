import type { Page } from '@playwright/test'

export const API_URL = 'https://api.e2e-mock.invalid'
export const GROUP_ID = 'u8'
export const PASSCODE = 'e2e-test-code'

/** Mocks the minimum the app needs to get past LockScreen and render a working shell for
 * `GROUP_ID`, so an e2e test can start from `page.goto('/')` and drive real UI instead of
 * hitting the network (also sidesteps CORS, since ALLOWED_ORIGINS on the real API only permits
 * the production origin). Extend the returned route list from the test when a screen needs more
 * (e.g. `/mascots` for the create-player wizard's animal picker). */
export async function mockGate(page: Page) {
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
}

/** Fills and submits GROUP_ID's passcode on the already-loaded LockScreen, leaving the bottom
 * nav visible. Split from `unlock` so a test can assert the pre-login (locked) state first. */
export async function login(page: Page) {
  await page.getByPlaceholder('Code').fill(PASSCODE)
  await page.getByRole('button', { name: /unlock/i }).click()
  await page.getByRole('navigation').waitFor()
}

/** `page.goto('/')` + `login` -- for a test that doesn't care about the pre-login state. */
export async function unlock(page: Page) {
  await page.goto('/')
  await login(page)
}
