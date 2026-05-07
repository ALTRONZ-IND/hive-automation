/**
 * Super Admin full CRUD tests.
 * Runs under the `super-admin` Playwright project.
 *
 * super_admin has FULL access to all modules.
 * These tests verify end-to-end CRUD works across all domains.
 */

import { test, expect } from '../../fixtures/index';
import { HIVE_URL } from '../../utils/constants';

const EMPLOYER_ID = 'c0000001-0000-0000-0000-000000000001';
const SEED_EMPLOYEE_ID = 'd0000001-0000-0000-0000-000000000001';

// ─── Employees — full CRUD ────────────────────────────────────────────────────
test.describe.serial('Super Admin — Employee full CRUD', () => {
  let createdEmployeeId: string;
  const ts = Date.now();

  test('list employees → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/employee`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data).toBeDefined();
  });

  test('create employee → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/employee`, {
      data: {
        fullName: `SA Test Employee ${ts}`,
        email: `sa-test-${ts}@example.com`,
        employeeNumber: `SAT-${ts}`,
        employerId: EMPLOYER_ID,
        gender: 'female',
        phoneNumber: '+919900000099',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdEmployeeId = (body.data ?? body).id;
    expect(createdEmployeeId).toBeTruthy();
  });

  test('get employee by ID → 200', async ({ request }) => {
    if (!createdEmployeeId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/employee/${createdEmployeeId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdEmployeeId);
  });

  test('update employee → 200', async ({ request }) => {
    if (!createdEmployeeId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/employee/${createdEmployeeId}`, {
      data: { fullName: `SA Updated Employee ${ts}`, status: 'Active' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).fullName).toContain('Updated');
  });

  test('delete employee → 200', async ({ request }) => {
    if (!createdEmployeeId) return test.skip();
    const res = await request.delete(`${HIVE_URL}/api/employee/${createdEmployeeId}`);
    expect(res.status()).toBe(200);
  });
});

// ─── Payroll — full CRUD ──────────────────────────────────────────────────────
test.describe.serial('Super Admin — Payroll full CRUD', () => {
  let runId: string;

  test('list payroll runs → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/payroll-run`);
    expect(res.status()).toBe(200);
  });

  test('create payroll run → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/payroll-run`, {
      data: {
        employerId: EMPLOYER_ID,
        month: 6,
        year: 2025,
        status: 'Draft',
        totalPayroll: 750000,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    runId = (body.data ?? body).id;
    expect(runId).toBeTruthy();
  });
});

// ─── Finance — full CRUD ──────────────────────────────────────────────────────
test.describe.serial('Super Admin — Finance full CRUD', () => {
  const ts = Date.now();

  test('list GL mappings → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/finance/gl-mappings`);
    expect(res.status()).toBe(200);
  });

  test('create GL mapping → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/finance/gl-mappings`, {
      data: {
        employerId: EMPLOYER_ID,
        payComponent: `HRA ${ts}`,
        debitAccount: `DEBIT-SA-${ts}`,
        creditAccount: `CREDIT-SA-${ts}`,
        description: 'HRA GL mapping',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect((body.data ?? body).id).toBeTruthy();
  });
});

// ─── Attendance — full CRUD ───────────────────────────────────────────────────
test.describe('Super Admin — Attendance', () => {
  test('list attendance → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/attendance`);
    expect(res.status()).toBe(200);
  });

  test('create attendance → 201 or 400 (if already exists)', async ({ request }) => {
    const date = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]; // 7 days ago
    const res = await request.post(`${HIVE_URL}/api/attendance`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        date,
        status: 'present',
        checkIn: '09:00',
        checkOut: '18:00',
      },
    });
    expect([201, 400]).toContain(res.status());
  });
});

