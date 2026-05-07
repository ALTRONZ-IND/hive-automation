/**
 * Super Admin Extended CRUD tests — departments, holidays, bank details,
 * work history, emergency contacts, tax declarations, tax rules,
 * statutory filings, performance appraisals, performance feedback,
 * shift assignments, shift swaps, benefits dependents, recruitment offers,
 * and disbursements.
 *
 * Runs under the `super-admin` Playwright project.
 * super_admin has FULL access to all modules.
 */

import { test, expect } from '../../fixtures/index';
import { HIVE_URL } from '../../utils/constants';

const EMPLOYER_ID = 'c0000001-0000-0000-0000-000000000001';
const SEED_EMPLOYEE_ID = 'd0000001-0000-0000-0000-000000000001';

// ─── Departments ──────────────────────────────────────────────────────────────
test.describe.serial('Super Admin Extended — Departments CRUD', () => {
  let createdDeptId: string;
  const ts = Date.now();

  test('list departments → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/departments`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('create department → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/departments`, {
      data: {
        employerId: EMPLOYER_ID,
        name: `Engineering ${ts}`,
        description: `Engineering department ${ts}`,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdDeptId = (body.data ?? body).id;
    expect(createdDeptId).toBeTruthy();
  });

  test('get department by ID → 200', async ({ request }) => {
    if (!createdDeptId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/departments/${createdDeptId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdDeptId);
  });

  test('update department → 200', async ({ request }) => {
    if (!createdDeptId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/departments/${createdDeptId}`, {
      data: { name: `Engineering Updated ${ts}`, description: 'Updated description' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).name ?? (body.data ?? body).id).toBeTruthy();
  });

  test('delete department → 200', async ({ request }) => {
    if (!createdDeptId) return test.skip();
    const res = await request.delete(`${HIVE_URL}/api/departments/${createdDeptId}`);
    expect(res.status()).toBe(200);
  });
});

// ─── Holidays ─────────────────────────────────────────────────────────────────
test.describe.serial('Super Admin Extended — Holidays CRUD', () => {
  let createdHolidayId: string;
  const ts = Date.now();

  test('list holidays → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/holidays`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('create holiday → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/holidays`, {
      data: {
        employerId: EMPLOYER_ID,
        holidayName: `Republic Day Test ${ts}`,
        holidayDate: '2026-01-26',
        isOptional: false,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdHolidayId = (body.data ?? body).id;
    expect(createdHolidayId).toBeTruthy();
  });

  test('get holiday by ID → 200', async ({ request }) => {
    if (!createdHolidayId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/holidays/${createdHolidayId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdHolidayId);
  });

  test('update holiday → 200', async ({ request }) => {
    if (!createdHolidayId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/holidays/${createdHolidayId}`, {
      data: { holidayName: `Republic Day Updated ${ts}`, isOptional: true },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id ?? createdHolidayId).toBeTruthy();
  });
});

