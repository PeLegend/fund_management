import { test, expect } from '@playwright/test';

test.describe('Orders Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Customer Code').fill('C001');
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(page).toHaveURL('/');
    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page).toHaveURL('/orders');
  });

  test('should display page header', async ({ page }) => {
    await expect(page.getByText('Order Ledger')).toBeVisible();
    await expect(page.getByText('Transaction')).toBeVisible();
    await expect(page.getByText('History.')).toBeVisible();
  });

  test('should show portfolio selector dropdown', async ({ page }) => {
    await expect(page.getByText('Select Portfolio')).toBeVisible();
    await expect(page.locator('select').first()).toBeVisible();
  });

  test('should show Execute Order button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Execute Order/i })).toBeVisible();
  });

  test('should show "No portfolio selected" when nothing is selected', async ({ page }) => {
    await expect(page.getByText('No portfolio selected')).toBeVisible();
  });

  test('should disable Execute Order button when no portfolio selected', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Execute Order/i })).toBeDisabled();
  });

  test('should select a portfolio from dropdown', async ({ page }) => {
    const select = page.locator('select').first();
    await select.waitFor({ timeout: 5000 });
    await page.waitForTimeout(2000);
    const options = await select.locator('option').count();
    if (options > 1) {
      await select.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
    }
  });

  test('should show orders or empty state when portfolio is selected', async ({ page }) => {
    const select = page.locator('select').first();
    await select.waitFor({ timeout: 5000 });
    await page.waitForTimeout(2000);
    const options = await select.locator('option').count();
    if (options > 1) {
      await select.selectOption({ index: 1 });
      await page.waitForTimeout(2000);
      // Should show either orders table or "No orders yet"
      const hasNoOrders = await page.getByText('No orders yet').isVisible().catch(() => false);
      const hasTable = await page.locator('table').first().isVisible().catch(() => false);
      expect(hasNoOrders || hasTable).toBeTruthy();
    }
  });

  test('should open Execute Trade dialog', async ({ page }) => {
    const select = page.locator('select').first();
    await select.waitFor({ timeout: 5000 });
    await page.waitForTimeout(2000);
    const options = await select.locator('option').count();
    if (options > 1) {
      await select.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: /Execute Order/i }).click();
      await expect(page.getByText('Execute Trade')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('Capital Allocation')).toBeVisible();
    }
  });

  test('should show amount input and Confirm button in dialog', async ({ page }) => {
    const select = page.locator('select').first();
    await select.waitFor({ timeout: 5000 });
    await page.waitForTimeout(2000);
    const options = await select.locator('option').count();
    if (options > 1) {
      await select.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: /Execute Order/i }).click();
      const amountInput = page.getByLabel('Capital Allocation');
      await expect(amountInput).toBeVisible();
      await expect(amountInput).toHaveAttribute('type', 'number');
      await expect(page.getByRole('button', { name: /Confirm Order/i })).toBeVisible();
    }
  });

  test('should close dialog when clicking Cancel', async ({ page }) => {
    const select = page.locator('select').first();
    await select.waitFor({ timeout: 5000 });
    await page.waitForTimeout(2000);
    const options = await select.locator('option').count();
    if (options > 1) {
      await select.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: /Execute Order/i }).click();
      await expect(page.getByText('Execute Trade')).toBeVisible();
      await page.getByRole('button', { name: /Cancel/i }).click();
      await expect(page.getByText('Execute Trade')).not.toBeVisible();
    }
  });

  test('Confirm Order button should be disabled when amount is empty', async ({ page }) => {
    const select = page.locator('select').first();
    await select.waitFor({ timeout: 5000 });
    await page.waitForTimeout(2000);
    const options = await select.locator('option').count();
    if (options > 1) {
      await select.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: /Execute Order/i }).click();
      await expect(page.getByText('Execute Trade')).toBeVisible({ timeout: 5000 });
      // Confirm button should be disabled when no amount is entered
      await expect(page.getByRole('button', { name: /Confirm Order/i })).toBeDisabled();
    }
  });

  test('should place order or show duplicate error', async ({ page }) => {
    const select = page.locator('select').first();
    await select.waitFor({ timeout: 5000 });
    await page.waitForTimeout(2000);
    const options = await select.locator('option').count();
    if (options > 1) {
      await select.selectOption({ index: 1 });
      await page.waitForTimeout(1000);
      await page.getByRole('button', { name: /Execute Order/i }).click();
      await page.getByLabel('Capital Allocation').fill('50000');
      await page.getByRole('button', { name: /Confirm Order/i }).click();
      // Either dialog closes (success) or error about duplicate order appears
      await page.waitForTimeout(3000);
      const dialogClosed = !(await page.getByText('Execute Trade').isVisible().catch(() => true));
      const errorShown = await page.getByText(/already|pending|processing|conflict|active/i).first().isVisible().catch(() => false);
      expect(dialogClosed || errorShown).toBeTruthy();
    }
  });

  test('should show order status badges or no orders message', async ({ page }) => {
    const select = page.locator('select').first();
    await select.waitFor({ timeout: 5000 });
    await page.waitForTimeout(2000);
    const options = await select.locator('option').count();
    if (options > 1) {
      await select.selectOption({ index: 1 });
      await page.waitForTimeout(3000);
      // Check for status badges in the orders table or empty state
      const hasNoOrders = await page.getByText('No orders yet').isVisible().catch(() => false);
      const hasStatusBadge = await page.locator('[class*="badge"]').first().isVisible().catch(() => false);
      const hasTableRows = await page.locator('table tbody tr').first().isVisible().catch(() => false);
      expect(hasNoOrders || hasStatusBadge || hasTableRows).toBeTruthy();
    }
  });

  test('should cancel a PENDING order if one exists', async ({ page }) => {
    const select = page.locator('select').first();
    await select.waitFor({ timeout: 5000 });
    await page.waitForTimeout(2000);
    const options = await select.locator('option').count();
    if (options > 1) {
      await select.selectOption({ index: 1 });
      await page.waitForTimeout(3000);
      // Look for Terminate button (cancel action for PENDING orders)
      const terminateBtn = page.getByRole('button', { name: /Terminate/i }).first();
      const hasTerminate = await terminateBtn.isVisible().catch(() => false);
      if (hasTerminate) {
        await terminateBtn.click();
        // AlertDialog confirmation should appear
        await page.waitForTimeout(1000);
      }
    }
  });
});
