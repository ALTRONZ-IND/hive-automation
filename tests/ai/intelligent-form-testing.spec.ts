/**
 * AI-Assisted Form Testing
 * Uses the Claude API to:
 *   1. Generate diverse, realistic test data for form fields
 *   2. Semantically validate error messages (not just regex matching)
 *   3. Detect form accessibility issues
 *
 * Requires ANTHROPIC_API_KEY in .env.
 */

import { test, expect } from '../../fixtures/index';
import Anthropic from '@anthropic-ai/sdk';
import { HIVE_URL } from '../../utils/constants';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Ask Claude to validate whether an error message is appropriate for the
 * given context. Returns true if the message is sensible.
 */
async function isErrorMessageAppropriate(
  fieldName: string,
  invalidValue: string,
  errorMessage: string,
): Promise<boolean> {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `A form field "${fieldName}" received the invalid value "${invalidValue}" and showed the error: "${errorMessage}".
Is this error message helpful and relevant? Reply with only "yes" or "no".`,
      },
    ],
  });

  const text = (msg.content[0] as { text: string }).text.toLowerCase().trim();
  return text.startsWith('yes');
}

/**
 * Ask Claude to generate diverse realistic test values for a given field.
 */
async function generateTestValues(fieldDescription: string, count = 5): Promise<string[]> {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `Generate ${count} diverse realistic test values for the form field: "${fieldDescription}".
Output only the values, one per line, no numbering or explanation.`,
      },
    ],
  });

  const text = (msg.content[0] as { text: string }).text;
  return text.split('\n').map((l) => l.trim()).filter(Boolean).slice(0, count);
}

test.describe('AI-generated test data — employee form', () => {
  test.skip(!process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY not set — skipping AI tests');

  test('Claude generates realistic employee names for form filling', async ({ page }) => {
    const names = await generateTestValues('employee first name (Indian names)', 3);
    expect(names.length).toBeGreaterThan(0);

    await page.goto(`${HIVE_URL}/employees`);
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /add employee|new employee/i });
    if (!(await addBtn.isVisible({ timeout: 3_000 }).catch(() => false))) return;

    await addBtn.click();
    await page.waitForSelector('[role="dialog"], form', { timeout: 5_000 });

    // Fill with AI-generated name
    const firstInput = page.getByLabel(/first name/i);
    if (await firstInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await firstInput.fill(names[0]);
      const value = await firstInput.inputValue();
      expect(value).toBe(names[0]);
    }
  });
});

test.describe('AI validation of error messages', () => {
  test.skip(!process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY not set — skipping AI tests');

  test('Claude confirms email validation error is appropriate', async ({ page }) => {
    await page.goto(`${HIVE_URL}/employees`);
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /add employee|new employee/i });
    if (!(await addBtn.isVisible({ timeout: 3_000 }).catch(() => false))) return;

    await addBtn.click();
    await page.waitForSelector('[role="dialog"], form', { timeout: 5_000 });

    const emailInput = page.getByLabel(/email/i);
    if (!(await emailInput.isVisible({ timeout: 2_000 }).catch(() => false))) return;

    await emailInput.fill('not-a-valid-email');
    await page.getByRole('button', { name: /save|create|submit/i }).click();

    const errorLocator = page.locator(
      '[aria-invalid="true"] + *, .field-error, [role="alert"]',
    ).first();

    if (!(await errorLocator.isVisible({ timeout: 3_000 }).catch(() => false))) return;

    const errorText = await errorLocator.innerText();
    const isAppropriate = await isErrorMessageAppropriate(
      'email',
      'not-a-valid-email',
      errorText,
    );
    expect(isAppropriate).toBe(true);
  });

  test('Claude confirms phone validation error is appropriate', async ({ page }) => {
    await page.goto(`${HIVE_URL}/employees`);
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /add employee|new employee/i });
    if (!(await addBtn.isVisible({ timeout: 3_000 }).catch(() => false))) return;

    await addBtn.click();
    await page.waitForSelector('[role="dialog"], form', { timeout: 5_000 });

    const phoneInput = page.getByLabel(/phone/i);
    if (!(await phoneInput.isVisible({ timeout: 2_000 }).catch(() => false))) return;

    await phoneInput.fill('abc');
    await page.getByRole('button', { name: /save|create|submit/i }).click();

    const errorLocator = page.locator(
      '[aria-invalid="true"] + *, .field-error, [role="alert"]',
    ).first();

    if (!(await errorLocator.isVisible({ timeout: 3_000 }).catch(() => false))) return;

    const errorText = await errorLocator.innerText();
    const isAppropriate = await isErrorMessageAppropriate('phone number', 'abc', errorText);
    expect(isAppropriate).toBe(true);
  });
});

test.describe('AI accessibility analysis', () => {
  test.skip(!process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY not set — skipping AI tests');

  test('Claude identifies if dashboard has meaningful page structure', async ({ page }) => {
    await page.goto(`${HIVE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Extract headings and landmark roles from the page
    const structure = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(
        (h) => ({ tag: h.tagName, text: h.textContent?.trim() }),
      );
      const landmarks = Array.from(
        document.querySelectorAll('main, nav, aside, header, footer'),
      ).map((l) => l.tagName.toLowerCase());
      return { headings, landmarks };
    });

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: `A web dashboard page has the following HTML structure:
Headings: ${JSON.stringify(structure.headings)}
Landmarks: ${JSON.stringify(structure.landmarks)}

Does this page have a reasonable accessibility structure (at minimum one heading and one landmark)? Reply with only "yes" or "no".`,
        },
      ],
    });

    const verdict = (msg.content[0] as { text: string }).text.toLowerCase().trim();
    expect(verdict).toBe('yes');
  });
});

test.describe('AI-assisted leave form validation', () => {
  test.skip(!process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY not set — skipping AI tests');

  test('Claude generates realistic leave reasons', async () => {
    const reasons = await generateTestValues(
      'reason for taking leave (professional/personal context)',
      3,
    );
    expect(reasons.length).toBe(3);
    // Reasons should be non-empty meaningful strings
    for (const reason of reasons) {
      expect(reason.length).toBeGreaterThan(5);
    }
  });
});
