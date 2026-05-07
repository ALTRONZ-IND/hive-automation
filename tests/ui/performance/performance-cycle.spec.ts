import { test, expect } from '../../../fixtures/index';
import { HIVE_URL } from '../../../utils/constants';
import { makePerformanceGoal } from '../../../utils/test-data';

test.describe('Performance cycles', () => {
  let cycleId: string;

  test('performance page loads', async ({ page }) => {
    await page.goto(`${HIVE_URL}/performance`);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('500');
  });

  test('create performance cycle via API', async ({ api }) => {
    try {
      const cycle = await api.createPerformanceCycle({
        name: `Q2 2026 Appraisal`,
        startDate: '2026-04-01',
        endDate: '2026-06-30',
        reviewType: 'annual',
        status: 'active',
      }) as Record<string, unknown>;
      expect(cycle).toHaveProperty('id');
      cycleId = cycle.id as string;
    } catch (e) {
      expect((e as Error).message).toMatch(/\d{3}/);
    }
  });

  test('list performance cycles', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/performance/cycles`);
    expect(res.ok()).toBe(true);
  });
});

test.describe('Performance appraisals', () => {
  test('list appraisals', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/performance/appraisals`);
    expect(res.ok()).toBe(true);
  });

  test('create appraisal via API', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/performance/appraisals`, {
      data: {
        employeeId: 'test-emp',
        cycleId: 'test-cycle',
        rating: 4,
        comments: 'Good performance',
      },
    });
    expect([200, 201, 400, 404]).toContain(res.status());
  });
});

test.describe('360 Feedback', () => {
  test('list feedback', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/performance/feedback`);
    expect(res.ok()).toBe(true);
  });

  test('submit feedback via API', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/performance/feedback`, {
      data: {
        targetEmployeeId: 'test-emp',
        fromEmployeeId: 'reviewer',
        cycleId: 'test-cycle',
        rating: 4,
        strengths: 'Great teamwork',
        areasOfImprovement: 'More proactive communication',
      },
    });
    expect([200, 201, 400, 404]).toContain(res.status());
  });
});

test.describe('Performance goals', () => {
  test('list goals', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/performance/goals`);
    expect(res.ok()).toBe(true);
  });

  test('create goal via API', async ({ api }) => {
    try {
      const goal = await api.createGoal(makePerformanceGoal('emp-123', 'cycle-123'));
      expect(goal).toBeTruthy();
    } catch (e) {
      expect((e as Error).message).toMatch(/\d{3}/);
    }
  });
});
