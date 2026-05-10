import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('garageos.accessToken', 'front-desk-access-token');
    window.localStorage.setItem('garageos.refreshToken', 'front-desk-refresh-token');
  });

  await page.route('**/api/v1/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'front-desk-1',
          name: 'Front Desk',
          email: 'front@example.com',
          phone: null,
          role: 'front_desk',
        },
        accessToken: 'front-desk-access-token',
        refreshToken: 'front-desk-refresh-token',
      }),
    });
  });
});

test('front desk can add a customer and register a linked vehicle', async ({ page }) => {
  await page.goto('/front-desk');
  await expect(page.getByRole('heading', { name: 'Vehicle register and customers' })).toBeVisible();

  await page.getByRole('button', { name: 'Add customer' }).click();
  await page.getByLabel('Name').fill('Grace Tumusiime');
  await page.getByLabel('Email', { exact: true }).fill('grace@example.com');
  await page.getByLabel('Phone', { exact: true }).fill('+256 705 440 120');
  await page.getByLabel('Preferred contact').selectOption('SMS');
  await page.getByLabel('Address').fill('Bugolobi, Kampala');
  await page.getByRole('button', { name: 'Save customer' }).click();

  await expect(page.getByRole('heading', { name: 'Grace Tumusiime' })).toBeVisible();
  await page.getByRole('button', { name: 'Add vehicle' }).click();
  await page.getByLabel('Make').fill('Mazda');
  await page.getByLabel('Model').fill('CX-5');
  await page.getByLabel('Year').fill('2020');
  await page.getByLabel('Colour').fill('Red');
  await page.getByLabel('Registration plate').fill('UCA 990P');
  await page.getByLabel('Odometer').fill('34800');
  await page.getByRole('button', { name: 'Register vehicle' }).click();

  await expect(page.getByText('UCA 990P')).toBeVisible();
  await expect(page.getByText('2020 Mazda CX-5')).toBeVisible();
});
