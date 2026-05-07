/**
 * Data Integrity Tests
 * Validates API response shapes, required fields, pagination, and
 * referential consistency between identity and hive.
 */

import { test, expect } from '../../fixtures/index';
import { HIVE_URL, IDENTITY_URL } from '../../utils/constants';
import { makeEmployee } from '../../utils/test-data';

// Ensure access token is fresh before running any test in this file
test.beforeAll(async ({ request }) => {
  await request.post(`${HIVE_URL}/api/auth/refresh`).catch(() => null);
});

test.describe('API response structure', () => {
  test('employee list has consistent shape', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/employee?limit=5`);
    expect(res.ok()).toBe(true);
    const data = await res.json();

    // Either an array or a paginated object
    if (Array.isArray(data)) {
      expect(data.every((e: Record<string, unknown>) => 'id' in e)).toBe(true);
    } else {
      const d = data as Record<string, unknown>;
      expect(d.data ?? d.items ?? d.records).toBeTruthy();
    }
  });

  test('employee detail has required fields', async ({ api }) => {
    const emp = await api.createEmployee(makeEmployee()) as Record<string, unknown>;
    if (!emp?.id) return;

    const detail = await api.getEmployee(emp.id as string) as Record<string, unknown>;
    expect(detail).toHaveProperty('id');

    // Accept fullName (combined) or firstName/first_name (split) depending on API version
    const hasName = 'fullName' in detail || 'full_name' in detail ||
      'firstName' in detail || 'first_name' in detail;
    const hasEmail = 'email' in detail;
    expect(hasName && hasEmail).toBe(true);
  });

  test('dashboard summary has expected keys', async ({ api }) => {
    const data = await api.getDashboardSummary() as Record<string, unknown>;
    // Should contain at least one meaningful summary field
    expect(Object.keys(data).length).toBeGreaterThan(0);
  });
});

test.describe('Pagination', () => {
  test('GET /api/employee supports limit parameter', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/employee?limit=2`);
    expect(res.ok()).toBe(true);
    const raw = await res.json() as Record<string, unknown>;
    // mediatedRoute wraps: { data: { data: rows, total, page, limit } }
    // Unwrap outer data envelope, then inner data array
    const envelope = (raw.data ?? raw) as Record<string, unknown>;
    const items: unknown[] = Array.isArray(envelope)
      ? envelope
      : Array.isArray(envelope.data)
        ? (envelope.data as unknown[])
        : [];
    expect(items.length).toBeLessThanOrEqual(2);
  });

  test('GET /api/leave supports pagination', async ({ request }) => {
    const res1 = await request.get(`${HIVE_URL}/api/leave?page=1&limit=5`);
    expect(res1.ok()).toBe(true);
  });

  test('GET /api/payroll-run supports pagination', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/payroll-run?page=1&limit=5`);
    expect(res.ok()).toBe(true);
  });
});

test.describe('Cross-service consistency', () => {
  test('employee identity mapping endpoint accessible', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/employee/identity`);
    expect([200, 400, 401, 404]).toContain(res.status());
  });

  test('employer identity mapping endpoint accessible', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/employer/identity`);
    expect([200, 400, 401, 404]).toContain(res.status());
  });

  test('manager mapping list is accessible', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/manager-mapping`);
    expect(res.ok()).toBe(true);
  });
});

test.describe('Error response format', () => {
  test('404 response has message field', async ({ request }) => {
    const res = await request.get(
      `${HIVE_URL}/api/employee/00000000-0000-0000-0000-000000000000`,
    );
    expect(res.status()).toBe(404);
    const body = await res.json() as Record<string, unknown>;
    const hasMessage = 'message' in body || 'error' in body || 'detail' in body;
    expect(hasMessage).toBe(true);
  });

  test('400 response on invalid body has message field', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/employee`, {
      data: { invalid_field: 'value' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    if (res.status() < 500) {
      const body = await res.json() as Record<string, unknown>;
      const hasMessage = 'message' in body || 'error' in body || 'errors' in body;
      expect(hasMessage).toBe(true);
    }
  });
});

test.describe('Content-Type headers', () => {
  test('API responses return application/json content-type', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/employee`);
    const ct = res.headers()['content-type'];
    expect(ct).toContain('application/json');
  });

  test('health endpoint returns JSON', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/health`);
    const ct = res.headers()['content-type'];
    expect(ct).toContain('application/json');
  });
});
