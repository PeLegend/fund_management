import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login form with customer code input', async ({ page }) => {
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.getByLabel('Customer Code')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
  });

  test('should display demo access codes C001 and C002', async ({ page }) => {
    await expect(page.getByText('Demo Access Codes')).toBeVisible();
    await expect(page.locator('span').filter({ hasText: /^C001$/ }).first()).toBeVisible();
    await expect(page.locator('span').filter({ hasText: /^C002$/ }).first()).toBeVisible();
  });

  test('should show brand name FundFlow', async ({ page }) => {
    await expect(page.getByText('FundFlow').first()).toBeVisible();
  });

  test('should show error when submitting empty code', async ({ page }) => {
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByText('Please enter a customer code')).toBeVisible();
  });

  test('should fill C001 when clicking demo chip', async ({ page }) => {
    await page.locator('span').filter({ hasText: /^C001$/ }).first().click();
    await expect(page.getByLabel('Customer Code')).toHaveValue('C001');
  });

  test('should fill C002 when clicking demo chip', async ({ page }) => {
    await page.locator('span').filter({ hasText: /^C002$/ }).first().click();
    await expect(page.getByLabel('Customer Code')).toHaveValue('C002');
  });

  test('should redirect to home after successful login with C001', async ({ page }) => {
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('FundFlow').first()).toBeVisible();
  });

  test('should redirect to home after successful login with C002', async ({ page }) => {
    await page.locator('span').filter({ hasText: /^C002$/ }).first().click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL('/');
  });

  test('should show ABSOLUTE CONTROL hero text on left panel', async ({ page }) => {
    await expect(page.getByText('ABSOLUTE')).toBeVisible();
    await expect(page.getByText('CONTROL.')).toBeVisible();
  });

  test('should show trust markers (Hidden Fees, Auto Allocation, Fintech Core)', async ({ page }) => {
    await expect(page.getByText('Hidden Fees')).toBeVisible();
    await expect(page.getByText('Auto Allocation')).toBeVisible();
    await expect(page.getByText('Fintech Core')).toBeVisible();
  });
});
