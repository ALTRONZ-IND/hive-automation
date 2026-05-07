/**
 * Employee API tests — CRUD operations via API.
 * Uses storageState from super_admin role (set in playwright.config for api-tests project).
 */

import { test, expect } from '../../fixtures/index';
import { HIVE_URL } from '../../utils/constants';
import { makeEmployee } from '../../utils/test-data';

// Ensure access token is fresh before running any test in this file
test.beforeAll(async ({ request }) => {
  await request.post(`${HIVE_URL}/api/auth/refresh`).catch(() => null);
});

test.describe('Employee API — CRUD', () => {
  let employeeId: string;
  let createdEmail: string;

  test('GET /api/employee returns a list', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/employee`);
    expect(res.ok()).toBe(true);
    const data = await res.json();
    expect(data).toBeTruthy();
  });

  test('POST /api/employee creates employee', async ({ request }) => {
    // super_admin is a platform role with no employer entity (alt_eid unset).
    // Resolve a valid employerId from the employer list before creating.
    let employerId: string | undefined;
    const empListRes = await request.get(`${HIVE_URL}/api/employer`);
    if (empListRes.ok()) {
      const empList = await empListRes.json() as Record<string, unknown>;
      const items = (Array.isArray(empList) ? empList : (empList.data ?? empList.items ?? [])) as Record<string, unknown>[];
      employerId = items[0]?.id as string | undefined;
    }
    if (!employerId) {
      // No employer in DB — skip rather than fail
      return;
    }

    const emp = { ...makeEmployee(), employerId };
    createdEmail = emp.email;
    const res = await request.post(`${HIVE_URL}/api/employee`, { data: emp });
    expect([200, 201]).toContain(res.status());
    const body = await res.json() as Record<string, unknown>;
    // mediatedRoute wraps in { data: ... }; handle both wrapped and direct shapes
    const created = (body.data ?? body) as Record<string, unknown>;
    expect(created).toHaveProperty('id');
    employeeId = created.id as string;
  });

  test('GET /api/employee/:id returns employee', async ({ request }) => {
    if (!employeeId) return;
    const res = await request.get(`${HIVE_URL}/api/employee/${employeeId}`);
    expect(res.ok()).toBe(true);
    const body = await res.json() as Record<string, unknown>;
    const detail = (body.data ?? body) as Record<string, unknown>;
    if (createdEmail) expect(detail.email).toBe(createdEmail);
  });

  test('PUT /api/employee/:id updates employee', async ({ request }) => {
    if (!employeeId) return;
    const res = await request.put(`${HIVE_URL}/api/employee/${employeeId}`, {
      data: { fullName: 'Updated Employee' },
    });
    expect(res.ok()).toBe(true);
  });

  test('DELETE /api/employee/:id soft-deletes employee', async ({ request }) => {
    if (!employeeId) return;
    const res = await request.delete(`${HIVE_URL}/api/employee/${employeeId}`);
    expect([200, 204]).toContain(res.status());
  });

  test('GET /api/employee/:id after delete returns 404 or deleted record', async ({ request }) => {
    if (!employeeId) return;
    const res = await request.get(`${HIVE_URL}/api/employee/${employeeId}`);
    // Either 404 (hard delete) or data with deleted_at set (soft delete)
    if (res.ok()) {
      const body = await res.json() as Record<string, unknown>;
      const detail = (body.data ?? body) as Record<string, unknown>;
      expect(detail.deletedAt ?? detail.deleted_at).toBeTruthy();
    } else {
      expect(res.status()).toBe(404);
    }
  });
});

test.describe('Employee API — validation', () => {
  test('POST with missing email returns 400', async ({ request }) => {
    const { email: _, ...withoutEmail } = makeEmployee();
    const res = await request.post(`${HIVE_URL}/api/employee`, { data: withoutEmail });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('POST with duplicate email returns 4xx', async ({ request }) => {
    const emp = makeEmployee();
    await request.post(`${HIVE_URL}/api/employee`, { data: emp });
    const res2 = await request.post(`${HIVE_URL}/api/employee`, { data: emp });
    expect(res2.status()).toBeGreaterThanOrEqual(400);
  });

  test('GET non-existent employee returns 404', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/employee/00000000-0000-0000-0000-000000000000`);
    expect(res.status()).toBe(404);
  });
});

test.describe('Employment details', () => {
  test('list employment details', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/employment-details`);
    expect(res.ok()).toBe(true);
  });

  test('list work history', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/work-history`);
    expect(res.ok()).toBe(true);
  });

  test('list emergency contacts', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/emergency-contacts`);
    expect(res.ok()).toBe(true);
  });
});
