/**
 * Fetches the current OTP for a user via the dev-only endpoint.
 * Only works when NODE_ENV=development on altronz-identity.
 *
 * GET /api/auth/test/otp/:userId  → { otp: "123456" }
 */

import { APIRequestContext } from '@playwright/test';
import { IDENTITY_URL } from '../utils/constants';

export async function getTestOtp(
  request: APIRequestContext,
  userId: string,
): Promise<string> {
  const res = await request.get(`${IDENTITY_URL}/api/auth/test/otp/${userId}`, {
    timeout: 10_000,
  });

  if (!res.ok()) {
    throw new Error(
      `Failed to fetch test OTP for user ${userId}: ${res.status()} ${await res.text()}`,
    );
  }

  const body = await res.json() as { otp?: string; data?: { otp?: string } };
  const otp = body.otp ?? body.data?.otp;

  if (!otp) {
    throw new Error(`OTP not found in response body: ${JSON.stringify(body)}`);
  }

  return otp;
}

/**
 * Extracts the userId from the OTP page URL after a successful login redirect.
 * The identity service sets /otp?userId=<uuid> as the redirect target.
 */
export function extractUserIdFromUrl(url: string): string {
  const parsed = new URL(url);
  const userId = parsed.searchParams.get('userId');
  if (!userId) {
    throw new Error(`Could not extract userId from URL: ${url}`);
  }
  return userId;
}
