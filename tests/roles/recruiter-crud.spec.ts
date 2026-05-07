/**
 * Recruiter CRUD tests.
 * Runs under the `recruiter` Playwright project.
 *
 * Permissions (from permissions.ts):
 *   recruitment: view + create + edit + approve + export
 *   employees:   view only
 *   NO access:   payroll, finance, attendance, leave, benefits, shifts, performance, ewa
 */

import { test, expect } from '../../fixtures/index';
import { HIVE_URL } from '../../utils/constants';

const EMPLOYER_ID = 'c0000001-0000-0000-0000-000000000001';

// ─── Recruitment CRUD ────────────────────────────────────────────────────────
test.describe.serial('Recruiter — Job Postings CRUD', () => {
  let createdJobId: string;
  const ts = Date.now();

  test('list job postings → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/recruitment/jobs`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    const items = body.data ?? body;
    expect(Array.isArray(items)).toBe(true);
  });

  test('create job posting → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/recruitment/jobs`, {
      data: {
        employerId: EMPLOYER_ID,
        positionTitle: `Senior Developer ${ts}`,
        jobDescription: 'Build scalable systems',
        requirements: '5+ years Node.js',
        location: 'Bengaluru',
        employmentType: 'Full-Time',
        status: 'Draft',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdJobId = (body.data ?? body).id;
    expect(createdJobId).toBeTruthy();
  });

  test('list candidates → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/recruitment/candidates`);
    expect(res.status()).toBe(200);
  });

  test('create candidate → 201', async ({ request }) => {
    if (!createdJobId) return test.skip();
    const ts2 = Date.now();
    const res = await request.post(`${HIVE_URL}/api/recruitment/candidates`, {
      data: {
        postingId: createdJobId,
        fullName: `Candidate ${ts2}`,
        email: `candidate-recruiter-${ts2}@example.com`,
        phoneNumber: '+919988776655',
        status: 'Applied',
        source: 'LinkedIn',
      },
    });
    expect(res.status()).toBe(201);
  });
});

// ─── Employees (view only) ────────────────────────────────────────────────────
test.describe('Recruiter — Employee read-only', () => {
  test('can view employee list → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/employee`);
    expect(res.status()).toBe(200);
  });

  test('cannot create employee → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/employee`, {
      data: {
        fullName: `Recruiter Test ${ts}`,
        email: `rec-${ts}@example.com`,
        employeeNumber: `REC-${ts}`,
        employerId: EMPLOYER_ID,
      },
    });
    expect(res.status()).toBe(403);
  });
});

// ─── Forbidden operations ─────────────────────────────────────────────────────
test.describe('Recruiter — Forbidden operations', () => {
  test('cannot view payroll runs → 403', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/payroll-run`);
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

  test('cannot view attendance → 403', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/attendance`);
    expect(res.status()).toBe(403);
  });

  test('cannot create attendance → 403', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0];
    const res = await request.post(`${HIVE_URL}/api/attendance`, {
      data: {
        employeeId: 'd0000001-0000-0000-0000-000000000001',
        date: today,
        status: 'present',
        checkIn: '09:00',
        checkOut: '18:00',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot access benefits → 403', async ({ request }) => {
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
        shiftName: `Rec Shift ${ts}`,
        shiftType: 'fixed',
        startTime: '09:00',
        endTime: '18:00',
      },
    });
    expect(res.status()).toBe(403);
  });
});
