import { test, expect } from '@playwright/test';

test.describe('Policies Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL('/');
    await page.getByRole('link', { name: 'Policies' }).click();
    await expect(page).toHaveURL('/policies');
  });

  test('should display page header with title', async ({ page }) => {
    await expect(page.getByText('Investment Catalog')).toBeVisible();
    await expect(page.getByText('Strategic')).toBeVisible();
    await expect(page.getByText('Allocations.')).toBeVisible();
  });

  test('should display all 3 seed policies', async ({ page }) => {
    await expect(page.getByText('KMASTER')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('TMBUSB')).toBeVisible();
    await expect(page.getByText('SCBDV')).toBeVisible();
  });

  test('should display policy names in cards (Thai)', async ({ page }) => {
    await expect(page.getByText('KMASTER')).toBeVisible({ timeout: 10000 });
    // Seed data uses Thai policy names
    await expect(page.locator('h3').filter({ hasText: 'นโยบายหุ้นไทย' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'นโยบายตราสารหนี้' })).toBeVisible();
    await expect(page.locator('h3').filter({ hasText: 'นโยบายหุ้นปันผล' })).toBeVisible();
  });

  test('should open policy detail drawer when clicking KMASTER card', async ({ page }) => {
    await expect(page.getByText('KMASTER')).toBeVisible({ timeout: 10000 });
    await page.locator('h3').filter({ hasText: 'นโยบายหุ้นไทย' }).click();
    await expect(page.getByText('Allocation Blueprint')).toBeVisible();
    await expect(page.getByText('Deploy Strategy')).toBeVisible();
  });

  test('should show stock allocations in KMASTER policy drawer', async ({ page }) => {
    await expect(page.getByText('KMASTER')).toBeVisible({ timeout: 10000 });
    await page.locator('h3').filter({ hasText: 'นโยบายหุ้นไทย' }).click();
    await expect(page.getByText('PTT').first()).toBeVisible();
    await expect(page.getByText('SCB').first()).toBeVisible();
    await expect(page.getByText('CPALL').first()).toBeVisible();
  });

  test('should close drawer when clicking close button', async ({ page }) => {
    await expect(page.getByText('KMASTER')).toBeVisible({ timeout: 10000 });
    await page.locator('h3').filter({ hasText: 'นโยบายหุ้นไทย' }).click();
    await expect(page.getByText('Allocation Blueprint')).toBeVisible();
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).click();
    await expect(page.getByText('Allocation Blueprint')).not.toBeVisible();
  });

  test('should navigate to portfolios when clicking Deploy Strategy', async ({ page }) => {
    await expect(page.getByText('KMASTER')).toBeVisible({ timeout: 10000 });
    await page.locator('h3').filter({ hasText: 'นโยบายหุ้นไทย' }).click();
    await page.getByText('Deploy Strategy').click();
    await expect(page).toHaveURL('/portfolios');
  });

  test('should show allocation weights for TMBUSB policy', async ({ page }) => {
    await expect(page.getByText('TMBUSB')).toBeVisible({ timeout: 10000 });
    await page.locator('h3').filter({ hasText: 'นโยบายตราสารหนี้' }).click();
    await expect(page.getByText('KBANK').first()).toBeVisible();
    await expect(page.getByText('BBL').first()).toBeVisible();
  });

  test('should show allocation weights for SCBDV policy', async ({ page }) => {
    await expect(page.getByText('SCBDV')).toBeVisible({ timeout: 10000 });
    await page.locator('h3').filter({ hasText: 'นโยบายหุ้นปันผล' }).click();
    await expect(page.getByText('ADVANC').first()).toBeVisible();
    await expect(page.getByText('TRUE').first()).toBeVisible();
    await expect(page.getByText('DTAC').first()).toBeVisible();
  });
});
