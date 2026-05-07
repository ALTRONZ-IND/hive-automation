/**
 * Finance Admin CRUD tests.
 * Runs under the `finance-admin` Playwright project.
 *
 * Permissions (from permissions.ts):
 *   finance:   view + create + edit + approve + export (FULL minus delete)
 *   payroll:   view + export only
 *   tax:       view + create + edit + export
 *   statutory: view + export only
 *   reports:   view + export
 *   employees: view only
 *   NO access: leave, attendance(write), benefits, shifts, performance, recruitment, ewa
 */

import { test, expect } from '../../fixtures/index';
import { HIVE_URL } from '../../utils/constants';

const EMPLOYER_ID = 'c0000001-0000-0000-0000-000000000001';

// ─── Finance: GL Mappings ─────────────────────────────────────────────────────
test.describe.serial('Finance Admin — GL Mappings CRUD', () => {
  let createdGlId: string;
  const ts = Date.now();

  test('list GL mappings → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/gl-mappings`);
    expect(res.status()).toBe(200);
  });

  test('create GL mapping → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/finance/gl-mappings`, {
      data: {
        employerId: EMPLOYER_ID,
        payComponent: `Basic Salary ${ts}`,
        debitAccount: `DEBIT-${ts}`,
        creditAccount: `CREDIT-${ts}`,
        description: 'Test GL mapping',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdGlId = (body.data ?? body).id;
    expect(createdGlId).toBeTruthy();
  });

  test('list finance bank accounts → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/bank-accounts`);
    expect(res.status()).toBe(200);
  });

  test('list finance integrations → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/integrations`);
    expect(res.status()).toBe(200);
  });

  test('list payment files → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/payment-files`);
    expect(res.status()).toBe(200);
  });

  test('list sync logs → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/sync-logs`);
    expect(res.status()).toBe(200);
  });
});

// ─── Payroll (view only) ──────────────────────────────────────────────────────
test.describe('Finance Admin — Payroll read-only', () => {
  test('can view payroll runs → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/payroll-run`);
    expect(res.status()).toBe(200);
  });

  test('cannot create payroll run → 403', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/payroll-run`, {
      data: { employerId: EMPLOYER_ID, month: 5, year: 2025 },
    });
    expect(res.status()).toBe(403);
  });
});

// ─── Employees (view only) ────────────────────────────────────────────────────
test.describe('Finance Admin — Employee read-only', () => {
  test('can view employees → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/employee`);
    expect(res.status()).toBe(200);
  });

  test('cannot create employee → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/employee`, {
      data: {
        fullName: `FA Test ${ts}`,
        email: `fa-${ts}@example.com`,
        employeeNumber: `FA-${ts}`,
        employerId: EMPLOYER_ID,
      },
    });
    expect(res.status()).toBe(403);
  });
});

// ─── Forbidden operations ─────────────────────────────────────────────────────
test.describe('Finance Admin — Forbidden operations', () => {
  test('cannot create employee → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/employee`, {
      data: { fullName: `Forbidden ${ts}`, email: `forbidden-${ts}@example.com`, employeeNumber: `FBD-${ts}`, employerId: EMPLOYER_ID },
    });
    expect(res.status()).toBe(403);
  });

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

  test('cannot create benefits → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/benefits`, {
      data: { employerId: EMPLOYER_ID, benefitName: `Test ${ts}`, benefitType: 'Health' },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot create recruitment job → 403', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/recruitment/jobs`, {
      data: { employerId: EMPLOYER_ID, positionTitle: 'Test', jobDescription: 'test' },
    });
    expect(res.status()).toBe(403);
  });
});
