import { test, expect } from '../../../fixtures/index';
import { HIVE_URL } from '../../../utils/constants';

test.describe('GL mappings', () => {
  test('finance page loads', async ({ page }) => {
    await page.goto(`${HIVE_URL}/finance-advanced`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('list GL mappings', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/gl-mappings`);
    expect(res.ok()).toBe(true);
  });

  test('create GL mapping via API', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/finance/gl-mappings`, {
      data: {
        accountCode: `GL${Date.now()}`,
        accountName: 'Salary Expense',
        type: 'expense',
        description: 'Test GL mapping',
      },
    });
    // 403 if this role doesn't have write permission for GL mappings
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe('Bank accounts (finance)', () => {
  test('list finance bank accounts', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/bank-accounts`);
    expect(res.ok()).toBe(true);
  });

  test('bank validation endpoint accessible', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/bank-validations`);
    expect([200, 400]).toContain(res.status());
  });
});

test.describe('Payment files', () => {
  test('list payment files', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/payment-files`);
    expect(res.ok()).toBe(true);
  });

  test('list payment batches', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/payment-batches`);
    expect(res.ok()).toBe(true);
  });
});

test.describe('Reconciliation', () => {
  test('reconciliation endpoint is accessible', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/reconciliation`);
    expect([200, 400]).toContain(res.status());
  });

  test('sync logs endpoint is accessible', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/sync-logs`);
    expect(res.ok()).toBe(true);
  });
});

test.describe('Finance integrations', () => {
  test('list finance integrations', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/integrations`);
    expect(res.ok()).toBe(true);
  });
});
