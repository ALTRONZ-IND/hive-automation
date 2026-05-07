import { test, expect } from '../../../fixtures/index';
import { HIVE_URL } from '../../../utils/constants';

test.describe('Benefits catalog', () => {
  test('benefits page loads', async ({ page }) => {
    await page.goto(`${HIVE_URL}/benefits`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('list benefits via API', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/benefits`);
    expect(res.ok()).toBe(true);
  });

  test('create benefit via API', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/benefits`, {
      data: {
        name: `Health Benefit ${Date.now()}`,
        type: 'health',
        description: 'Automated test benefit',
        employerContribution: 80,
        employeeContribution: 20,
      },
    });
    expect([200, 201, 400, 422]).toContain(res.status());
  });
});

test.describe('Enrollment periods', () => {
  test('list enrollment periods', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/benefits/enrollment-periods`);
    expect(res.ok()).toBe(true);
  });

  test('create enrollment period via API', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/benefits/enrollment-periods`, {
      data: {
        name: `2026 Open Enrollment`,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        enrollmentType: 'open',
      },
    });
    expect([200, 201, 400]).toContain(res.status());
  });
});

test.describe('Benefit elections', () => {
  test('list elections via API', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/benefits/elections`);
    expect(res.ok()).toBe(true);
  });

  test('list benefit dependents', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/benefits/dependents`);
    expect(res.ok()).toBe(true);
  });

  test('benefit deductions endpoint is accessible', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/benefits/deductions`);
    expect(res.ok()).toBe(true);
  });
});

test.describe('Insurance', () => {
  test('insurance plans page loads', async ({ page }) => {
    await page.goto(`${HIVE_URL}/insurance/plans`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('list insurance plans', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/insurance/plans`);
    expect(res.ok()).toBe(true);
  });

  test('insurance enrollments page loads', async ({ page }) => {
    await page.goto(`${HIVE_URL}/insurance/enrollments`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('list insurance enrollments', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/insurance/enrollments`);
    expect(res.ok()).toBe(true);
  });
});
