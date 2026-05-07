/**
 * HR Admin Extended CRUD tests — wages, expenses, onboarding, documents,
 * enrollment periods, leave policies.
 *
 * Runs under the `hr-admin` Playwright project.
 */

import { test, expect } from '../../fixtures/index';
import { HIVE_URL } from '../../utils/constants';

const EMPLOYER_ID = 'c0000001-0000-0000-0000-000000000001';
const SEED_EMPLOYEE_ID = 'd0000001-0000-0000-0000-000000000001';

// ─── Wages / Salaries ────────────────────────────────────────────────────────
test.describe.serial('HR Admin — Wages (Salaries) CRUD', () => {
  let createdSalaryId: string;
  const ts = Date.now();

  test('list salaries → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/salaries`);
    expect(res.status()).toBe(200);
  });

  test('create salary record → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/salaries`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        month: 5,
        year: 2025,
        grossSalary: 80000,
        totalDeductions: 8000,
        netSalary: 72000,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    const created = body.data ?? body;
    createdSalaryId = created.id;
    expect(createdSalaryId).toBeTruthy();
  });

  test('get salary by id → 200', async ({ request }) => {
    if (!createdSalaryId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/salaries/${createdSalaryId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdSalaryId);
  });

  test('update salary → 200', async ({ request }) => {
    if (!createdSalaryId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/salaries/${createdSalaryId}`, {
      data: { grossSalary: 85000, totalDeductions: 8500, netSalary: 76500 },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Number((body.data ?? body).grossSalary)).toBe(85000);
  });

  test('cannot delete salary (no canDelete for hr_admin) → 403', async ({ request }) => {
    if (!createdSalaryId) return test.skip();
    const res = await request.delete(`${HIVE_URL}/api/salaries/${createdSalaryId}`);
    expect(res.status()).toBe(403);
  });
});

// ─── Salary Structures ────────────────────────────────────────────────────────
test.describe.serial('HR Admin — Salary Structure CRUD', () => {
  let createdStructureId: string;
  const ts = Date.now();

  test('list salary structures → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/salary-structure`);
    expect(res.status()).toBe(200);
  });

  test('create salary structure → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/salary-structure`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        basicSalary: 40000,
        hra: 16000,
        otherAllowances: 8000,
        pf: 4800,
        esi: 1400,
        tds: 2000,
        professionalTax: 200,
        grossSalary: 64000,
        totalDeductions: 8400,
        netSalary: 55600,
      },
    });
    // 201 on success; 400 if unique constraint violated (employee already has structure)
    expect([201, 400]).toContain(res.status());
    if (res.status() === 201) {
      const body = await res.json();
      createdStructureId = (body.data ?? body).id;
      expect(createdStructureId).toBeTruthy();
    }
  });
});

// ─── Expenses ────────────────────────────────────────────────────────────────
test.describe.serial('HR Admin — Expenses CRUD', () => {
  let createdExpenseId: string;
  const ts = Date.now();

  test('list expense reports → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/expenses`);
    expect(res.status()).toBe(200);
  });

  test('create expense report → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/expenses`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        reportTitle: `Travel Expenses ${ts}`,
        notes: 'Client visit reimbursement',
        totalAmount: 5000,
        currency: 'INR',
        status: 'Draft',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdExpenseId = (body.data ?? body).id;
    expect(createdExpenseId).toBeTruthy();
  });

  test('list expenses filtered by employeeId → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/expenses?employeeId=${SEED_EMPLOYEE_ID}`);
    expect(res.status()).toBe(200);
  });
});

