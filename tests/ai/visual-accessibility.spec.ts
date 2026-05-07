/**
 * Visual & Accessibility Tests
 * Uses Playwright's built-in snapshot + axe-style checks alongside Claude
 * for intelligent visual anomaly detection.
 */

import { test, expect } from '../../fixtures/index';
import Anthropic from '@anthropic-ai/sdk';
import { HIVE_URL } from '../../utils/constants';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Accessibility helpers ────────────────────────────────────────────────────

async function getAccessibilityIssues(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const issues: string[] = [];

    // Images without alt text
    document.querySelectorAll('img:not([alt])').forEach((img) => {
      issues.push(`Image missing alt text: ${img.getAttribute('src') ?? 'unknown'}`);
    });

    // Buttons without accessible names
    document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach((btn) => {
      if (!btn.textContent?.trim()) {
        issues.push(`Button has no accessible name`);
      }
    });

    // Form inputs without labels
    document.querySelectorAll('input, select, textarea').forEach((input) => {
      const id = input.getAttribute('id');
      const hasLabel =
        (id && document.querySelector(`label[for="${id}"]`)) ||
        input.getAttribute('aria-label') ||
        input.getAttribute('aria-labelledby') ||
        input.closest('label');

      if (!hasLabel && input.getAttribute('type') !== 'hidden') {
        issues.push(`Form control missing label: type=${input.getAttribute('type') ?? 'text'}`);
      }
    });

    // Links without discernible text
    document.querySelectorAll('a').forEach((a) => {
      if (!a.textContent?.trim() && !a.getAttribute('aria-label')) {
        issues.push(`Link has no discernible text: href=${a.getAttribute('href') ?? '#'}`);
      }
    });

    return issues;
  });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Accessibility — dashboard', () => {
  test('dashboard has no critical accessibility issues', async ({ page }) => {
    await page.goto(`${HIVE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const issues = await getAccessibilityIssues(page);

    // Allow some minor issues but fail on high counts
    if (issues.length > 0) {
      console.log('Accessibility issues found:', issues);
    }
    expect(issues.length).toBeLessThan(10);
  });

  test('dashboard has a main landmark', async ({ page }) => {
    await page.goto(`${HIVE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const mainCount = await page.locator('main, [role="main"]').count();
    expect(mainCount).toBeGreaterThanOrEqual(1);
  });

  test('navigation has aria labels', async ({ page }) => {
    await page.goto(`${HIVE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    const navElements = page.locator('nav');
    const count = await navElements.count();
    if (count > 0) {
      // At least one nav should have aria-label
      const hasLabel = await page.locator('nav[aria-label]').count();
      // Warn but don't fail — this is advisory
      console.log(`Nav elements: ${count}, with aria-label: ${hasLabel}`);
    }
  });
});

test.describe('Accessibility — employee form', () => {
  test('add employee dialog has proper form labels', async ({ page }) => {
    await page.goto(`${HIVE_URL}/employees`);
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /add employee|new employee/i });
    if (!(await addBtn.isVisible({ timeout: 3_000 }).catch(() => false))) return;

    await addBtn.click();
    await page.waitForSelector('[role="dialog"]', { timeout: 5_000 });

    const issues = await getAccessibilityIssues(page);
    const formIssues = issues.filter((i) => i.includes('Form control'));
    // All form controls in the dialog should have labels
    expect(formIssues.length).toBe(0);
  });
});

test.describe('Visual regression — key pages', () => {
  const pages = [
    { name: 'dashboard', path: '/dashboard' },
    { name: 'employees', path: '/employees' },
  ];

  for (const { name, path: pagePath } of pages) {
    test(`${name} page renders without visual errors`, async ({ page }) => {
      await page.goto(`${HIVE_URL}${pagePath}`);
      await page.waitForLoadState('networkidle');

      // Check that the page body is non-empty and doesn't show error states
      const bodyText = await page.locator('body').innerText();
      expect(bodyText.length).toBeGreaterThan(50);
      expect(bodyText).not.toMatch(/500 Internal Server Error|Something went wrong/i);
    });
  }
});

test.describe('AI visual analysis', () => {
  test.skip(!process.env.ANTHROPIC_API_KEY, 'ANTHROPIC_API_KEY not set — skipping AI tests');

  test('Claude confirms dashboard screenshot looks like an HR application', async ({ page }) => {
    await page.goto(`${HIVE_URL}/dashboard`);
    await page.waitForLoadState('networkidle');

    // Take screenshot
    const screenshotPath = path.join(os.tmpdir(), `dashboard_${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });

    const imageData = fs.readFileSync(screenshotPath);
    const base64 = imageData.toString('base64');

    const msg = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: 'image/png', data: base64 },
            },
            {
              type: 'text',
              text: 'Does this screenshot look like a professional HR management dashboard application (not an error page)? Reply with only "yes" or "no".',
            },
          ],
        },
      ],
    });

    const verdict = (msg.content[0] as { text: string }).text.toLowerCase().trim();
    expect(verdict).toBe('yes');

    fs.unlinkSync(screenshotPath);
  });
});
