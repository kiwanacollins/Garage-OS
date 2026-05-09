import { expect, test } from '@playwright/test';

test('login and registration pages render core form fields', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();

  await page.getByRole('link', { name: 'Create an account' }).click();
  await expect(page.getByRole('heading', { name: 'Create account' })).toBeVisible();
  await expect(page.getByLabel('Name')).toBeVisible();
  await expect(page.getByLabel('Phone')).toBeVisible();
});
