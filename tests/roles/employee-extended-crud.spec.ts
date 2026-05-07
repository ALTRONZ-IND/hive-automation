/**
 * Employee Extended CRUD tests — tax declarations, emergency contacts,
 * benefits dependents, work history, bank details, holidays, departments,
 * and forbidden operations.
 *
 * Runs under the `employee` Playwright project.
 *
 * Permissions (from permissions.ts):
 *   attendance:  view only
 *   leave:       view + create
 *   payroll:     view + export only
 *   benefits:    view only (dependents: view + create per self-service)
 *   shifts:      view only
 *   performance: view only
 *   expenses:    view + create + edit
 *   ewa:         view + create
 *   tax:         view own tax declarations (canCreate for own record)
 *   NO access:   tax-rules, statutory-filings, payroll mgmt, bank-details(create), work-history(create)
 */

import { test, expect } from '../../fixtures/index';
import { HIVE_URL } from '../../utils/constants';

const EMPLOYER_ID = 'c0000001-0000-0000-0000-000000000001';
const SEED_EMPLOYEE_ID = 'd0000001-0000-0000-0000-000000000001';

// ─── Tax Declarations ─────────────────────────────────────────────────────────
test.describe.serial('Employee Extended — Tax Declarations (self-service)', () => {
  let createdTaxDeclId: string;
  const ts = Date.now();

  test('can view own tax declarations → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/tax-declarations`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('can create own tax declaration → 201 or 400', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/tax-declarations`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        financialYear: '2024-25',
        regime: 'New',
        totalExemptions: 50000,
        estimatedTax: 10000,
        status: 'Draft',
      },
    });
    // 201 on success; 400 if duplicate declaration for this year already exists
    expect([201, 400]).toContain(res.status());
    if (res.status() === 201) {
      const body = await res.json();
      createdTaxDeclId = (body.data ?? body).id;
      expect(createdTaxDeclId).toBeTruthy();
    }
  });

  test('can get own tax declaration by ID → 200', async ({ request }) => {
    if (!createdTaxDeclId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/tax-declarations/${createdTaxDeclId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdTaxDeclId);
  });
});

// ─── Emergency Contacts ───────────────────────────────────────────────────────
test.describe.serial('Employee Extended — Emergency Contacts (self-service)', () => {
  let createdContactId: string;
  const ts = Date.now();

  test('can view emergency contacts → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/emergency-contacts`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('can create own emergency contact → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/emergency-contacts`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        contactName: `Employee Contact ${ts}`,
        relationship: 'Parent',
        phoneNumber: `+9198${String(ts).slice(-8)}`,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdContactId = (body.data ?? body).id;
    expect(createdContactId).toBeTruthy();
  });

  test('can get own emergency contact by ID → 200', async ({ request }) => {
    if (!createdContactId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/emergency-contacts/${createdContactId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdContactId);
  });

  test('can update own emergency contact → 200', async ({ request }) => {
    if (!createdContactId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/emergency-contacts/${createdContactId}`, {
      data: { contactName: `Employee Contact Updated ${ts}`, relationship: 'Sibling' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id ?? createdContactId).toBeTruthy();
  });
});

// ─── Benefits Dependents ──────────────────────────────────────────────────────
test.describe.serial('Employee Extended — Benefits Dependents (self-service)', () => {
  let createdDependentId: string;
  const ts = Date.now();

  test('can view benefits dependents → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/benefits/dependents`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('can add own benefits dependent → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/benefits/dependents`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        fullName: `Emp Dependent ${ts}`,
        relationship: 'Spouse',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdDependentId = (body.data ?? body).id;
    expect(createdDependentId).toBeTruthy();
  });

  test('can get own benefits dependent by ID → 200', async ({ request }) => {
    if (!createdDependentId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/benefits/dependents/${createdDependentId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdDependentId);
  });
});

// ─── Work History (view only — cannot create) ─────────────────────────────────
test.describe('Employee Extended — Work History', () => {
  test('can view work history → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/work-history`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('cannot create work history → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/work-history`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        designation: `Emp Forbidden Designation ${ts}`,
        department: 'Forbidden',
        startDate: '2020-01-01',
        endDate: '2022-12-31',
      },
    });
    expect(res.status()).toBe(403);
  });
});

// ─── Bank Details (view only — cannot create) ─────────────────────────────────
test.describe('Employee Extended — Bank Details', () => {
  test('can view bank details → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/bank-details`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('cannot create bank details (only employer/hr_admin can) → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/bank-details`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        bankName: `Forbidden Bank ${ts}`,
        accountNumber: `FBD${ts}`,
        ifscCode: `FBDN${String(ts).slice(-4)}`,
        accountHolderName: 'Ravi Kumar',
      },
    });
    expect(res.status()).toBe(403);
  });
});

// ─── Holidays (view only) ─────────────────────────────────────────────────────
test.describe('Employee Extended — Holidays', () => {
  test('can view holidays → 200', async ({ request }) => {
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
        holidayName: `Emp Forbidden Holiday ${ts}`,
        holidayDate: '2026-08-15',
        isOptional: false,
      },
    });
    expect(res.status()).toBe(403);
  });
});

// ─── Departments (view only) ──────────────────────────────────────────────────
test.describe('Employee Extended — Departments', () => {
  test('can view departments → 200', async ({ request }) => {
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
        name: `Emp Forbidden Dept ${ts}`,
        description: 'Should be forbidden',
      },
    });
    expect(res.status()).toBe(403);
  });
});

// ─── Forbidden operations ─────────────────────────────────────────────────────
test.describe('Employee Extended — Forbidden operations', () => {
  test('cannot create tax rules → 403', async ({ request }) => {
    const ts = Date.now();
    const res = await request.post(`${HIVE_URL}/api/tax-rules`, {
      data: {
        countryCode: 'IND',
        ruleType: 'Standard Deduction',
        ruleName: `Emp Forbidden Rule ${ts}`,
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

  test('cannot create payroll run → 403', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/payroll-run`, {
      data: { employerId: EMPLOYER_ID, month: 5, year: 2025 },
    });
    expect(res.status()).toBe(403);
  });
});
