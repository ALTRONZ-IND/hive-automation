import { test, expect } from '../../../fixtures/index';
import { HIVE_URL } from '../../../utils/constants';

test.describe('Settings', () => {
  test('settings page loads', async ({ page }) => {
    await page.goto(`${HIVE_URL}/settings`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('get settings via API', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/settings`);
    expect(res.ok()).toBe(true);
  });

  test('list departments', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/departments`);
    expect(res.ok()).toBe(true);
  });

  test('create department via API', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/departments`, {
      data: {
        name: `Test Dept ${Date.now()}`,
        description: 'Automated test department',
      },
    });
    expect([200, 201, 400]).toContain(res.status());
  });

  test('list designations', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/designations`);
    expect(res.ok()).toBe(true);
  });

  test('create designation via API', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/designations`, {
      data: {
        name: `Test Designation ${Date.now()}`,
        level: 'mid',
      },
    });
    expect([200, 201, 400]).toContain(res.status());
  });

  test('list locations', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/locations`);
    expect(res.ok()).toBe(true);
  });

  test('branding API accessible', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/branding`);
    expect([200, 404]).toContain(res.status());
  });

  test('notifications page loads', async ({ page }) => {
    await page.goto(`${HIVE_URL}/notifications`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('list notification preferences', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/notifications/preferences`);
    expect(res.ok()).toBe(true);
  });
});

test.describe('Developer portal', () => {
  test('developer page loads for permitted roles', async ({ page }) => {
    await page.goto(`${HIVE_URL}/developer`);
    await page.waitForLoadState('networkidle');
    // Either loads or redirects — should not 500
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('get developer dashboard', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/developer/dashboard`);
    expect([200, 403]).toContain(res.status());
  });

  test('list API keys', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/developer/api-keys`);
    expect([200, 403]).toContain(res.status());
  });

  test('list webhooks', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/developer/webhooks`);
    expect([200, 403]).toContain(res.status());
  });
});
