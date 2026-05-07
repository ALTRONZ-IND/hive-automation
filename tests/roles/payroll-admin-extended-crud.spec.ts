/**
 * Payroll Admin Extended CRUD tests — tax rules, tax declarations,
 * statutory filings, disbursements, and forbidden operations.
 *
 * Runs under the `payroll-admin` Playwright project.
 *
 * Permissions (from permissions.ts):
 *   payroll:   view + create + edit + approve + export
 *   tax:       view + create + edit + export
 *   statutory: view + create + edit + export
 *   reports:   view + export
 *   employees: view only
 *   NO access: leave, attendance, benefits, finance, shifts, performance, recruitment, ewa
 */

import { test, expect } from '../../fixtures/index';
import { HIVE_URL } from '../../utils/constants';

const EMPLOYER_ID = 'c0000001-0000-0000-0000-000000000001';
const SEED_EMPLOYEE_ID = 'd0000001-0000-0000-0000-000000000001';

// ─── Tax Rules ────────────────────────────────────────────────────────────────
test.describe.serial('Payroll Admin Extended — Tax Rules', () => {
  let createdTaxRuleId: string;
  const ts = Date.now();

  test('list tax rules → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/tax-rules`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('create tax rule → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/tax-rules`, {
      data: {
        countryCode: 'IND',
        ruleType: 'Standard Deduction',
        ruleName: `PA Standard Deduction ${ts}`,
        rateOrAmount: '50000',
        isPercentage: false,
        effectiveFrom: '2025-04-01',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdTaxRuleId = (body.data ?? body).id;
    expect(createdTaxRuleId).toBeTruthy();
  });

  test('update tax rule → 200', async ({ request }) => {
    if (!createdTaxRuleId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/tax-rules/${createdTaxRuleId}`, {
      data: { rateOrAmount: '55000', ruleName: `PA Standard Deduction Updated ${ts}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id ?? createdTaxRuleId).toBeTruthy();
  });
});

// ─── Tax Declarations (view only) ────────────────────────────────────────────
test.describe('Payroll Admin Extended — Tax Declarations (view)', () => {
  test('list tax declarations → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/tax-declarations`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });
});

// ─── Statutory Filings ────────────────────────────────────────────────────────
test.describe.serial('Payroll Admin Extended — Statutory Filings', () => {
  let createdFilingId: string;
  const ts = Date.now();

  test('list statutory filings → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/statutory-filings`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('create statutory filing → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/statutory-filings`, {
      data: {
        employerId: EMPLOYER_ID,
        filingType: 'ESI',
        period: '2025-05',
        dueDate: '2025-06-21',
        status: 'Pending',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdFilingId = (body.data ?? body).id;
    expect(createdFilingId).toBeTruthy();
  });

  test('update statutory filing → 200', async ({ request }) => {
    if (!createdFilingId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/statutory-filings/${createdFilingId}`, {
      data: { status: 'Filed' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id ?? createdFilingId).toBeTruthy();
  });
});

// ─── Disbursements (view only — payrollRunId required for POST) ───────────────
test.describe('Payroll Admin Extended — Disbursements (view)', () => {
  test('list disbursements → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/disbursements`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });
});

// ─── Forbidden operations ─────────────────────────────────────────────────────
test.describe('Payroll Admin Extended — Forbidden operations', () => {
  test('cannot create department → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/departments`, {
      data: {
        employerId: EMPLOYER_ID,
        name: `PA Forbidden Dept ${ts}`,
        description: 'Should be forbidden',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot create benefit → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/benefits`, {
      data: {
        employerId: EMPLOYER_ID,
        benefitName: `PA Forbidden Benefit ${ts}`,
        benefitType: 'Health',
      },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot create employee → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/employee`, {
      data: {
        fullName: `PA Forbidden Employee ${ts}`,
        email: `pa-forbidden-${ts}@example.com`,
        employeeNumber: `PAF-${ts}`,
        employerId: EMPLOYER_ID,
      },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot create leave request → 403', async ({ request }) => {
    const future = new Date(Date.now() + 10 * 86400000).toISOString().split('T')[0];
    const res = await request.post(`${HIVE_URL}/api/leave`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        leaveType: 'Annual',
        fromDate: future,
        toDate: future,
        reason: 'Should be forbidden',
      },
    });
    expect(res.status()).toBe(403);
  });
});