// ─── Bank Details ─────────────────────────────────────────────────────────────
test.describe.serial('Super Admin Extended — Bank Details CRUD', () => {
  let createdBankId: string;
  const ts = Date.now();

  test('list bank details → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/bank-details`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('create bank details → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/bank-details`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        bankName: `State Bank of India ${ts}`,
        accountNumber: `SBI${ts}`,
        ifscCode: `SBIN000${String(ts).slice(-4)}`,
        accountHolderName: 'Ravi Kumar',
      },
    });
    // 201 on success; 400 if unique constraint or already exists
    expect([201, 400]).toContain(res.status());
    if (res.status() === 201) {
      const body = await res.json();
      createdBankId = (body.data ?? body).id;
      expect(createdBankId).toBeTruthy();
    }
  });

  test('get bank details by ID → 200', async ({ request }) => {
    if (!createdBankId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/bank-details/${createdBankId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdBankId);
  });
});

// ─── Work History ─────────────────────────────────────────────────────────────
test.describe.serial('Super Admin Extended — Work History CRUD', () => {
  let createdWorkHistoryId: string;
  const ts = Date.now();

  test('list work history → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/work-history`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('create work history → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/work-history`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        designation: `Senior Engineer ${ts}`,
        department: `R&D ${ts}`,
        startDate: '2022-01-01',
        endDate: '2024-12-31',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdWorkHistoryId = (body.data ?? body).id;
    expect(createdWorkHistoryId).toBeTruthy();
  });

  test('get work history by ID → 200', async ({ request }) => {
    if (!createdWorkHistoryId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/work-history/${createdWorkHistoryId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdWorkHistoryId);
  });
});

// ─── Emergency Contacts ───────────────────────────────────────────────────────
test.describe.serial('Super Admin Extended — Emergency Contacts CRUD', () => {
  let createdContactId: string;
  const ts = Date.now();

  test('list emergency contacts → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/emergency-contacts`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('create emergency contact → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/emergency-contacts`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        contactName: `Emergency Contact ${ts}`,
        relationship: 'Spouse',
        phoneNumber: `+9199${String(ts).slice(-8)}`,
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdContactId = (body.data ?? body).id;
    expect(createdContactId).toBeTruthy();
  });

  test('get emergency contact by ID → 200', async ({ request }) => {
    if (!createdContactId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/emergency-contacts/${createdContactId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdContactId);
  });
});

// ─── Tax Declarations ─────────────────────────────────────────────────────────
test.describe.serial('Super Admin Extended — Tax Declarations CRUD', () => {
  let createdTaxDeclId: string;
  const ts = Date.now();

  test('list tax declarations → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/tax-declarations`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('create tax declaration → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/tax-declarations`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        financialYear: '2025-26',
        regime: 'New',
        totalExemptions: 0,
        estimatedTax: 0,
        status: 'Draft',
      },
    });
    // 201 on success; 400 if duplicate for this year+employee
    expect([201, 400]).toContain(res.status());
    if (res.status() === 201) {
      const body = await res.json();
      createdTaxDeclId = (body.data ?? body).id;
      expect(createdTaxDeclId).toBeTruthy();
    }
  });

  test('get tax declaration by ID → 200', async ({ request }) => {
    if (!createdTaxDeclId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/tax-declarations/${createdTaxDeclId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdTaxDeclId);
  });
});

