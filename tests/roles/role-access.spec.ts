/**
 * Role-Based Access Control (RBAC) tests.
 * Verifies that each role can only access their permitted pages and is
 * blocked from forbidden ones.
 *
 * Uses the pre-saved auth states from global-setup.
 */

import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';
import {
  ROLES,
  ROLE_ACCESSIBLE_PAGES,
  ROLE_FORBIDDEN_PAGES,
  authStatePath,
  HIVE_URL,
  type Role,
} from '../../utils/constants';

// Helper to create a context with the given role's saved auth state
async function pageForRole(browser: Browser, role: Role): Promise<[BrowserContext, Page]> {
  const ctx = await browser.newContext({ storageState: authStatePath(role) });
  const page = await ctx.newPage();
  return [ctx, page];
}

// ─── Super Admin — full access ────────────────────────────────────────────────
test.describe('super_admin RBAC', () => {
  test('can access all pages', async ({ browser }) => {
    const [ctx, page] = await pageForRole(browser, 'super_admin');

    for (const path of ROLE_ACCESSIBLE_PAGES.super_admin) {
      await page.goto(`${HIVE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toMatch(/\/login|localhost:3000/);
    }

    await ctx.close();
  });
});

// ─── HR Admin ─────────────────────────────────────────────────────────────────
test.describe('hr_admin RBAC', () => {
  test('can access permitted pages', async ({ browser }) => {
    const [ctx, page] = await pageForRole(browser, 'hr_admin');

    for (const path of ROLE_ACCESSIBLE_PAGES.hr_admin) {
      await page.goto(`${HIVE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      const status = page.url();
      expect(status).not.toMatch(/\/login|localhost:3000/);
    }

    await ctx.close();
  });

  test('cannot access payroll or finance pages', async ({ browser }) => {
    const [ctx, page] = await pageForRole(browser, 'hr_admin');

    for (const path of ROLE_FORBIDDEN_PAGES.hr_admin) {
      const res = await page.goto(`${HIVE_URL}${path}`);
      // Either redirected away or got a 403/404 response
      const isRedirected = page.url().includes('/dashboard') || page.url().includes('/login');
      const isForbidden = res ? [403, 404].includes(res.status()) : false;
      expect(isRedirected || isForbidden).toBe(true);
    }

    await ctx.close();
  });
});

// ─── Payroll Admin ────────────────────────────────────────────────────────────
test.describe('payroll_admin RBAC', () => {
  test('can access payroll and tax pages', async ({ browser }) => {
    const [ctx, page] = await pageForRole(browser, 'payroll_admin');

    for (const path of ROLE_ACCESSIBLE_PAGES.payroll_admin) {
      await page.goto(`${HIVE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toMatch(/\/login|localhost:3000/);
    }

    await ctx.close();
  });

  test('cannot access recruitment or developer pages', async ({ browser }) => {
    const [ctx, page] = await pageForRole(browser, 'payroll_admin');

    for (const path of ROLE_FORBIDDEN_PAGES.payroll_admin) {
      const res = await page.goto(`${HIVE_URL}${path}`);
      const isRedirectedOrForbidden =
        page.url().includes('/dashboard') ||
        page.url().includes('/login') ||
        (res ? [403, 404].includes(res.status()) : false);
      expect(isRedirectedOrForbidden).toBe(true);
    }

    await ctx.close();
  });
});

// ─── Finance Admin ────────────────────────────────────────────────────────────
test.describe('finance_admin RBAC', () => {
  test('can access finance and reports pages', async ({ browser }) => {
    const [ctx, page] = await pageForRole(browser, 'finance_admin');

    for (const path of ROLE_ACCESSIBLE_PAGES.finance_admin) {
      await page.goto(`${HIVE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toMatch(/\/login|localhost:3000/);
    }

    await ctx.close();
  });
});

// ─── Manager ─────────────────────────────────────────────────────────────────
test.describe('manager RBAC', () => {
  test('can access team management pages', async ({ browser }) => {
    const [ctx, page] = await pageForRole(browser, 'manager');

    for (const path of ROLE_ACCESSIBLE_PAGES.manager) {
      await page.goto(`${HIVE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toMatch(/\/login|localhost:3000/);
    }

    await ctx.close();
  });

  test('cannot access payroll or developer pages', async ({ browser }) => {
    const [ctx, page] = await pageForRole(browser, 'manager');

    for (const path of ROLE_FORBIDDEN_PAGES.manager) {
      const res = await page.goto(`${HIVE_URL}${path}`);
      const blocked =
        page.url().includes('/dashboard') ||
        page.url().includes('/login') ||
        (res ? [403, 404].includes(res.status()) : false);
      expect(blocked).toBe(true);
    }

    await ctx.close();
  });
});

// ─── Employee (self-service only) ────────────────────────────────────────────
test.describe('employee RBAC', () => {
  test('can access self-service pages', async ({ browser }) => {
    const [ctx, page] = await pageForRole(browser, 'employee');

    for (const path of ROLE_ACCESSIBLE_PAGES.employee) {
      await page.goto(`${HIVE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toMatch(/\/login|localhost:3000/);
    }

    await ctx.close();
  });

  test('cannot access admin, payroll, or recruitment pages', async ({ browser }) => {
    const [ctx, page] = await pageForRole(browser, 'employee');

    for (const path of ROLE_FORBIDDEN_PAGES.employee) {
      const res = await page.goto(`${HIVE_URL}${path}`);
      const blocked =
        page.url().includes('/dashboard') ||
        page.url().includes('/my') ||
        page.url().includes('/login') ||
        (res ? [403, 404].includes(res.status()) : false);
      expect(blocked).toBe(true);
    }

    await ctx.close();
  });
});

// ─── Auditor (read-only) ─────────────────────────────────────────────────────
test.describe('auditor RBAC', () => {
  test('can access view-only sections', async ({ browser }) => {
    const [ctx, page] = await pageForRole(browser, 'auditor');

    for (const path of ROLE_ACCESSIBLE_PAGES.auditor) {
      await page.goto(`${HIVE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toMatch(/\/login|localhost:3000/);
    }

    await ctx.close();
  });

  test('create/edit buttons are not visible to auditor on employees page', async ({ browser }) => {
    const [ctx, page] = await pageForRole(browser, 'auditor');
    await page.goto(`${HIVE_URL}/employees`);
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /add employee|new employee/i });
    await expect(addBtn).not.toBeVisible();

    await ctx.close();
  });
});

// ─── Recruiter ────────────────────────────────────────────────────────────────
test.describe('recruiter RBAC', () => {
  test('can access recruitment and employee-view pages', async ({ browser }) => {
    const [ctx, page] = await pageForRole(browser, 'recruiter');

    for (const path of ROLE_ACCESSIBLE_PAGES.recruiter) {
      await page.goto(`${HIVE_URL}${path}`);
      await page.waitForLoadState('networkidle');
      expect(page.url()).not.toMatch(/\/login|localhost:3000/);
    }

    await ctx.close();
  });

  test('cannot access payroll, leave, or developer pages', async ({ browser }) => {
    const [ctx, page] = await pageForRole(browser, 'recruiter');

    for (const path of ROLE_FORBIDDEN_PAGES.recruiter) {
      const res = await page.goto(`${HIVE_URL}${path}`);
      const blocked =
        page.url().includes('/dashboard') ||
        page.url().includes('/login') ||
        (res ? [403, 404].includes(res.status()) : false);
      expect(blocked).toBe(true);
    }

    await ctx.close();
  });
});
