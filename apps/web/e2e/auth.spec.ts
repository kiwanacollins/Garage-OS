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

test('login stores returned JWTs and reports API errors', async ({ page }) => {
  await page.route('**/api/v1/auth/login', async (route) => {
    const body = route.request().postDataJSON() as { email: string };
    if (body.email === 'bad@example.com') {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Invalid password' }),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'user-1',
          name: 'Alice Customer',
          email: body.email,
          phone: null,
          role: 'customer',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      }),
    });
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill('bad@example.com');
  await page.getByLabel('Password').fill('WrongPass123');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('status')).toHaveText('Invalid password');

  await page.getByLabel('Email').fill('alice@example.com');
  await page.getByLabel('Password').fill('Customer@1234');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('status')).toHaveText('Signed in');
  await expect(page.evaluate(() => window.localStorage.getItem('garageos.accessToken'))).resolves.toBe('access-token');
  await expect(page.evaluate(() => window.localStorage.getItem('garageos.refreshToken'))).resolves.toBe('refresh-token');
});

test('customer registration stores returned JWTs', async ({ page }) => {
  await page.route('**/api/v1/auth/register', async (route) => {
    const body = route.request().postDataJSON() as { email: string; name: string };
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        user: {
          id: 'user-2',
          name: body.name,
          email: body.email,
          phone: '+256700000000',
          role: 'customer',
        },
        accessToken: 'register-access-token',
        refreshToken: 'register-refresh-token',
      }),
    });
  });

  await page.goto('/register');
  await page.getByLabel('Name').fill('Alice Customer');
  await page.getByLabel('Email').fill('alice@example.com');
  await page.getByLabel('Phone').fill('+256700000000');
  await page.getByLabel('Password').fill('Customer@1234');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('status')).toHaveText('Signed in');
  await expect(page.evaluate(() => window.localStorage.getItem('garageos.accessToken'))).resolves.toBe(
    'register-access-token',
  );
});
