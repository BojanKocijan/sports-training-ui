import type { Page } from '@playwright/test'

export const API_URL = 'https://api.e2e-mock.invalid'
export const GROUP_ID = 'u8'
export const EMAIL = 'trainer@example.com'
export const OTP_CODE = '123456'

const accountSession = {
  accessToken: 'e2e-access-token',
  refreshToken: 'e2e-refresh-token',
  expiresAt: 4102444800,
  user: {
    id: 'e2e-trainer',
    email: EMAIL,
    superadmin: false,
  },
  groupIds: [GROUP_ID],
  memberships: [
    {
      club_id: 'test-club',
      group_id: GROUP_ID,
      role: 'trainer',
      active: true,
    },
  ],
}

/** Mocks the minimum the app needs to sign in and render a working shell for
 * `GROUP_ID`, so an e2e test can start from `page.goto('/')` and drive real UI instead of
 * hitting the network. Extend the returned route list from the test when a screen needs more
 * data, for example `/mascots` for the create-player wizard's animal picker. */
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
          group_templates: {
            label: 'U8',
            emoji: '🏀',
            status: 'available',
          },
        },
      ],
    }),
  )

  await page.route(`${API_URL}/auth/request-code`, (route) =>
    route.fulfill({
      status: 202,
      json: {},
    }),
  )

  await page.route(`${API_URL}/auth/verify-code`, (route) =>
    route.fulfill({
      json: accountSession,
    }),
  )

  // The sign-in card now uses the sign-up endpoints for everyone (#135).
  await page.route(`${API_URL}/auth/signup/request`, (route) =>
    route.fulfill({
      status: 202,
      json: {},
    }),
  )

  await page.route(`${API_URL}/auth/signup/verify`, (route) =>
    route.fulfill({
      status: 201,
      json: accountSession,
    }),
  )

  await page.route(`${API_URL}/plans*`, (route) =>
    route.fulfill({ json: [] }),
  )

  await page.route(`${API_URL}/clubs`, (route) =>
    route.fulfill({ json: [] }),
  )

  await page.route(`${API_URL}/sessions/*`, (route) =>
    route.fulfill({
      json: {
        groupId: GROUP_ID,
        status: 'idle',
        elapsedSeconds: 0,
        updatedAt: new Date().toISOString(),
      },
    }),
  )
}

/** Signs in through the account email OTP flow on the already-loaded LockScreen,
 * leaving the application navigation visible. */
export async function login(page: Page) {
  // The header offers I'm a trainer / I'm a parent; the trainer choice opens the sign-in dialog.
  await page.getByRole('banner').getByRole('button', { name: "I'm a trainer" }).click()

  await page.getByLabel('Email').fill(EMAIL)

  await page
    .getByRole('button', { name: 'Send sign-in code', exact: true })
    .click()

  await page.getByLabel('Sign-in code').fill(OTP_CODE)

  await page
    .getByRole('button', { name: 'Sign in', exact: true })
    .click()

  await page.getByRole('navigation').waitFor()
}

/** `page.goto('/')` + account login for tests that do not care about the pre-login state. */
export async function unlock(page: Page) {
  await page.goto('/')
  await login(page)
}
