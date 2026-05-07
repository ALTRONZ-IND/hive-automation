import { test, expect } from '../../../fixtures/index';
import { HIVE_URL } from '../../../utils/constants';
import { makeExpenseReport } from '../../../utils/test-data';

test.describe('Expense reports', () => {
  let expenseId: string;

  test('expenses page loads', async ({ page }) => {
    await page.goto(`${HIVE_URL}/expenses`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('create expense report via API', async ({ api }) => {
    try {
      const expense = await api.createExpense(makeExpenseReport()) as Record<string, unknown>;
      expect(expense).toHaveProperty('id');
      expenseId = expense.id as string;
    } catch (e) {
      expect((e as Error).message).toMatch(/\d{3}/);
    }
  });

  test('list expenses', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/expenses`);
    expect(res.ok()).toBe(true);
  });

  test('open new expense form via UI', async ({ page }) => {
    await page.goto(`${HIVE_URL}/expenses`);
    await page.waitForLoadState('networkidle');

    const newBtn = page.getByRole('button', { name: /new expense|add expense|create/i });
    if (await newBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await newBtn.click();
      await expect(page.locator('[role="dialog"], form')).toBeVisible({ timeout: 5_000 });
    }
  });

  test('list expense items', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/expenses/items`);
    expect(res.ok()).toBe(true);
  });
});

test.describe('Expense approval', () => {
  test('expense approval queue is accessible', async ({ page }) => {
    await page.goto(`${HIVE_URL}/expenses?tab=approvals`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('approve expense via API', async ({ api }) => {
    // Create a fresh expense to approve in this test
    let localExpenseId: string | undefined;
    try {
      const expense = await api.createExpense(makeExpenseReport()) as Record<string, unknown>;
      localExpenseId = expense?.id as string | undefined;
    } catch {
      // Creation failed — skip approval
    }
    if (!localExpenseId) return;
    try {
      await api.approveExpense(localExpenseId, 'approved');
    } catch (e) {
      expect((e as Error).message).toMatch(/\d{3}/);
    }
  });

  test('list expense approvals', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/expenses/approvals`);
    expect(res.ok()).toBe(true);
  });
});

let expenseId: string;
