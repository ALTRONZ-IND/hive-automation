/**
 * Full login helper for Altronz Identity (email → OTP → hive dashboard).
 * Used in global-setup to pre-generate auth states, and individually in
 * auth-specific test specs.
 */

import { Browser, BrowserContext, Page } from '@playwright/test';
import { IDENTITY_URL, HIVE_URL, TEST_USERS, Role, authStatePath, TIMEOUTS } from '../utils/constants';
import { getTestOtp, extractUserIdFromUrl } from './otp.helper';

export interface LoginOptions {
  /** If true, saves the auth cookies to .auth/<role>.json */
  saveState?: boolean;
  role: Role;
}

/**
 * Logs in as the given role using the full browser flow (identity → OTP → hive).
 * Returns the authenticated page context ready to use.
 */
export async function loginAs(page: Page, role: Role): Promise<void> {
  const { email, password } = TEST_USERS[role];

  // ── Step 1: Navigate to identity login ────────────────────────────────────
  await page.goto(`${IDENTITY_URL}/login`);
  await page.waitForLoadState('networkidle');

  // ── Step 2: Fill credentials ───────────────────────────────────────────────
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /login|sign in/i }).click();

  // ── Step 3: Wait for either the OTP page or immediate hive redirect (dev bypass) ──
  // Must check both hostname AND port — both identity (3000) and hive (3001) share
  // the same hostname ('localhost'), so checking hostname alone would resolve too early.
  const hiveUrl = new URL(HIVE_URL);
  await page.waitForURL(
    (url) =>
      url.href.includes('/otp') ||
      (url.hostname === hiveUrl.hostname && url.port === hiveUrl.port),
    { timeout: TIMEOUTS.LONG },
  );

  // Dev bypass — identity skips OTP and redirects straight to hive callback
  if (!page.url().includes('/otp')) {
    await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.LONG });
    return;
  }

  // ── Step 4: Fetch OTP from dev endpoint ───────────────────────────────────
  const userId = extractUserIdFromUrl(page.url());
  const otp = await getTestOtp(page.request, userId);

  // ── Step 5: Fill OTP ───────────────────────────────────────────────────────
  await fillOtp(page, otp);

  // ── Step 6: Wait for hive dashboard ──────────────────────────────────────
  await page.waitForURL(new RegExp(`${HIVE_URL}|localhost:3001`), {
    timeout: TIMEOUTS.LONG,
  });
  await page.waitForLoadState('networkidle', { timeout: TIMEOUTS.LONG });
}

/**
 * Fills the 6-digit OTP input. Supports both:
 *   - A single <input type="text" maxlength="6"> field
 *   - 6 individual single-character inputs (input-otp component)
 */
export async function fillOtp(page: Page, otp: string): Promise<void> {
  // Try single input first
  const singleInput = page.locator('input[name="otp"], input[placeholder*="OTP"], input[autocomplete="one-time-code"]').first();
  if (await singleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
    await singleInput.fill(otp);
    await page.getByRole('button', { name: /verify|submit|confirm/i }).click();
    return;
  }

  // Fall back to 6 individual digit inputs (input-otp pattern)
  const digitInputs = page.locator('input[data-otp-input], input[inputmode="numeric"][maxlength="1"]');
  const count = await digitInputs.count();
  if (count === 6) {
    for (let i = 0; i < 6; i++) {
      await digitInputs.nth(i).fill(otp[i]);
    }
    // Submit button or auto-submit after last digit
    const submitBtn = page.getByRole('button', { name: /verify|submit|confirm/i });
    if (await submitBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await submitBtn.click();
    }
    return;
  }

  throw new Error('Could not locate OTP input field(s) on the page');
}

/**
 * Creates a pre-authenticated browser context from saved state file.
 * Use this in tests that only need the cookies without re-running login.
 */
export async function createAuthContext(
  browser: Browser,
  role: Role,
): Promise<BrowserContext> {
  return browser.newContext({
    storageState: authStatePath(role),
    baseURL: HIVE_URL,
  });
}

/**
 * API-level token fetch (used in API test specs).
 * Logs in via the identity API directly (no browser UI) and returns cookies.
 */
export async function loginViaApi(
  request: import('@playwright/test').APIRequestContext,
  role: Role,
): Promise<Record<string, string>> {
  const { email, password } = TEST_USERS[role];

  // Step 1 – login
  const loginRes = await request.post(`${IDENTITY_URL}/api/auth/login`, {
    data: { emailOrPhoneNumber: email, password },
  });
  if (!loginRes.ok()) {
    throw new Error(`Login failed: ${loginRes.status()} ${await loginRes.text()}`);
  }
  const body = (await loginRes.json()) as { data?: { redirectUri?: string; id?: string } };
  const payload = body.data ?? (body as any);

  // Dev bypass — identity skips OTP and returns a redirectUri with tokens embedded
  if (payload.redirectUri) {
    const callbackUrl = new URL(payload.redirectUri);
    const callbackRes = await request.get(callbackUrl.toString(), { maxRedirects: 0 });
    const setCookie = callbackRes.headers()['set-cookie'] ?? '';
    return parseCookies(setCookie);
  }

  // Production flow: OTP required
  const userId = payload.id as string;

  // Step 2 – get OTP
  const otp = await getTestOtp(request, userId);

  // Step 3 – verify OTP → sets cookies (alt_id, alt_rl, alt_at, etc.)
  const otpRes = await request.post(`${IDENTITY_URL}/api/auth/otp`, {
    data: { userId, otp },
  });
  if (!otpRes.ok()) {
    throw new Error(`OTP verification failed: ${otpRes.status()} ${await otpRes.text()}`);
  }

  // Extract cookies from response headers
  const setCookie = otpRes.headers()['set-cookie'] ?? '';
  return parseCookies(setCookie);
}

function parseCookies(cookieHeader: string): Record<string, string> {
  return Object.fromEntries(
    cookieHeader.split(/,(?=[^ ])/g).map((part) => {
      const [nameVal] = part.trim().split(';');
      const [name, ...valParts] = nameVal.split('=');
      return [name.trim(), valParts.join('=').trim()];
    }),
  );
}
