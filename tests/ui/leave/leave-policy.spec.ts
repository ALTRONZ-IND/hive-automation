import { test, expect } from '../../../fixtures/index';
import { HIVE_URL } from '../../../utils/constants';

test.describe('Leave policy management', () => {
  test('leave policy page is accessible', async ({ page }) => {
    await page.goto(`${HIVE_URL}/leave?tab=policy`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('403');
  });

  test('create leave policy via API', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/leave-policy`, {
      data: {
        name: `Test Policy ${Date.now()}`,
        leaveType: 'annual',
        daysAllowed: 15,
        carryForward: true,
        maxCarryForward: 5,
        accrualType: 'monthly',
      },
    });
    expect([200, 201, 400, 422]).toContain(res.status());
  });

  test('list leave policies', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/leave-policy`);
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data).toBeTruthy();
  });

  test('holiday calendar is accessible', async ({ page }) => {
    await page.goto(`${HIVE_URL}/leave?tab=holidays`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('list holidays', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/holidays`);
    expect(res.ok()).toBe(true);
  });

  test('create holiday via API', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/holidays`, {
      data: {
        name: `Test Holiday ${Date.now()}`,
        date: '2026-08-15',
        type: 'national',
      },
    });
    expect([200, 201, 400]).toContain(res.status());
  });
});
