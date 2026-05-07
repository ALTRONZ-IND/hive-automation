import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { authStatePath } from './utils/constants';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const HIVE_URL = process.env.HIVE_URL ?? 'http://localhost:3001';
const IDENTITY_URL = process.env.IDENTITY_URL ?? 'http://localhost:3000';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : 2,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
    ...(process.env.CI ? [['github'] as ['github']] : []),
  ],

  use: {
    baseURL: HIVE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  globalSetup: './global-setup.ts',

  projects: [
    // ── Auth setup (runs first, no storageState) ─────────────────────────────
    {
      name: 'setup',
      testMatch: '**/auth/**/*.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },

    // ── Role-based projects (reuse saved auth state) ─────────────────────────
    {
      name: 'super-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStatePath('super_admin'),
        baseURL: HIVE_URL,
      },
      testMatch: [
        '**/ui/**/*.spec.ts',
        '**/roles/super-admin*.spec.ts',
        '**/data/**/*.spec.ts',
      ],
    },
    {
      name: 'hr-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStatePath('hr_admin'),
        baseURL: HIVE_URL,
      },
      testMatch: [
        '**/roles/hr-admin*.spec.ts',
        '**/ui/employees/**/*.spec.ts',
        '**/ui/attendance/**/*.spec.ts',
        '**/ui/leave/**/*.spec.ts',
        '**/ui/benefits/**/*.spec.ts',
        '**/ui/shifts/**/*.spec.ts',
        '**/ui/performance/**/*.spec.ts',
        '**/ui/recruitment/**/*.spec.ts',
      ],
    },
    {
      name: 'payroll-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStatePath('payroll_admin'),
        baseURL: HIVE_URL,
      },
      testMatch: [
        '**/roles/payroll-admin*.spec.ts',
        '**/ui/payroll/**/*.spec.ts',
      ],
    },
    {
      name: 'finance-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStatePath('finance_admin'),
        baseURL: HIVE_URL,
      },
      testMatch: [
        '**/roles/finance-admin*.spec.ts',
        '**/ui/finance/**/*.spec.ts',
      ],
    },
    {
      name: 'manager',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStatePath('manager'),
        baseURL: HIVE_URL,
      },
      testMatch: ['**/roles/manager*.spec.ts'],
    },
    {
      name: 'employee',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStatePath('employee'),
        baseURL: HIVE_URL,
      },
      testMatch: [
        '**/roles/employee*.spec.ts',
        '**/ui/ewa/**/*.spec.ts',
        '**/ui/expenses/**/*.spec.ts',
      ],
    },
    {
      name: 'auditor',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStatePath('auditor'),
        baseURL: HIVE_URL,
      },
      testMatch: ['**/roles/auditor*.spec.ts'],
    },
    {
      name: 'recruiter',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStatePath('recruiter'),
        baseURL: HIVE_URL,
      },
      testMatch: ['**/roles/recruiter*.spec.ts'],
    },

    // ── API tests (uses request context with super_admin auth) ───────────────
    {
      name: 'api-tests',
      use: {
        baseURL: HIVE_URL,
        storageState: authStatePath('super_admin'),
      },
      testMatch: '**/api/**/*.spec.ts',
    },

    // ── Data integrity tests ──────────────────────────────────────────────────
    {
      name: 'data-tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStatePath('super_admin'),
        baseURL: HIVE_URL,
      },
      testMatch: '**/data/**/*.spec.ts',
    },

    // ── AI tests ──────────────────────────────────────────────────────────────
    {
      name: 'ai-tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: authStatePath('super_admin'),
        baseURL: HIVE_URL,
      },
      testMatch: '**/ai/**/*.spec.ts',
    },

    // ── Mobile viewport ───────────────────────────────────────────────────────
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 14'],
        storageState: authStatePath('employee'),
        baseURL: HIVE_URL,
      },
      testMatch: ['**/ui/dashboard/**/*.spec.ts'],
    },

    // ── Cross-browser ─────────────────────────────────────────────────────────
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: authStatePath('super_admin'),
        baseURL: HIVE_URL,
      },
      testMatch: ['**/ui/dashboard/**/*.spec.ts', '**/auth/**/*.spec.ts'],
    },
  ],
});
