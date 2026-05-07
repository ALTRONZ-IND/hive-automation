import { test, expect } from '../../../fixtures/index';
import { HIVE_URL } from '../../../utils/constants';

test.describe('Reports', () => {
  test('reports page loads', async ({ page }) => {
    await page.goto(`${HIVE_URL}/reports`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('list report definitions', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/report-definitions`);
    expect([200, 404]).toContain(res.status());
  });

  test('list report templates', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/report-templates`);
    expect([200, 404]).toContain(res.status());
  });

  test('list report schedules', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/report-schedules`);
    expect([200, 404]).toContain(res.status());
  });

  test('list report executions', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/report-executions`);
    expect([200, 404]).toContain(res.status());
  });
});

test.describe('Tax & Statutory', () => {
  test('tax page loads', async ({ page }) => {
    await page.goto(`${HIVE_URL}/tax`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('statutory page loads', async ({ page }) => {
    await page.goto(`${HIVE_URL}/statutory`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('list tax slabs', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/tax-slabs`);
    expect(res.ok()).toBe(true);
  });

  test('list tax rules', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/tax-rules`);
    expect(res.ok()).toBe(true);
  });

  test('list tax declarations', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/tax-declarations`);
    expect(res.ok()).toBe(true);
  });

  test('list statutory filings', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/statutory-filings`);
    expect(res.ok()).toBe(true);
  });

  test('list statutory forms', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/statutory-forms`);
    expect(res.ok()).toBe(true);
  });
});
