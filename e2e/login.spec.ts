import { expect, test } from '@playwright/test'
import {
  type Account,
  createRandomAccount,
  Person,
  signIn,
  signOut,
} from './helpers/account'
import { stubDirectMailer } from './helpers/mailer'

test.describe('Sign in to the app', () => {
  let user: Account

  test.beforeEach(async () => {
    user = await createRandomAccount()
  })

  // stub mailer
  test.beforeEach(async ({ page }) => {
    await stubDirectMailer(page, { person: { account: user } as Person })
  })

  test('sign in with identity provider', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Sign in' }).click()

    const issuerInput = page.getByTestId('webid-idp-input')
    await issuerInput.fill(user.oidcIssuer)
    await issuerInput.press('Enter')

    await page.getByRole('textbox', { name: 'email' }).fill(user.email)
    await page.getByRole('textbox', { name: 'password' }).fill(user.password)
    await page.getByRole('textbox', { name: 'password' }).press('Enter')

    await expect(page.getByText(user.webId)).toBeVisible()
    await page.getByRole('button', { name: 'Authorize' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByText('Prepare Pod')).toBeVisible()
  })

  test('sign in with webId', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Sign in' }).click()

    const issuerInput = page.getByTestId('webid-idp-input')
    await issuerInput.fill(user.webId)
    await issuerInput.press('Enter')

    await page.getByRole('textbox', { name: 'email' }).fill(user.email)
    await page.getByRole('textbox', { name: 'password' }).fill(user.password)
    await page.getByRole('textbox', { name: 'password' }).press('Enter')

    await expect(page.getByText(user.webId)).toBeVisible()
    await page.getByRole('button', { name: 'Authorize' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByText('Prepare Pod')).toBeVisible()
  })

  test('use provided clientId for sign-in', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Sign in' }).click()

    const issuerInput = page.getByTestId('webid-idp-input')
    await issuerInput.fill(user.oidcIssuer)
    await issuerInput.press('Enter')

    await page.getByRole('textbox', { name: 'email' }).fill(user.email)
    await page.getByRole('textbox', { name: 'password' }).fill(user.password)
    await page.getByRole('textbox', { name: 'password' }).press('Enter')

    // check that clientid.jsonld is used as ID
    await expect(page.locator('#client')).toContainText('clientid.jsonld')
    await page.getByRole('button', { name: 'Authorize' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByText('Prepare Pod')).toBeVisible()
  })

  test('remember last identity provider selected during login', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByTestId('webid-idp-input')).toHaveValue('')

    await signIn(page, user)
    await expect(page.getByText('Prepare Pod')).toBeVisible()
    await signOut(page)

    await page.goto('/')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await expect(page.getByTestId('webid-idp-input')).toHaveValue(
      user.oidcIssuer,
    )
    // await expect(
    //   page.getByTestId('selected-pod-provider').first(),
    // ).toContainText(user.oidcIssuer.slice(7, -1))
  })

  test('remember last identity provider selected during signup', async ({
    page,
  }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.getByText("Don't have a Solid Pod yet?").click()
    const register = page.getByRole('link', { name: 'solidcommunity.net' })
    register.evaluateAll(elements => {
      for (const el of elements) {
        el.removeAttribute('target')
        el.removeAttribute('rel')
        el.removeAttribute('href')
      }
    })
    await register.click()
    await expect(page).toHaveURL('/')

    await page
      .getByRole('dialog')
      .filter({ hasText: 'Choose a Pod provider' })
      .press('Escape')
    await expect(page.getByTestId('webid-idp-input')).toHaveValue(
      'https://solidcommunity.net/',
    )
    await expect(
      page.getByTestId('selected-pod-provider').first(),
    ).toContainText('solidcommunity.net')
  })

  test('return to previous URL after login', async ({ page }) => {
    await page.goto('/profile/edit?a=b&c=d#ef')
    await page.getByRole('button', { name: 'Sign in' }).click()

    const issuerInput = page.getByTestId('webid-idp-input')
    await issuerInput.fill(user.oidcIssuer)
    await issuerInput.press('Enter')

    await page.getByRole('textbox', { name: 'email' }).fill(user.email)
    await page.getByRole('textbox', { name: 'password' }).fill(user.password)
    await page.getByRole('textbox', { name: 'password' }).press('Enter')

    await expect(page.getByText(user.webId)).toBeVisible()
    await page.getByRole('button', { name: 'Authorize' }).click()

    await expect(page).toHaveURL('/profile/edit?a=b&c=d#ef')
  })

  test('return to previous URL after page reload', async ({ page }) => {
    await signIn(page, user)
    await page.goto('/profile/edit?a=b&c=d#ef')
    await expect(page.getByText('Prepare Pod')).toBeVisible()
    await expect(page).toHaveURL('/profile/edit?a=b&c=d#ef')
    await page.reload()
    await expect(page).toHaveURL(url => url.searchParams.has('code'))
    await expect(page).toHaveURL('/profile/edit?a=b&c=d#ef')
  })
})
