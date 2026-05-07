/**
 * Global setup — runs once before all tests.
 * Logs in as each role and saves the browser storage state so individual
 * tests can skip the full login flow.
 */

import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ROLES, Role, AUTH_STATE_DIR, TEST_USERS } from './utils/constants';
import { loginAs } from './helpers/auth.helper';

const ALL_ROLES: Role[] = Object.values(ROLES) as Role[];

export default async function globalSetup(config: FullConfig) {
  console.log('\n🔐 Generating auth states for all roles...\n');

  // Ensure .auth/ directory exists
  fs.mkdirSync(AUTH_STATE_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  for (const role of ALL_ROLES) {
    const creds = TEST_USERS[role];
    const stateFile = path.join(AUTH_STATE_DIR, `${role}.json`);

    console.log(`  → Logging in as ${role} (${creds.email})...`);

    try {
      const context = await browser.newContext();
      const page = await context.newPage();

      await loginAs(page, role);

      await context.storageState({ path: stateFile });
      await context.close();

      console.log(`  ✓ Saved ${stateFile}`);
    } catch (err) {
      console.error(`  ✗ Failed for role ${role}:`, (err as Error).message);
      // Don't throw — allow other roles to proceed. Tests using this role
      // will fail individually with a clear error.
    }
  }

  await browser.close();
  console.log('\n✅ Auth setup complete.\n');
}
