import { expect, test } from '@playwright/test'
import { API_URL, GROUP_ID, mockGate, unlock } from './support/mockApi'

/** Screenshots the 3D mascot preview inside the edit-player form (not the hidden /poc-3d.html
 * dev page), for each mascot that has a 3D model — so a layout/camera/framing regression has a
 * picture, not just a description, to attach to its issue. The create-player flow
 * (SpotlightPlayerEditor, #106) doesn't expose the still/3D toggle -- it's 2D-only there, see
 * PlayerPreviewCard's `hideMeta` prop and #117 -- so this drives an existing mock player into
 * EditPlayerForm, which still renders the toggle. Saved under test-results/ (gitignored) via
 * `testInfo.outputPath` so `npx playwright test mascot-3d` prints exactly where to find it. Not
 * a golden-image diff (three.js output is not pixel-stable across GPUs/drivers), so this only
 * asserts the canvas rendered — read the screenshot yourself. */
test.describe('3D mascot preview', () => {
  test.beforeEach(async ({ page }) => {
    await mockGate(page)
    await page.route(`${API_URL}/mascots`, (route) =>
      route.fulfill({
        json: [
          { id: 'lion', name: 'Lion', sort_order: 1 },
          { id: 'shark', name: 'Shark', sort_order: 2 },
        ],
      }),
    )
    await page.route(`${API_URL}/mascots/avatars*`, (route) => route.fulfill({ json: [] }))
    await page.route(`${API_URL}/categories*`, (route) => route.fulfill({ json: [] }))
    await page.route(`${API_URL}/skill-categories*`, (route) => route.fulfill({ json: [] }))
    await page.route(`${API_URL}/players/*/progress`, (route) => route.fulfill({ json: [] }))
  })

  for (const mascot of ['lion', 'shark'] as const) {
    test(`${mascot}: 3D toggle renders and can be screenshotted`, async ({ page }, testInfo) => {
      await page.route(`${API_URL}/players?groupId=${GROUP_ID}`, (route) =>
        route.fulfill({
          json: [
            {
              id: 'test-player',
              group_id: GROUP_ID,
              nickname: 'Test Player',
              jersey_number: 7,
              jersey_color: 'orange',
              eye_color: 'blue',
              gender: 'boy',
              height_cm: null,
              weight_kg: null,
              mascot_id: mascot,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
          ],
        }),
      )

      await unlock(page)
      await page.getByRole('button', { name: /players/i }).click()
      await page.getByRole('button', { name: /view test player.?s details/i }).click()
      await page.getByRole('button', { name: 'Edit' }).click()

      await page.getByRole('button', { name: '3D model' }).click()

      const canvas = page.locator('[data-testid="mascot-3d"] canvas')
      await expect(canvas).toBeVisible()
      // The loading label (Mascot3DPreview) disappears once the model/ball/mask have decoded and
      // the first frame is drawn -- wait for it instead of a fixed delay.
      await expect(page.getByText('Loading 3D model')).not.toBeVisible({ timeout: 15_000 })
      await page.waitForTimeout(1000) // let a compositor frame actually paint before screenshotting

      const path = testInfo.outputPath(`${mascot}-3d-preview.png`)
      await page.locator('[data-testid="mascot-3d"]').screenshot({ path })
      await testInfo.attach(`${mascot}-3d-preview`, { path, contentType: 'image/png' })
      console.log(`Screenshot saved: ${path}`)
    })
  }
})
