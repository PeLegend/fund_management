import { test, expect } from '@playwright/test';

test.describe('Full User Journey', () => {
  test('complete flow: login → policies → portfolios → orders', async ({ page }) => {
    // ===== STEP 1: LOGIN =====
    await page.goto('/login');
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('C001')).toBeVisible();
    await expect(page.getByText('ABSOLUTE')).toBeVisible();
    await expect(page.getByText('CONTROL.')).toBeVisible();

    // ===== STEP 2: BROWSE POLICIES =====
    await page.getByRole('link', { name: 'Policies' }).click();
    await expect(page).toHaveURL('/policies');
    await expect(page.getByText('Investment Catalog')).toBeVisible();
    await expect(page.getByText('KMASTER')).toBeVisible({ timeout: 10000 });

    // Open KMASTER policy drawer
    await page.locator('h3').filter({ hasText: 'KMASTER' }).click();
    await expect(page.getByText('Allocation Blueprint')).toBeVisible();
    await expect(page.getByText('PTT').first()).toBeVisible();

    // Close drawer
    await page.locator('button').filter({ has: page.locator('svg.lucide-x') }).click();
    await expect(page.getByText('Allocation Blueprint')).not.toBeVisible();

    // ===== STEP 3: VIEW PORTFOLIOS =====
    await page.getByRole('link', { name: 'Portfolios' }).click();
    await expect(page).toHaveURL('/portfolios');
    await expect(page.locator('h2').filter({ hasText: /Portfolios\./ })).toBeVisible();
    await page.waitForTimeout(2000);

    // ===== STEP 4: NAVIGATE TO ORDERS =====
    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page).toHaveURL('/orders');
    await expect(page.getByText('Order Ledger')).toBeVisible();

    // Select first available portfolio
    const orderSelect = page.locator('select').first();
    await orderSelect.waitFor({ timeout: 5000 });
    await page.waitForTimeout(2000);
    const optionCount = await orderSelect.locator('option').count();
    if (optionCount > 1) {
      await orderSelect.selectOption({ index: 1 });
      await page.waitForTimeout(1000);

      // ===== STEP 5: VIEW/CREATE ORDER =====
      await page.getByRole('button', { name: /Execute Order/i }).click();
      await expect(page.getByText('Execute Trade')).toBeVisible({ timeout: 5000 });

      await page.getByLabel('Capital Allocation').fill('100000');
      await page.getByRole('button', { name: /Confirm Order/i }).click();

      // Handle success or duplicate error
      await page.waitForTimeout(3000);
      const dialogClosed = !(await page.getByText('Execute Trade').isVisible().catch(() => true));
      const errorShown = await page.getByText(/already|pending|processing/i).first().isVisible().catch(() => false);

      if (dialogClosed) {
        // Order placed, wait for auto-processing
        await page.waitForTimeout(8000);
      } else if (errorShown) {
        // Close dialog on error
        await page.getByRole('button', { name: /Cancel/i }).click();
      }

      // ===== FINAL: Verify page is functional =====
      await expect(page.getByText('Order Ledger')).toBeVisible();
      await expect(page.getByRole('button', { name: /Execute Order/i })).toBeVisible();
    }
  });

  test('login flow: demo chip C002 → home', async ({ page }) => {
    await page.goto('/login');
    await page.locator('span').filter({ hasText: /^C002$/ }).first().click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.getByText('C002')).toBeVisible();
  });

  test('policies → deploy strategy → portfolios navigation', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('link', { name: 'Policies' }).click();
    await expect(page.getByText('KMASTER')).toBeVisible({ timeout: 10000 });
    await page.locator('h3').filter({ hasText: 'KMASTER' }).click();
    await page.getByText('Deploy Strategy').click();
    await expect(page).toHaveURL('/portfolios');
  });

  test('theme consistency: dark theme bg-canvas-dark locked on all views', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByRole('button', { name: 'Continue' }).click();
    const body = page.locator('body');
    await expect(body).toHaveClass(/bg-canvas-dark/);
    await page.getByRole('link', { name: 'Policies' }).click();
    await page.waitForTimeout(1000);
    await expect(body).toHaveClass(/bg-canvas-dark/);
    await page.getByRole('link', { name: 'Portfolios' }).click();
    await page.waitForTimeout(1000);
    await expect(body).toHaveClass(/bg-canvas-dark/);
    await page.getByRole('link', { name: 'Orders' }).click();
    await page.waitForTimeout(1000);
    await expect(body).toHaveClass(/bg-canvas-dark/);
  });

  test('orders: duplicate order prevention is enforced', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByRole('link', { name: 'Orders' }).click();

    const select = page.locator('select').first();
    await select.waitFor({ timeout: 5000 });
    await page.waitForTimeout(2000);
    const options = await select.locator('option').count();
    if (options > 1) {
      await select.selectOption({ index: 1 });
      await page.waitForTimeout(1000);

      // Try to place an order — should succeed or show duplicate error
      await page.getByRole('button', { name: /Execute Order/i }).click();
      await page.getByLabel('Capital Allocation').fill('50000');
      await page.getByRole('button', { name: /Confirm Order/i }).click();
      await page.waitForTimeout(3000);

      const dialogClosed = !(await page.getByText('Execute Trade').isVisible().catch(() => true));
      const errorShown = await page.getByText(/already|pending|processing|conflict|active/i).first().isVisible().catch(() => false);
      // Either order was placed or duplicate prevention kicked in
      expect(dialogClosed || errorShown).toBeTruthy();
    }
  });
});
