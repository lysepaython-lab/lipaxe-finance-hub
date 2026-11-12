import { expect, test } from '@playwright/test';

test('login requires the email OTP and reaches the authenticated app', async ({ page }) => {
  test.setTimeout(90_000);
  const browserErrors: string[] = [];
  const networkFailures: string[] = [];
  page.on('pageerror', (error) => browserErrors.push(error.message));
  page.on('requestfailed', (request) => networkFailures.push(`${request.method()} ${request.url()}`));
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });

  await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

  await page.getByLabel('Email address').fill('e2e-user@example.test');
  await page.getByRole('textbox', { name: 'Password' }).fill('SafeTestPassword123!');
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page.getByRole('heading', { name: 'Confirm your sign-in' })).toBeVisible();
  await expect(page.getByText('Enter the 6-digit code sent to e•••@example.test. It expires in 10 minutes.')).toBeVisible();

  const otp = page.locator('input[autocomplete="one-time-code"]');
  await expect(otp).toBeVisible();
  await otp.click();
  await otp.pressSequentially('000000');
  await page.getByRole('button', { name: /verify and continue/i }).click();
  await expect(page.getByRole('heading', { name: 'Confirm your sign-in' })).toBeVisible();

  await otp.click();
  await otp.pressSequentially('123456');
  await page.getByRole('button', { name: /verify and continue/i }).click();
  await expect(page).toHaveURL(/\/app(?:\/|$)/);
  await expect(page.locator('body')).not.toContainText(/internal server error/i);
  expect(browserErrors).toEqual([]);
  expect(networkFailures).toEqual([]);
});
