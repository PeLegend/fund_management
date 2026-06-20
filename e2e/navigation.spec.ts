import { test, expect } from '@playwright/test';

test.describe('Navigation & Auth Guard', () => {
  test('should redirect to /login when not authenticated', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/login');
  });

  test('should redirect /policies to /login when not authenticated', async ({ page }) => {
    await page.goto('/policies');
    await expect(page).toHaveURL('/login');
  });

  test('should redirect /portfolios to /login when not authenticated', async ({ page }) => {
    await page.goto('/portfolios');
    await expect(page).toHaveURL('/login');
  });

  test('should redirect /orders to /login when not authenticated', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL('/login');
  });

  test('should show navbar with nav links after login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL('/');

    await expect(page.getByRole('link', { name: 'Policies' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Portfolios' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Orders' })).toBeVisible();
  });

  test('should show customer code in navbar after login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('C001')).toBeVisible();
  });

  test('should navigate to policies page via nav link', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('link', { name: 'Policies' }).click();
    await expect(page).toHaveURL('/policies');
  });

  test('should navigate to portfolios page via nav link', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('link', { name: 'Portfolios' }).click();
    await expect(page).toHaveURL('/portfolios');
  });

  test('should navigate to orders page via nav link', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page).toHaveURL('/orders');
  });

  test('should logout and redirect to login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL('/');

    // Logout button: nav bar last icon button (LogOut icon)
    const logoutBtn = page.locator('nav button').last();
    await logoutBtn.click();
    await expect(page).toHaveURL('/login');
  });

  test('should show home page hero with CTA buttons', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL('/');

    // Hero text is on two lines: "ABSOLUTE" then "CONTROL."
    await expect(page.getByText('ABSOLUTE')).toBeVisible();
    await expect(page.getByText('CONTROL.')).toBeVisible();
    // CTA buttons (rendered as <button>, not <a>)
    await expect(page.getByRole('button', { name: /Discover Policies/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Access Portfolio/i })).toBeVisible();
  });

  test('should navigate to policies from home CTA', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: /Discover Policies/i }).click();
    await expect(page).toHaveURL('/policies');
  });

  test('should navigate to portfolios from home CTA', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('button', { name: /Access Portfolio/i }).click();
    await expect(page).toHaveURL('/portfolios');
  });
});
