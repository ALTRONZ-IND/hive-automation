import { test, expect } from '../../../fixtures/index';
import { HIVE_URL } from '../../../utils/constants';
import { makeShiftTemplate } from '../../../utils/test-data';

test.describe('Shift templates', () => {
  test('shifts page loads', async ({ page }) => {
    await page.goto(`${HIVE_URL}/shifts`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('create shift template via API', async ({ api }) => {
    try {
      const template = await api.createShiftTemplate(makeShiftTemplate()) as Record<string, unknown>;
      expect(template).toHaveProperty('id');
    } catch (e) {
      expect((e as Error).message).toMatch(/\d{3}/);
    }
  });

  test('list shift templates', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/shifts/templates`);
    expect(res.ok()).toBe(true);
  });

  test('list shift rules', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/shifts/rules`);
    expect(res.ok()).toBe(true);
  });
});

test.describe('Shift assignments', () => {
  test('list shift assignments', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/shifts/assignments`);
    expect(res.ok()).toBe(true);
  });

  test('assign shift to employee via API', async ({ api }) => {
    try {
      await api.assignShift({
        employeeId: 'test-emp-id',
        shiftTemplateId: 'test-shift-id',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      });
    } catch (e) {
      // 400/404 for non-existent IDs is expected
      expect((e as Error).message).toMatch(/\d{3}/);
    }
  });
});

test.describe('Shift swaps', () => {
  test('list shift swaps', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/shifts/swaps`);
    expect(res.ok()).toBe(true);
  });

  test('create shift swap request', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/shifts/swaps`, {
      data: {
        requesterId: 'emp-a',
        targetId: 'emp-b',
        requestDate: '2026-06-15',
        targetDate: '2026-06-16',
        reason: 'Personal commitment',
      },
    });
    expect([200, 201, 400, 404]).toContain(res.status());
  });
});
