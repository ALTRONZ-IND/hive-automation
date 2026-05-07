/**
 * Reusable factories for generating test data.
 * Each factory returns a fresh object with unique values on every call
 * (using Date.now() suffix) so parallel tests don't collide.
 */

export function makeEmployee(suffix = Date.now()) {
  return {
    fullName: `Test Employee ${suffix}`,
    email: `emp_${suffix}@hive.test`,
    phoneNumber: `9${String(suffix).slice(-9).padStart(9, '0')}`,
  };
}

export function makeDepartment(suffix = Date.now()) {
  return {
    name: `Dept_${suffix}`,
    description: `Test department ${suffix}`,
  };
}

export function makeLeaveRequest(employeeId: string) {
  const start = futureDate(3);
  const end = futureDate(5);
  return {
    employeeId,
    leaveType: 'annual',
    startDate: start,
    endDate: end,
    reason: 'Automated test leave request',
  };
}

export function makeShiftTemplate(suffix = Date.now()) {
  return {
    name: `Shift_${suffix}`,
    startTime: '09:00',
    endTime: '18:00',
    breakMinutes: 60,
    workDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
  };
}

export function makeJobPosting(suffix = Date.now()) {
  return {
    title: `Engineer_${suffix}`,
    department: 'Engineering',
    location: 'Remote',
    description: `Automated test job posting ${suffix}`,
    openings: 2,
    salaryMin: 60000,
    salaryMax: 100000,
  };
}

export function makeExpenseReport(suffix = Date.now()) {
  return {
    title: `Expense_${suffix}`,
    description: `Test expense report ${suffix}`,
    items: [
      { category: 'Travel', amount: 1500, description: 'Cab to office' },
      { category: 'Food', amount: 450, description: 'Team lunch' },
    ],
  };
}

export function makeEWARequest(employeeId: string) {
  return {
    employeeId,
    amount: 5000,
    reason: 'Medical emergency - automated test',
  };
}

export function makePerformanceGoal(employeeId: string, cycleId: string) {
  return {
    employeeId,
    cycleId,
    title: 'Improve code quality',
    description: 'Reduce bug count by 20%',
    targetDate: futureDate(90),
    weight: 25,
  };
}

export function makeBankDetails(suffix = Date.now()) {
  return {
    accountNumber: `000100${String(suffix).slice(-6)}`,
    ifscCode: 'SBIN0001234',
    accountHolderName: `Test Employee ${suffix}`,
    bankName: 'State Bank of India',
    accountType: 'savings',
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
}
