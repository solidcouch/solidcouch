import { Locator, Page, expect } from '@playwright/test'
import { type ConfigType } from '../../src/config/hooks'

export const generateRandomString = (length: number): string => {
  const characters =
    'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ          '
  let randomString = ''
  for (let i = 0; i < length; i++) {
    const randomChar = characters.charAt(
      Math.floor(Math.random() * characters.length),
    )
    randomString += randomChar
  }
  return randomString.replace(/\s+/g, ' ').trim()
}

export const checkAlert = async (
  page: Page,
  text: string | RegExp,
  close = true,
) => {
  const alertLocator = page.getByRole('alert').filter({ hasText: text })

  await expect(alertLocator).toBeVisible()

  if (close)
    await alertLocator
      .locator('xpath=..')
      .getByRole('button', { name: 'close' })
      .click()
}

export const updateAppConfig = async (
  page: Page,
  config: Partial<ConfigType>,
  { path = '/', locator }: { path?: string; locator?: Locator } = {},
) => {
  locator ??= page.getByRole('button', { name: 'Sign in' })
  await page.goto(path)
  await expect(locator).toBeVisible()
  await page.evaluate(`globalThis.updateAppConfig(${JSON.stringify(config)})`)
}

export const getAppConfig = async (
  page: Page,
  { path = '/', locator }: { path?: string; locator?: Locator } = {},
): Promise<ConfigType> => {
  locator ??= page.getByRole('button', { name: 'Sign in' })
  await page.goto(path)
  await expect(locator).toBeVisible()
  return await page.evaluate(`globalThis.appConfig`)
}
