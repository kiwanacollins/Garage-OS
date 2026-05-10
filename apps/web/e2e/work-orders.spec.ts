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

test('mechanic can inspect, log labour, request parts, and submit completion', async ({ page }) => {
  await page.goto('/mechanic');
  await page.getByText('UBK 442M').click();

  await page.getByLabel('Finding').fill('Rear sway bar link has play');
  await page.getByLabel('Recommendation').fill('Replace rear sway bar links during service');
  await page.getByRole('button', { name: 'Record finding' }).click();
  await expect(page.getByText('Rear sway bar link has play')).toBeVisible();

  await page.getByRole('tab', { name: 'labour' }).click();
  await page.getByLabel('Labour task').fill('Oil service and suspension inspection');
  await page.getByLabel('Hours').fill('1.2');
  await page.getByRole('button', { name: 'Add labour entry' }).click();
  await expect(page.getByText('Oil service and suspension inspection')).toBeVisible();

  await page.getByRole('tab', { name: 'parts' }).click();
  await page.getByLabel('Part name').fill('Rear sway bar link');
  await page.getByLabel('Quantity').fill('2');
  await page.getByLabel('Urgency note').fill('Noise confirmed during inspection');
  await page.getByRole('button', { name: 'Request part' }).click();
  await expect(page.getByText('Rear sway bar link x2')).toBeVisible();
  await expect(page.getByText('Awaiting parts').first()).toBeVisible();

  await page.getByRole('tab', { name: 'complete' }).click();
  await page.getByLabel('Final notes').fill('Service complete after inspection and parts request.');
  await page.getByRole('button', { name: 'Submit for quality check' }).click();
  await expect(page.getByText('Completed').first()).toBeVisible();
  await expect(page.getByText('Service complete after inspection and parts request.')).toBeVisible();
});

test('admin can assign an unassigned work order', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Work order assignment' })).toBeVisible();
  await expect(page.getByText('No mechanic')).toBeVisible();

  await page.getByRole('textbox', { name: 'Assign mechanic' }).click();
  await page.getByRole('option', { name: 'Sarah Auma (2 active)' }).click();
  await page.getByRole('button', { name: 'Assign job card' }).click();

  await expect(page.getByRole('textbox', { name: 'Assign mechanic' })).toHaveValue('Sarah Auma (2 active)');
  await expect(page.getByText('Assigned').first()).toBeVisible();
});

test('admin can approve a pending parts request', async ({ page }) => {
  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Parts approval' })).toBeVisible();

  await page.getByLabel('Approval note').fill('Customer approved this item by phone.');
  await page.getByRole('button', { name: 'Approve' }).first().click();

  await expect(page.getByText('approved').first()).toBeVisible();
  await expect(page.getByText('Admin: Customer approved this item by phone.')).toBeVisible();
});
