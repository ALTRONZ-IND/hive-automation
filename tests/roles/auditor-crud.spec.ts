/**
 * Auditor CRUD tests.
 * Runs under the `auditor` Playwright project.
 *
 * Permissions (from permissions.ts):
 *   employees:  view + export only
 *   payroll:    view + export only
 *   attendance: view + export only
 *   leave:      view + export only
 *   finance:    view + export only
 *   reports:    view + export only
 *   tax:        view + export only
 *   statutory:  view + export only
 *   NO create/edit/delete/approve on anything
 *   NO access:  recruitment, benefits, shifts, performance, ewa, developer
 */

import { test, expect } from '../../fixtures/index';
import { HIVE_URL } from '../../utils/constants';

const EMPLOYER_ID = 'c0000001-0000-0000-0000-000000000001';
const SEED_EMPLOYEE_ID = 'd0000001-0000-0000-0000-000000000001';

// ─── Read-only access ────────────────────────────────────────────────────────
test.describe('Auditor — Read-only access', () => {
  test('can list employees → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/employee`);
    expect(res.status()).toBe(200);
  });

  test('can view attendance → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/attendance`);
    expect(res.status()).toBe(200);
  });

  test('can view leave requests → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/leave`);
    expect(res.status()).toBe(200);
  });

  test('can view payroll runs → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/payroll-run`);
    expect(res.status()).toBe(200);
  });

  test('can view GL mappings → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/gl-mappings`);
    expect(res.status()).toBe(200);
  });
});

// ─── Write operations are forbidden ─────────────────────────────────────────
test.describe('Auditor — Cannot write', () => {
  test('cannot create employee → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/employee`, {
      data: {
        fullName: `Auditor Test ${ts}`,
        email: `aud-${ts}@example.com`,
        employeeNumber: `AUD-${ts}`,
        employerId: EMPLOYER_ID,
      },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot update employee → 403', async ({ request }) => {
    const res = await request.put(`${HIVE_URL}/api/employee/${SEED_EMPLOYEE_ID}`, {
      data: { fullName: 'Should Not Update' },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot delete employee → 403', async ({ request }) => {
    const res = await request.delete(`${HIVE_URL}/api/employee/${SEED_EMPLOYEE_ID}`);
    expect(res.status()).toBe(403);
  });

  test('cannot create attendance → 403', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request.post(`${HIVE_URL}/api/attendance`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        date: today,
        status: 'present',
        checkIn: '09:00',
        checkOut: '18:00',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot create payroll run → 403', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/payroll-run`, {
      data: { employerId: EMPLOYER_ID, month: 6, year: 2025 },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot create leave request → 403', async ({ request }) => {
    const future = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const res = await request.post(`${HIVE_URL}/api/leave`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        leaveType: 'Annual',
        fromDate: future,
        toDate: future,
        reason: 'Auditor should not create',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot create GL mapping → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/finance/gl-mappings`, {
      data: {
        employerId: EMPLOYER_ID,
        payComponent: `Basic ${ts}`,
        debitAccount: `DEBIT-AUD-${ts}`,
        creditAccount: `CREDIT-AUD-${ts}`,
      },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot approve leave → 403', async ({ request }) => {
    const res = await request.put(`${HIVE_URL}/api/leave/00000000-0000-0000-0000-000000000000`, {
      data: { status: 'approved' },
    });
    // 403 (forbidden) or 404 (not found — forbidden check happens before DB lookup)
    expect([403, 404]).toContain(res.status());
  });

  test('cannot access recruitment → 403', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/recruitment/jobs`);
    expect(res.status()).toBe(403);
  });

  test('cannot access benefits → 403', async ({ request }) => {
    // auditor has no benefits permission per permissions.ts
    const res = await request.get(`${HIVE_URL}/api/benefits`);
    expect(res.status()).toBe(403);
  });
});
