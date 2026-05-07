/**
 * Payroll Admin CRUD tests.
 * Runs under the `payroll-admin` Playwright project.
 *
 * Permissions (from permissions.ts):
 *   payroll:   view + create + edit + approve + export
 *   employees: view only
 *   tax:       view + create + edit + export
 *   statutory: view + create + edit + export
 *   reports:   view + export
 *   NO access: leave, attendance, finance, benefits, shifts, performance, recruitment, ewa
 */

import { test, expect } from '../../fixtures/index';
import { HIVE_URL } from '../../utils/constants';

const EMPLOYER_ID = 'c0000001-0000-0000-0000-000000000001';

// ─── Payroll ──────────────────────────────────────────────────────────────────
test.describe.serial('Payroll Admin — Payroll CRUD', () => {
  let createdRunId: string;
  const ts = Date.now();

  test('list payroll runs → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/payroll-run`);
    expect(res.status()).toBe(200);
  });

  test('create payroll run → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/payroll-run`, {
      data: {
        employerId: EMPLOYER_ID,
        month: 5,
        year: 2025,
        status: 'Draft',
        totalPayroll: 500000,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdRunId = (body.data ?? body).id;
    expect(createdRunId).toBeTruthy();
  });

  test('approve payroll run → 200 or 201', async ({ request }) => {
    if (!createdRunId) return test.skip();
    const res = await request.post(`${HIVE_URL}/api/payroll-run/${createdRunId}/approve`);
    // May return 200 or 201 depending on implementation
    expect([200, 201]).toContain(res.status());
  });
});

// ─── Employees (view only) ────────────────────────────────────────────────────
test.describe('Payroll Admin — Employee read', () => {
  test('can view employee list → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/employee`);
    expect(res.status()).toBe(200);
  });

  test('cannot create employee → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/employee`, {
      data: {
        fullName: `PA Test ${ts}`,
        email: `pa-${ts}@example.com`,
        employeeNumber: `PA-${ts}`,
        employerId: EMPLOYER_ID,
      },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot update employee → 403', async ({ request }) => {
    const res = await request.put(`${HIVE_URL}/api/employee/d0000001-0000-0000-0000-000000000001`, {
      data: { fullName: 'Should Not Update' },
    });
    expect(res.status()).toBe(403);
  });
});

// ─── Forbidden operations ────────────────────────────────────────────────────
test.describe('Payroll Admin — Forbidden operations', () => {
  test('cannot create leave request → 403', async ({ request }) => {
    const future = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const res = await request.post(`${HIVE_URL}/api/leave`, {
      data: {
        employeeId: 'd0000001-0000-0000-0000-000000000001',
        leaveType: 'Annual',
        fromDate: future,
        toDate: future,
        reason: 'Should be forbidden',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot view GL mappings → 403', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/gl-mappings`);
    expect(res.status()).toBe(403);
  });

  test('cannot create GL mapping → 403', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/finance/gl-mappings`, {
      data: {
        employerId: EMPLOYER_ID,
        payComponent: 'Basic',
        debitAccount: 'DEBIT-PA',
        creditAccount: 'CREDIT-PA',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot create recruitment job → 403', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/recruitment/jobs`, {
      data: { employerId: EMPLOYER_ID, positionTitle: 'Test Job', jobDescription: 'test' },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot create benefits → 403', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/benefits`, {
      data: { employerId: EMPLOYER_ID, benefitName: 'Test', benefitType: 'Health' },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot view attendance → 403', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/attendance`);
    // payroll_admin has no attendance permission per permissions.ts
    expect(res.status()).toBe(403);
  });
});