// ─── Onboarding Tasks ────────────────────────────────────────────────────────
test.describe.serial('HR Admin — Onboarding Tasks CRUD', () => {
  let createdTaskId: string;
  const ts = Date.now();

  test('list onboarding tasks → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/onboarding/tasks`);
    expect(res.status()).toBe(200);
  });

  test('create onboarding task → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/onboarding/tasks`, {
      data: {
        employerId: EMPLOYER_ID,
        employeeId: SEED_EMPLOYEE_ID,
        taskName: `Complete IT Setup ${ts}`,
        taskCategory: 'IT',
        description: 'Provision laptop and accounts',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        status: 'Pending',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdTaskId = (body.data ?? body).id;
    expect(createdTaskId).toBeTruthy();
  });

  test('get onboarding task by id → 200', async ({ request }) => {
    if (!createdTaskId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/onboarding/tasks/${createdTaskId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdTaskId);
  });

  test('update onboarding task → 200', async ({ request }) => {
    if (!createdTaskId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/onboarding/tasks/${createdTaskId}`, {
      data: { status: 'Completed', notes: 'Done by IT team' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).status).toBe('Completed');
  });

  test('cannot delete onboarding task (no canDelete for hr_admin) → 403', async ({ request }) => {
    if (!createdTaskId) return test.skip();
    const res = await request.delete(`${HIVE_URL}/api/onboarding/tasks/${createdTaskId}`);
    expect(res.status()).toBe(403);
  });
});

// ─── Employee Documents ───────────────────────────────────────────────────────
test.describe.serial('HR Admin — Employee Documents CRUD', () => {
  let createdDocId: string;

  test('list employee documents → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/documents`);
    expect(res.status()).toBe(200);
  });

  test('upload employee document → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/documents`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        fileName: 'passport.pdf',
        fileUrl: 'https://storage.example.com/docs/passport.pdf',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdDocId = (body.data ?? body).id;
    expect(createdDocId).toBeTruthy();
  });

  test('get document by id → 200', async ({ request }) => {
    if (!createdDocId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/documents/${createdDocId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdDocId);
  });

  test('verify document (update isVerified) → 200', async ({ request }) => {
    if (!createdDocId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/documents/${createdDocId}`, {
      data: { isVerified: true },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).isVerified).toBe(true);
  });

  test('cannot delete document (no canDelete for hr_admin) → 403', async ({ request }) => {
    if (!createdDocId) return test.skip();
    const res = await request.delete(`${HIVE_URL}/api/documents/${createdDocId}`);
    expect(res.status()).toBe(403);
  });

  test('list documents filtered by employeeId → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/documents?employeeId=${SEED_EMPLOYEE_ID}`);
    expect(res.status()).toBe(200);
  });
});

// ─── Enrollment Periods ───────────────────────────────────────────────────────
test.describe.serial('HR Admin — Enrollment Periods CRUD', () => {
  let createdPeriodId: string;
  const ts = Date.now();

  test('list enrollment periods → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/benefits/enrollment-periods`);
    expect(res.status()).toBe(200);
  });

  test('create enrollment period → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/benefits/enrollment-periods`, {
      data: {
        employerId: EMPLOYER_ID,
        periodName: `Q3 2025 Enrollment ${ts}`,
        startDate: '2025-07-01',
        endDate: '2025-07-31',
        status: 'Upcoming',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdPeriodId = (body.data ?? body).id;
    expect(createdPeriodId).toBeTruthy();
  });

  test('get enrollment period by id → 200', async ({ request }) => {
    if (!createdPeriodId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/benefits/enrollment-periods/${createdPeriodId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdPeriodId);
  });

  test('update enrollment period status → 200', async ({ request }) => {
    if (!createdPeriodId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/benefits/enrollment-periods/${createdPeriodId}`, {
      data: { status: 'Open', endDate: '2025-08-15' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).status).toBe('Open');
  });

  test('cannot delete enrollment period (no canDelete for hr_admin) → 403', async ({ request }) => {
    if (!createdPeriodId) return test.skip();
    const res = await request.delete(`${HIVE_URL}/api/benefits/enrollment-periods/${createdPeriodId}`);
    expect(res.status()).toBe(403);
  });
});

// ─── Leave Policies ───────────────────────────────────────────────────────────
test.describe.serial('HR Admin — Leave Policy CRUD', () => {
  let createdPolicyId: string;
  const ts = Date.now();

  test('list leave policies → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/leave-policy`);
    expect(res.status()).toBe(200);
  });

  test('create leave policy → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/leave-policy`, {
      data: {
        employerId: EMPLOYER_ID,
        leaveType: `Paternity Leave ${ts}`,
        totalDaysPerYear: 5,
        maxCarryForward: 0,
        payableOnExit: false,
        description: 'Paternity leave for new fathers',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdPolicyId = (body.data ?? body).id;
    expect(createdPolicyId).toBeTruthy();
  });

  test('get leave policy by id → 200', async ({ request }) => {
    if (!createdPolicyId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/leave-policy/${createdPolicyId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdPolicyId);
  });

  test('update leave policy → 200', async ({ request }) => {
    if (!createdPolicyId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/leave-policy/${createdPolicyId}`, {
      data: { totalDaysPerYear: 7, description: 'Updated: 7 days paternity leave' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Number((body.data ?? body).totalDaysPerYear)).toBe(7);
  });

  test('cannot delete leave policy (no canDelete for hr_admin) → 403', async ({ request }) => {
    if (!createdPolicyId) return test.skip();
    const res = await request.delete(`${HIVE_URL}/api/leave-policy/${createdPolicyId}`);
    expect(res.status()).toBe(403);
  });
});
