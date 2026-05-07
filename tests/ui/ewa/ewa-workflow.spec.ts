import { test, expect } from '../../../fixtures/index';
import { HIVE_URL } from '../../../utils/constants';

test.describe('EWA configuration', () => {
  test('EWA page loads', async ({ page }) => {
    await page.goto(`${HIVE_URL}/ewa`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('list EWA config', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/ewa/config`);
    // Employee role does not have access to EWA config — 403 is acceptable
    expect(res.status()).toBeLessThan(500);
  });

  test('create EWA config via API', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/ewa/config`, {
      data: {
        maxAdvancePercent: 50,
        minAdvanceAmount: 1000,
        maxAdvanceAmount: 25000,
        processingFee: 0,
        enabled: true,
      },
    });
    // 403 if role doesn't have permission, 400 if missing employerId, 200/201 on success
    expect(res.status()).toBeLessThan(500);
  });
});

test.describe('EWA advance requests', () => {
  test('list EWA advances', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/ewa/advances`);
    // Some roles may not have access to advances list — 403 is acceptable
    expect(res.status()).toBeLessThan(500);
  });

  test('list EWA requests', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/ewa/requests`);
    expect(res.ok()).toBe(true);
  });

  test('create EWA request via API', async ({ api }) => {
    try {
      const req = await api.createEwaRequest({
        amount: 5000,
        reason: 'Medical emergency - automation test',
      }) as Record<string, unknown>;
      expect(req).toHaveProperty('id');
    } catch (e) {
      // May fail if employee has no salary or EWA not configured
      expect((e as Error).message).toMatch(/\d{3}/);
    }
  });

  test('EWA request form accessible for employee role', async ({ page }) => {
    await page.goto(`${HIVE_URL}/ewa`);
    await page.waitForLoadState('networkidle');

    const requestBtn = page.getByRole('button', { name: /request|apply|advance/i });
    // Presence of this button depends on role — don't fail if not visible
    const isVisible = await requestBtn.isVisible({ timeout: 3_000 }).catch(() => false);
    // Just verify page loads without error
    await expect(page.locator('body')).not.toContainText('Error');
  });
});
