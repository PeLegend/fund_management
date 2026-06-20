import { test, expect } from '@playwright/test';

test.describe('Register Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should toggle between Sign In and Register views', async ({ page }) => {
    // Starts in Sign In mode
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByLabel('Customer Code')).toBeVisible();
    await expect(page.locator('#customer_name')).not.toBeVisible();

    // Toggle to Register mode
    await page.getByRole('button', { name: 'Register here' }).click();
    await expect(page.getByRole('heading', { name: 'Register' })).toBeVisible();
    await expect(page.getByLabel('Customer Code')).toBeVisible();
    await expect(page.getByLabel('Full Name')).toBeVisible();

    // Toggle back to Sign In mode
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
    await expect(page.locator('#customer_name')).not.toBeVisible();
  });

  test('should show error when signing in with non-existent code', async ({ page }) => {
    await page.getByLabel('Customer Code').fill('C999');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Customer code not found in database. Please register first.')).toBeVisible();
  });

  test('should show error when registering with an existing code', async ({ page }) => {
    await page.getByRole('button', { name: 'Register here' }).click();
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByLabel('Full Name').fill('Duplicate Test');
    await page.getByRole('button', { name: 'Register' }).click();
    await expect(page.getByText('Customer code is already registered. Please choose another code.')).toBeVisible();
  });

  test('should register a new user successfully and log in', async ({ page }) => {
    const uniqueCode = `C${Math.floor(1000 + Math.random() * 9000)}`;
    await page.getByRole('button', { name: 'Register here' }).click();
    await page.getByLabel('Customer Code').fill(uniqueCode);
    await page.getByLabel('Full Name').fill('New Customer');
    await page.getByRole('button', { name: 'Register' }).click();

    // Successful registration logs in and redirects to home page
    await expect(page).toHaveURL('/');
    await expect(page.getByText('FundFlow').first()).toBeVisible();
  });
});
