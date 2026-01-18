import { expect, Locator, Page, test } from '@playwright/test'
import { createPerson, signIn, signOut } from './helpers/account'
import { setupCommunity } from './helpers/community'

const checkStepAndContinue = async (page: Page, i: number) => {
  const steps: {
    url: RegExp
    text: string
    locator: Locator
  }[] = [
    {
      url: /profile\/edit$/,
      text: 'Introduce yourself',
      locator: page.getByRole('heading', { name: 'Edit profile' }),
    },
    {
      url: /host\/offers$/,
      text: 'Welcome travellers',
      locator: page.getByRole('heading', { name: 'my accommodation' }),
    },
    {
      url: /travel\/search$/,
      text: 'Find people',
      locator: page.getByRole('button', { name: 'Zoom in' }),
    },
  ]

  const step = steps[i]
  const isLast = i === 2

  if (!step) throw new Error('invalid step')

  const onboardingLocator = page.getByTestId('onboarding-panel')

  await expect(page).toHaveURL(step.url)
  await expect(onboardingLocator).toContainText(step.text)
  await expect(step.locator).toBeVisible()
  await onboardingLocator
    .getByRole('button', { name: isLast ? 'Finish' : 'Next' })
    .click()
}

const checkNoOnboarding = async (page: Page) => {
  const onboardingLocator = page.getByTestId('onboarding-panel')
  await expect(onboardingLocator).not.toBeVisible()
}

test.describe('onboarding after setup', () => {
  test('onboarding panel should show after setup', async ({ page }) => {
    const community = await setupCommunity(page)
    const person = await createPerson({
      community,
      skip: ['personalHospexDocument'],
    })

    await signIn(page, person.account)
    await page.getByTestId(`setup-step-0-continue`).click()
    await page.getByTestId(`setup-step-1-continue`).click()

    await checkStepAndContinue(page, 0)
    await checkStepAndContinue(page, 1)
    await checkStepAndContinue(page, 2)
    await checkNoOnboarding(page)
  })

  test('onboarding panel should survive page refresh', async ({ page }) => {
    const community = await setupCommunity(page)
    const person = await createPerson({
      community,
      skip: ['personalHospexDocument'],
    })

    await signIn(page, person.account)
    await page.getByTestId(`setup-step-0-continue`).click()
    await page.getByTestId(`setup-step-1-continue`).click()

    await checkStepAndContinue(page, 0)
    await page.reload()
    await checkStepAndContinue(page, 1)
    await page.reload()
    await checkStepAndContinue(page, 2)
    await checkNoOnboarding(page)
    await page.reload()
    await checkNoOnboarding(page)
  })

  test('onboarding panel should not survive sign-out', async ({ page }) => {
    const community = await setupCommunity(page)
    const person = await createPerson({
      community,
      skip: ['personalHospexDocument'],
    })

    await signIn(page, person.account)
    await page.getByTestId(`setup-step-0-continue`).click()
    await page.getByTestId(`setup-step-1-continue`).click()

    await checkStepAndContinue(page, 0)
    await checkStepAndContinue(page, 1)
    await signOut(page)
    await signIn(page, person.account)
    await expect(page.getByRole('link', { name: 'travel' })).toBeVisible()
    await checkNoOnboarding(page)
  })

  test('onboarding panel can be closed', async ({ page }) => {
    const community = await setupCommunity(page)
    const person = await createPerson({
      community,
      skip: ['personalHospexDocument'],
    })

    await signIn(page, person.account)
    await page.getByTestId(`setup-step-0-continue`).click()
    await page.getByTestId(`setup-step-1-continue`).click()

    await checkStepAndContinue(page, 0)
    await page
      .getByTestId('onboarding-panel')
      .getByRole('button', { name: 'Skip getting started' })
      .click()
    await checkNoOnboarding(page)
  })

  test('onboarding panel should not show after normal startup', async ({
    page,
  }) => {
    const community = await setupCommunity(page)
    const person = await createPerson({
      community,
    })

    await signIn(page, person.account)

    await expect(page.getByRole('link', { name: 'travel' })).toBeVisible()
    await checkNoOnboarding(page)
  })
})
