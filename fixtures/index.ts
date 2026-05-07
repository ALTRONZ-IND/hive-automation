/**
 * Central fixture export.
 * Import `{ test, expect }` from `@fixtures/index` in all test specs
 * to get auth-aware page contexts and pre-built helpers.
 */

import { test as base, expect } from '@playwright/test';
import { HiveApiHelper } from '../helpers/api.helper';
import { HIVE_URL } from '../utils/constants';

type Fixtures = {
  /** Pre-authenticated Hive API helper for the current project's role */
  api: HiveApiHelper;
  /**
   * Auto-refreshes the access token before each test.
   * Handles expired alt_at (5 min JWT) that causes 401s in long-running suites.
   */
  ensureAuth: void;
};

export const test = base.extend<Fixtures>({
  ensureAuth: [
    async ({ request }, use) => {
      // Silently refresh alt_at before each test; ignore failures (e.g., unauthenticated tests)
      await request.post(`${HIVE_URL}/api/auth/refresh`).catch(() => null);
      await use();
    },
    { auto: true },
  ],

  api: async ({ request }, use) => {
    await use(new HiveApiHelper(request));
  },
});

export { expect };
