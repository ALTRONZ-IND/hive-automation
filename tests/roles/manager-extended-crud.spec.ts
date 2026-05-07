/**
 * Manager Extended CRUD tests — performance appraisals, performance feedback,
 * shift assignments, department/holiday access, and forbidden operations.
 *
 * Runs under the `manager` Playwright project.
 *
 * Permissions (from permissions.ts):
 *   employees:   view only
 *   attendance:  view + edit (no create/delete)
 *   leave:       view + approve (no create/delete)
 *   shifts:      view only (but POST assignments may be allowed per route)
 *   performance: view + create + edit (no delete/approve)
 *   expenses:    view + approve (no create)
 *   reports:     view only
 *   NO access:   payroll, finance, benefits, recruitment, ewa, tax, statutory
 */

import { test, expect } from '../../fixtures/index';
import { HIVE_URL } from '../../utils/constants';

const EMPLOYER_ID = 'c0000001-0000-0000-0000-000000000001';
const SEED_EMPLOYEE_ID = 'd0000001-0000-0000-0000-000000000001';

// ─── Performance Appraisals ───────────────────────────────────────────────────
test.describe.serial('Manager Extended — Performance Appraisals', () => {
  let createdAppraisalId: string;
  let cycleId: string;
  const ts = Date.now();

  test('create cycle for appraisals → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/performance/cycles`, {
      data: {
        employerId: EMPLOYER_ID,
        cycleName: `Manager Appraisal Cycle ${ts}`,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: 'Active',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    cycleId = (body.data ?? body).id;
    expect(cycleId).toBeTruthy();
  });

  test('list performance appraisals → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/performance/appraisals`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('create performance appraisal (manager has performance.canCreate) → 201', async ({ request }) => {
    if (!cycleId) return test.skip();
    const res = await request.post(`${HIVE_URL}/api/performance/appraisals`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        managerId: SEED_EMPLOYEE_ID,
        cycleId,
        managerRating: 3,
        status: 'Pending',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdAppraisalId = (body.data ?? body).id;
    expect(createdAppraisalId).toBeTruthy();
  });

  test('update performance appraisal (manager has performance.canEdit) → 200', async ({ request }) => {
    if (!createdAppraisalId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/performance/appraisals/${createdAppraisalId}`, {
      data: { overallRating: 4, status: 'Submitted' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id ?? createdAppraisalId).toBeTruthy();
  });

  test('cannot delete performance appraisal (manager has no canDelete) → 403', async ({ request }) => {
    if (!createdAppraisalId) return test.skip();
    const res = await request.delete(`${HIVE_URL}/api/performance/appraisals/${createdAppraisalId}`);
    expect(res.status()).toBe(403);
  });
});

// ─── Performance Feedback ─────────────────────────────────────────────────────
test.describe.serial('Manager Extended — Performance Feedback', () => {
  let createdFeedbackId: string;
  let cycleId: string;
  const ts = Date.now();

  test('create cycle for feedback → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/performance/cycles`, {
      data: {
        employerId: EMPLOYER_ID,
        cycleName: `Manager Feedback Cycle ${ts}`,
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: 'Active',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    cycleId = (body.data ?? body).id;
    expect(cycleId).toBeTruthy();
  });

  test('list performance feedback → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/performance/feedback`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('create performance feedback (manager has performance.canCreate) → 201', async ({ request }) => {
    if (!cycleId) return test.skip();
    const res = await request.post(`${HIVE_URL}/api/performance/feedback`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        raterId: SEED_EMPLOYEE_ID,
        cycleId,
        feedbackType: 'manager',
        status: 'Pending',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdFeedbackId = (body.data ?? body).id;
    expect(createdFeedbackId).toBeTruthy();
  });

  test('update performance feedback (manager has performance.canEdit) → 200', async ({ request }) => {
    if (!createdFeedbackId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/performance/feedback/${createdFeedbackId}`, {
      data: { status: 'Completed' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id ?? createdFeedbackId).toBeTruthy();
  });
});

// ─── Shift Assignments ────────────────────────────────────────────────────────
test.describe.serial('Manager Extended — Shift Assignments', () => {
  let createdAssignmentId: string;
  const ts = Date.now();
  const assignDate = new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0];

  test('list shift assignments → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/shifts/assignments`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('create shift assignment (manager may POST per route) → 201 or 400 or 403', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/shifts/assignments`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        date: assignDate,
      },
    });
    // 400 acceptable if shiftTemplateId FK is required; 403 if route restricts manager
    expect([201, 400, 403]).toContain(res.status());
    if (res.status() === 201) {
      const body = await res.json();
      createdAssignmentId = (body.data ?? body).id;
      expect(createdAssignmentId).toBeTruthy();
    }
  });

  test('get shift assignment by ID → 200', async ({ request }) => {
    if (!createdAssignmentId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/shifts/assignments/${createdAssignmentId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdAssignmentId);
  });
});

// ─── Departments (view only) ──────────────────────────────────────────────────
test.describe('Manager Extended — Departments', () => {
  test('can list departments → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/departments`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('cannot create department → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/departments`, {
      data: {
        employerId: EMPLOYER_ID,
        name: `MGR Forbidden Dept ${ts}`,
        description: 'Should be forbidden',
      },
    });
    expect(res.status()).toBe(403);
  });
});

// ─── Holidays (view only) ─────────────────────────────────────────────────────
test.describe('Manager Extended — Holidays', () => {
  test('can list holidays → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/holidays`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('cannot create holiday → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/holidays`, {
      data: {
        employerId: EMPLOYER_ID,
        holidayName: `MGR Forbidden Holiday ${ts}`,
        holidayDate: '2026-04-14',
        isOptional: true,
      },
    });
    expect(res.status()).toBe(403);
  });
});

// ─── Forbidden operations ─────────────────────────────────────────────────────
test.describe('Manager Extended — Forbidden operations', () => {
  test('cannot create payroll run → 403', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/payroll-run`, {
      data: { employerId: EMPLOYER_ID, month: 5, year: 2025 },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot create tax rules → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/tax-rules`, {
      data: {
        countryCode: 'IND',
        ruleType: 'Standard Deduction',
        ruleName: `MGR Forbidden Rule ${ts}`,
        rateOrAmount: '50000',
        isPercentage: false,
        effectiveFrom: '2025-04-01',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot create statutory filings → 403', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/statutory-filings`, {
      data: {
        employerId: EMPLOYER_ID,
        filingType: 'PF',
        period: '2025-05',
        dueDate: '2025-06-15',
        status: 'Pending',
      },
    });
    expect(res.status()).toBe(403);
  });
});
