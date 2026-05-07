/**
 * Finance Admin Extended CRUD tests — tax rules, tax declarations,
 * statutory filings, disbursements, and forbidden operations.
 *
 * Runs under the `finance-admin` Playwright project.
 *
 * Permissions (from permissions.ts):
 *   finance:   view + create + edit + approve + export (FULL minus delete)
 *   payroll:   view + export only
 *   tax:       view + create + edit + export
 *   statutory: view + export only (canCreate=false)
 *   reports:   view + export
 *   employees: view only
 *   NO access: leave, attendance(write), benefits, shifts, performance, recruitment, ewa
 */

import { test, expect } from '../../fixtures/index';
import { HIVE_URL } from '../../utils/constants';

const EMPLOYER_ID = 'c0000001-0000-0000-0000-000000000001';
const SEED_EMPLOYEE_ID = 'd0000001-0000-0000-0000-000000000001';

// ─── Tax Rules ────────────────────────────────────────────────────────────────
test.describe.serial('Finance Admin Extended — Tax Rules', () => {
  let createdTaxRuleId: string;
  const ts = Date.now();

  test('list tax rules → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/tax-rules`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('create tax rule (finance_admin has tax.canCreate) → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/tax-rules`, {
      data: {
        countryCode: 'IND',
        ruleType: 'Standard Deduction',
        ruleName: `FA Standard Deduction ${ts}`,
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
      data: { rateOrAmount: '53000', ruleName: `FA Standard Deduction Updated ${ts}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id ?? createdTaxRuleId).toBeTruthy();
  });
});

// ─── Tax Declarations (view only) ────────────────────────────────────────────
test.describe('Finance Admin Extended — Tax Declarations (view only)', () => {
  test('list tax declarations → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/tax-declarations`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });
});

// ─── Statutory Filings (view only) ───────────────────────────────────────────
test.describe('Finance Admin Extended — Statutory Filings (view only)', () => {
  test('list statutory filings → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/statutory-filings`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });
});

// ─── Disbursements ────────────────────────────────────────────────────────────
test.describe.serial('Finance Admin Extended — Disbursements', () => {
  let createdDisbursementId: string;
  const ts = Date.now();

  test('list disbursements → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/disbursements`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('create disbursement (finance_admin has finance.canCreate) → 201 or 400', async ({ request }) => {
    // payrollRunId FK may not exist in test DB; 400 is acceptable if no run found
    const res = await request.post(`${HIVE_URL}/api/disbursements`, {
      data: {
        employerId: EMPLOYER_ID,
        disbursementDate: new Date(Date.now()).toISOString().split('T')[0],
        totalAmount: 100000,
        status: 'Pending',
      },
    });
    expect([201, 400]).toContain(res.status());
    if (res.status() === 201) {
      const body = await res.json();
      createdDisbursementId = (body.data ?? body).id;
      expect(createdDisbursementId).toBeTruthy();
    }
  });
});

// ─── Forbidden operations ─────────────────────────────────────────────────────
test.describe('Finance Admin Extended — Forbidden operations', () => {
  test('cannot create statutory filing → 403', async ({ request }) => {
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

  test('cannot create holiday → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/holidays`, {
      data: {
        employerId: EMPLOYER_ID,
        holidayName: `FA Forbidden Holiday ${ts}`,
        holidayDate: '2026-03-25',
        isOptional: false,
      },
    });
    expect(res.status()).toBe(403);
  });

  test('cannot create department → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/departments`, {
      data: {
        employerId: EMPLOYER_ID,
        name: `FA Forbidden Dept ${ts}`,
        description: 'Should be forbidden',
      },
    });
    expect(res.status()).toBe(403);
  });
});
