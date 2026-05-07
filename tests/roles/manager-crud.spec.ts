/**
 * Manager CRUD tests.
 * Runs under the `manager` Playwright project.
 *
 * Permissions (from permissions.ts):
 *   employees:   view only
 *   attendance:  view + edit (no create/delete)
 *   leave:       view + approve (no create/delete)
 *   shifts:      view only
 *   performance: view + create + edit (no delete/approve)
 *   expenses:    view + approve (no create)
 *   reports:     view only
 *   NO access:   payroll, finance, benefits, recruitment, ewa, tax, statutory
 */

import { test, expect } from '../../fixtures/index';
import { HIVE_URL } from '../../utils/constants';

const EMPLOYER_ID = 'c0000001-0000-0000-0000-000000000001';
const SEED_EMPLOYEE_ID = 'd0000001-0000-0000-0000-000000000001'; // Ravi Kumar

// ─── Read operations ─────────────────────────────────────────────────────────
test.describe('Manager — Read operations', () => {
  test('can list employees → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/employee`);
    expect(res.status()).toBe(200);
  });

  test('can list leave requests → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/leave`);
    expect(res.status()).toBe(200);
  });

  test('can list attendance → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/attendance`);
    expect(res.status()).toBe(200);
  });

  test('can list shift templates → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/shifts/templates`);
    expect(res.status()).toBe(200);
  });

  test('can list performance cycles → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/performance/cycles`);
    expect(res.status()).toBe(200);
  });

  test('can list expenses → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/expenses`);
    expect(res.status()).toBe(200);
  });
});

// ─── Leave approval ───────────────────────────────────────────────────────────
test.describe.serial('Manager — Leave approval workflow', () => {
  let leaveId: string;
  const ts = Date.now();

  test('setup: create leave request as context (via API)', async ({ request }) => {
    // Manager can view leaves; we need an existing leave to approve
    const res = await request.get(`${HIVE_URL}/api/leave?status=pending`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const items = (body.data?.data ?? body.data ?? body) as Array<{ id: string }>;
    if (items.length > 0) {
      leaveId = items[0].id;
    }
  });

  test('can update (approve) leave → 200', async ({ request }) => {
    if (!leaveId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/leave/${leaveId}`, {
      data: { status: 'approved' },
    });
    expect(res.status()).toBe(200);
  });

  test('cannot delete leave → 403', async ({ request }) => {
    if (!leaveId) return test.skip();
    const res = await request.delete(`${HIVE_URL}/api/leave/${leaveId}`);
    expect(res.status()).toBe(403);
  });
});

// ─── Performance — manager can create cycles ──────────────────────────────────
test.describe.serial('Manager — Performance CRUD', () => {
  const ts = Date.now();

  test('create performance cycle → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/performance/cycles`, {
      data: {
        employerId: EMPLOYER_ID,
        name: `Manager Cycle ${ts}`,
        type: 'Annual',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: 'Draft',
      },
    });
    expect(res.status()).toBe(201);
  });

  test('create performance goal → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/performance/goals`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        goalDescription: `Manager set goal ${ts}`,
        goalType: 'individual',
        weight: 20,
        targetDate: '2025-06-30',
        status: 'Not_Started',
      },
    });
    expect(res.status()).toBe(201);
  });
});

// ─── Forbidden operations ─────────────────────────────────────────────────────
test.describe('Manager — Forbidden operations', () => {
  test('cannot create employee → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/employee`, {
      data: {
        fullName: `MGR Test ${ts}`,
        email: `mgr-${ts}@example.com`,
        employeeNumber: `MGR-${ts}`,
        employerId: EMPLOYER_ID,
      },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot create payroll run → 403', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/payroll-run`, {
      data: { employerId: EMPLOYER_ID, month: 5, year: 2025 },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot view GL mappings → 403', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/gl-mappings`);
    expect(res.status()).toBe(403);
  });

  test('cannot create recruitment job → 403', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/recruitment/jobs`, {
      data: { employerId: EMPLOYER_ID, positionTitle: 'Test', jobDescription: 'test' },
    });
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

  test('cannot create benefits → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/benefits`, {
      data: { employerId: EMPLOYER_ID, benefitName: `Test ${ts}`, benefitType: 'Health' },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot create shift template → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/shifts/templates`, {
      data: {
        employerId: EMPLOYER_ID,
        shiftName: `Manager Shift ${ts}`,
        shiftType: 'fixed',
        startTime: '09:00',
        endTime: '18:00',
      },
    });
    expect(res.status()).toBe(403);
  });
});