// ─── Leave — full CRUD ────────────────────────────────────────────────────────
test.describe.serial('Super Admin — Leave full CRUD', () => {
  let leaveId: string;
  const ts = Date.now();

  test('create leave request → 201', async ({ request }) => {
    const future = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    const end = new Date(Date.now() + 32 * 86400000).toISOString().split('T')[0];
    const res = await request.post(`${HIVE_URL}/api/leave`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        leaveType: 'Sick',
        fromDate: future,
        toDate: end,
        reason: `SA test leave ${ts}`,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    leaveId = (body.data ?? body).id;
    expect(leaveId).toBeTruthy();
  });

  test('approve leave → 200', async ({ request }) => {
    if (!leaveId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/leave/${leaveId}`, {
      data: { status: 'approved' },
    });
    expect(res.status()).toBe(200);
  });

  test('delete leave → 200', async ({ request }) => {
    if (!leaveId) return test.skip();
    const res = await request.delete(`${HIVE_URL}/api/leave/${leaveId}`);
    expect(res.status()).toBe(200);
  });
});

// ─── Benefits — full CRUD ────────────────────────────────────────────────────
test.describe.serial('Super Admin — Benefits full CRUD', () => {
  let benefitId: string;
  const ts = Date.now();

  test('list benefits → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/benefits`);
    expect(res.status()).toBe(200);
  });

  test('create benefit → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/benefits`, {
      data: {
        employerId: EMPLOYER_ID,
        benefitName: `Life Insurance ${ts}`,
        benefitType: 'Life Insurance',
        description: 'Term life coverage',
        provider: 'LIC',
        premiumCost: 8000,
        employerContribution: 5000,
        employeeContribution: 3000,
        isActive: true,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    benefitId = (body.data ?? body).id;
    expect(benefitId).toBeTruthy();
  });
});

// ─── Recruitment — full CRUD ─────────────────────────────────────────────────
test.describe.serial('Super Admin — Recruitment full CRUD', () => {
  let jobId: string;
  const ts = Date.now();

  test('list job postings → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/recruitment/jobs`);
    expect(res.status()).toBe(200);
  });

  test('create job posting → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/recruitment/jobs`, {
      data: {
        employerId: EMPLOYER_ID,
        positionTitle: `CTO ${ts}`,
        jobDescription: 'Lead technology vision',
        requirements: '10+ years leadership',
        location: 'Mumbai',
        employmentType: 'Full-Time',
        status: 'Open',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    jobId = (body.data ?? body).id;
    expect(jobId).toBeTruthy();
  });

  test('create candidate → 201', async ({ request }) => {
    if (!jobId) return test.skip();
    const ts2 = Date.now();
    const res = await request.post(`${HIVE_URL}/api/recruitment/candidates`, {
      data: {
        postingId: jobId,
        fullName: `SA Candidate ${ts2}`,
        email: `sa-candidate-${ts2}@example.com`,
        phoneNumber: '+919000000001',
        status: 'Applied',
      },
    });
    expect(res.status()).toBe(201);
  });
});

// ─── Performance — full CRUD ─────────────────────────────────────────────────
test.describe.serial('Super Admin — Performance full CRUD', () => {
  const ts = Date.now();

  test('create performance cycle → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/performance/cycles`, {
      data: {
        employerId: EMPLOYER_ID,
        name: `Annual Review ${ts}`,
        type: 'Annual',
        startDate: '2025-01-01',
        endDate: '2025-12-31',
        status: 'Active',
      },
    });
    expect(res.status()).toBe(201);
  });

  test('create performance goal → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/performance/goals`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        goalDescription: `Increase productivity ${ts}`,
        goalType: 'individual',
        weight: 30,
        targetDate: '2025-12-31',
      },
    });
    expect(res.status()).toBe(201);
  });
});

// ─── EWA — full access ───────────────────────────────────────────────────────
test.describe('Super Admin — EWA', () => {
  test('list EWA requests → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/ewa/requests`);
    expect(res.status()).toBe(200);
  });

  test('list EWA config → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/ewa/config`);
    expect(res.status()).toBe(200);
  });

  test('create EWA config → 201 or 400', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/ewa/config`, {
      data: {
        employerId: EMPLOYER_ID,
        maxAdvancePercentage: 50,
        maxRequestsPerPeriod: 2,
        processingFee: '0',
        minAmount: 1000,
        maxAmount: 25000,
        isActive: true,
      },
    });
    expect([201, 400]).toContain(res.status());
  });
});