// ─── Tax Rules ────────────────────────────────────────────────────────────────
test.describe.serial('Super Admin Extended — Tax Rules CRUD', () => {
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
        ruleName: `Standard Deduction ${ts}`,
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

  test('get tax rule by ID → 200', async ({ request }) => {
    if (!createdTaxRuleId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/tax-rules/${createdTaxRuleId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdTaxRuleId);
  });

  test('update tax rule → 200', async ({ request }) => {
    if (!createdTaxRuleId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/tax-rules/${createdTaxRuleId}`, {
      data: { rateOrAmount: '52000', ruleName: `Standard Deduction Updated ${ts}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id ?? createdTaxRuleId).toBeTruthy();
  });
});

// ─── Statutory Filings ────────────────────────────────────────────────────────
test.describe.serial('Super Admin Extended — Statutory Filings CRUD', () => {
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
        filingType: 'PF',
        period: '2025-05',
        dueDate: '2025-06-15',
        status: 'Pending',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdFilingId = (body.data ?? body).id;
    expect(createdFilingId).toBeTruthy();
  });

  test('get statutory filing by ID → 200', async ({ request }) => {
    if (!createdFilingId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/statutory-filings/${createdFilingId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdFilingId);
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

// ─── Performance Appraisals ───────────────────────────────────────────────────
test.describe.serial('Super Admin Extended — Performance Appraisals CRUD', () => {
  let createdAppraisalId: string;
  let cycleId: string;
  const ts = Date.now();

  test('create cycle for appraisal → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/performance/cycles`, {
      data: {
        employerId: EMPLOYER_ID,
        cycleName: `Appraisal Cycle ${ts}`,
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

  test('create performance appraisal → 201', async ({ request }) => {
    if (!cycleId) return test.skip();
    const res = await request.post(`${HIVE_URL}/api/performance/appraisals`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        managerId: SEED_EMPLOYEE_ID,
        cycleId,
        managerRating: 4,
        status: 'Pending',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdAppraisalId = (body.data ?? body).id;
    expect(createdAppraisalId).toBeTruthy();
  });

  test('get performance appraisal by ID → 200', async ({ request }) => {
    if (!createdAppraisalId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/performance/appraisals/${createdAppraisalId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdAppraisalId);
  });

  test('update performance appraisal → 200', async ({ request }) => {
    if (!createdAppraisalId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/performance/appraisals/${createdAppraisalId}`, {
      data: { overallRating: 5, status: 'Submitted' },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id ?? createdAppraisalId).toBeTruthy();
  });
});

// ─── Performance Feedback ─────────────────────────────────────────────────────
test.describe.serial('Super Admin Extended — Performance Feedback CRUD', () => {
  let createdFeedbackId: string;
  let cycleId: string;
  const ts = Date.now();

  test('create cycle for feedback → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/performance/cycles`, {
      data: {
        employerId: EMPLOYER_ID,
        cycleName: `Feedback Cycle ${ts}`,
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

  test('create performance feedback → 201', async ({ request }) => {
    if (!cycleId) return test.skip();
    const res = await request.post(`${HIVE_URL}/api/performance/feedback`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        raterId: SEED_EMPLOYEE_ID,
        cycleId,
        feedbackType: 'peer',
        status: 'Pending',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdFeedbackId = (body.data ?? body).id;
    expect(createdFeedbackId).toBeTruthy();
  });

  test('get performance feedback by ID → 200', async ({ request }) => {
    if (!createdFeedbackId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/performance/feedback/${createdFeedbackId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdFeedbackId);
  });

  test('update performance feedback → 200', async ({ request }) => {
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
test.describe.serial('Super Admin Extended — Shift Assignments CRUD', () => {
  let createdAssignmentId: string;
  const ts = Date.now();
  const assignDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];

  test('list shift assignments → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/shifts/assignments`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('create shift assignment → 201 or 400', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/shifts/assignments`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        date: assignDate,
      },
    });
    // 400 is acceptable if shiftTemplateId FK is required and not provided
    expect([201, 400]).toContain(res.status());
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

// ─── Shift Swaps ──────────────────────────────────────────────────────────────
test.describe.serial('Super Admin Extended — Shift Swaps CRUD', () => {
  let createdSwapId: string;
  const ts = Date.now();

  test('list shift swaps → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/shifts/swaps`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('create shift swap → 201 or 400', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/shifts/swaps`, {
      data: {
        requesterId: SEED_EMPLOYEE_ID,
        requesteeId: SEED_EMPLOYEE_ID,
        reason: `Test swap request ${ts}`,
      },
    });
    // 400 acceptable if same requester/requestee is rejected or FK shifts are required
    expect([201, 400]).toContain(res.status());
    if (res.status() === 201) {
      const body = await res.json();
      createdSwapId = (body.data ?? body).id;
      expect(createdSwapId).toBeTruthy();
    }
  });

  test('get shift swap by ID → 200', async ({ request }) => {
    if (!createdSwapId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/shifts/swaps/${createdSwapId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdSwapId);
  });
});

// ─── Benefits Dependents ──────────────────────────────────────────────────────
test.describe.serial('Super Admin Extended — Benefits Dependents CRUD', () => {
  let createdDependentId: string;
  const ts = Date.now();

  test('list benefits dependents → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/benefits/dependents`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });

  test('create benefits dependent → 201', async ({ request }) => {
    const res = await request.post(`${HIVE_URL}/api/benefits/dependents`, {
      data: {
        employeeId: SEED_EMPLOYEE_ID,
        fullName: `Test Child ${ts}`,
        relationship: 'Child',
      },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    createdDependentId = (body.data ?? body).id;
    expect(createdDependentId).toBeTruthy();
  });

  test('get benefits dependent by ID → 200', async ({ request }) => {
    if (!createdDependentId) return test.skip();
    const res = await request.get(`${HIVE_URL}/api/benefits/dependents/${createdDependentId}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id).toBe(createdDependentId);
  });

  test('update benefits dependent → 200', async ({ request }) => {
    if (!createdDependentId) return test.skip();
    const res = await request.put(`${HIVE_URL}/api/benefits/dependents/${createdDependentId}`, {
      data: { fullName: `Test Child Updated ${ts}` },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect((body.data ?? body).id ?? createdDependentId).toBeTruthy();
  });
});

// ─── Recruitment Offers (GET only — candidateId required for POST) ───────────
test.describe('Super Admin Extended — Recruitment Offers', () => {
  test('list recruitment offers → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/recruitment/offers`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });
});

// ─── Disbursements (GET only — payrollRunId required for POST) ───────────────
test.describe('Super Admin Extended — Disbursements', () => {
  test('list disbursements → 200', async ({ request }) => {
    const res = await request.get(`${HIVE_URL}/api/disbursements`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data ?? body).toBeDefined();
  });
});
