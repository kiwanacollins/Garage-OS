import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('garageos.accessToken', 'workspace-access-token');
    window.localStorage.setItem('garageos.refreshToken', 'workspace-refresh-token');
  });

  await page.route('**/api/v1/auth/refresh', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'user-1',
          name: 'Workspace User',
          email: 'workspace@example.com',
          phone: null,
          role: 'admin',
        },
        accessToken: 'workspace-access-token',
        refreshToken: 'workspace-refresh-token',
      }),
    });
  });
});

test('mechanic can inspect job card tabs', async ({ page }) => {
  await page.goto('/mechanic');
  await expect(page.getByRole('heading', { name: 'Job cards' })).toBeVisible();
  await expect(page.getByText('UAX 123A').first()).toBeVisible();

  await page.getByRole('tab', { name: 'labour' }).click();
  await expect(page.getByText('Road test and lift inspection')).toBeVisible();

  await page.getByRole('tab', { name: 'parts' }).click();
  await expect(page.getByText('Front brake pads')).toBeVisible();
});

test('mechanic can move an assigned job into progress and complete it', async ({ page }) => {
  await page.goto('/mechanic');
  await page.getByText('UBK 442M').click();

  await page.getByRole('button', { name: 'Start work' }).click();
  await expect(page.getByText('In progress').first()).toBeVisible();

  await page.getByRole('button', { name: 'Mark complete' }).click();
  await expect(page.getByText('Completed').first()).toBeVisible();
});

test('admin can assign an unassigned work order', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Work order assignment' })).toBeVisible();
  await expect(page.getByText('No mechanic')).toBeVisible();

  await page.getByLabel('Assign mechanic').selectOption('mechanic-2');
  await page.getByRole('button', { name: 'Assign job card' }).click();

  await expect(page.getByText('Sarah Auma').first()).toBeVisible();
  await expect(page.getByText('Assigned').first()).toBeVisible();
});
