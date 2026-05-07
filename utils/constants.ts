import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const IDENTITY_URL = process.env.IDENTITY_URL ?? 'http://localhost:3000';
export const HIVE_URL = process.env.HIVE_URL ?? 'http://localhost:3001';

// ─── Roles ───────────────────────────────────────────────────────────────────
export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  EMPLOYER: 'employer',
  HR_ADMIN: 'hr_admin',
  PAYROLL_ADMIN: 'payroll_admin',
  FINANCE_ADMIN: 'finance_admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  AUDITOR: 'auditor',
  RECRUITER: 'recruiter',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

// ─── Test credentials — from altronz-db seed data (01. altronz-identity-inserts.sql)
// Password for all seed users: Test@1234
// Override any via .env if needed.
export const TEST_USERS: Record<Role, { email: string; password: string }> = {
  super_admin: {
    email: process.env.SUPER_ADMIN_EMAIL ?? 'superadmin@altronz.com',
    password: process.env.SUPER_ADMIN_PASSWORD ?? 'Test@1234',
  },
  admin: {
    email: process.env.ADMIN_EMAIL ?? 'admin@altronz.com',
    password: process.env.ADMIN_PASSWORD ?? 'Test@1234',
  },
  employer: {
    email: process.env.EMPLOYER_EMAIL ?? 'rajesh.sharma@techcorp.in',
    password: process.env.EMPLOYER_PASSWORD ?? 'Test@1234',
  },
  hr_admin: {
    email: process.env.HR_ADMIN_EMAIL ?? 'priya.nair@techcorp.in',
    password: process.env.HR_ADMIN_PASSWORD ?? 'Test@1234',
  },
  payroll_admin: {
    email: process.env.PAYROLL_ADMIN_EMAIL ?? 'deepak.mehta@techcorp.in',
    password: process.env.PAYROLL_ADMIN_PASSWORD ?? 'Test@1234',
  },
  finance_admin: {
    email: process.env.FINANCE_ADMIN_EMAIL ?? 'meena.iyer@techcorp.in',
    password: process.env.FINANCE_ADMIN_PASSWORD ?? 'Test@1234',
  },
  manager: {
    email: process.env.MANAGER_EMAIL ?? 'karthik.raj@techcorp.in',
    password: process.env.MANAGER_PASSWORD ?? 'Test@1234',
  },
  employee: {
    email: process.env.EMPLOYEE_EMAIL ?? 'ravi.kumar@techcorp.in',
    password: process.env.EMPLOYEE_PASSWORD ?? 'Test@1234',
  },
  auditor: {
    email: process.env.AUDITOR_EMAIL ?? 'vijay.lakshmi@techcorp.in',
    password: process.env.AUDITOR_PASSWORD ?? 'Test@1234',
  },
  recruiter: {
    email: process.env.RECRUITER_EMAIL ?? 'suresh.babu@techcorp.in',
    password: process.env.RECRUITER_PASSWORD ?? 'Test@1234',
  },
};

// ─── Saved auth state paths ──────────────────────────────────────────────────
export const AUTH_STATE_DIR = '.auth';
export const authStatePath = (role: Role) => `${AUTH_STATE_DIR}/${role}.json`;

// ─── Role → accessible pages (for RBAC tests) ────────────────────────────────
export const ROLE_ACCESSIBLE_PAGES: Record<Role, string[]> = {
  super_admin: [
    '/dashboard', '/employees', '/attendance', '/leave', '/payroll', '/payslips',
    '/finance-advanced', '/benefits', '/shifts', '/performance', '/recruitment',
    '/expenses', '/ewa', '/reports', '/tax', '/statutory', '/notifications',
    '/developer', '/settings', '/admin',
  ],
  admin: [
    '/dashboard', '/employees', '/attendance', '/leave', '/payroll', '/payslips',
    '/finance-advanced', '/benefits', '/shifts', '/performance', '/recruitment',
    '/expenses', '/ewa', '/reports', '/tax', '/statutory', '/notifications',
    '/developer', '/settings', '/admin',
  ],
  employer: [
    '/dashboard', '/employees', '/attendance', '/leave', '/payroll', '/payslips',
    '/finance-advanced', '/benefits', '/shifts', '/performance', '/recruitment',
    '/expenses', '/ewa', '/reports', '/tax', '/statutory', '/notifications',
    '/settings',
  ],
  hr_admin: [
    '/dashboard', '/employees', '/attendance', '/leave', '/benefits', '/shifts',
    '/performance', '/recruitment', '/reports', '/notifications',
  ],
  payroll_admin: [
    '/dashboard', '/employees', '/payroll', '/payslips', '/tax', '/statutory', '/reports',
  ],
  finance_admin: [
    '/dashboard', '/employees', '/finance-advanced', '/payroll', '/tax', '/statutory',
    '/reports',
  ],
  manager: [
    '/dashboard', '/employees', '/attendance', '/leave', '/performance', '/shifts',
    '/expenses', '/reports',
  ],
  employee: [
    '/dashboard', '/my/attendance', '/my/leaves', '/my/insurance', '/payslips',
    '/benefits', '/shifts', '/performance', '/expenses', '/ewa', '/profile',
  ],
  auditor: [
    '/dashboard', '/employees', '/payroll', '/attendance', '/leave', '/finance-advanced',
    '/reports', '/tax', '/statutory',
  ],
  recruiter: [
    '/dashboard', '/recruitment', '/employees',
  ],
};

// Pages that should be forbidden for specific roles
export const ROLE_FORBIDDEN_PAGES: Record<Role, string[]> = {
  super_admin: [],
  admin: [],
  employer: ['/admin'],
  hr_admin: ['/payroll', '/tax', '/statutory', '/finance-advanced', '/developer', '/admin'],
  payroll_admin: ['/recruitment', '/benefits', '/shifts', '/performance', '/finance-advanced', '/admin'],
  finance_admin: ['/recruitment', '/benefits', '/shifts', '/performance', '/admin'],
  manager: ['/payroll', '/tax', '/statutory', '/finance-advanced', '/recruitment', '/developer', '/admin'],
  employee: ['/payroll', '/employees', '/attendance', '/leave', '/finance-advanced', '/recruitment', '/developer', '/admin'],
  auditor: ['/recruitment', '/benefits', '/shifts', '/performance', '/ewa', '/developer', '/admin'],
  recruiter: ['/payroll', '/attendance', '/leave', '/finance-advanced', '/tax', '/statutory', '/developer', '/admin'],
};

// ─── Timeouts ────────────────────────────────────────────────────────────────
export const TIMEOUTS = {
  SHORT: 5_000,
  DEFAULT: 15_000,
  LONG: 30_000,
  OTP_EXPIRY: 5 * 60 * 1000,
};
