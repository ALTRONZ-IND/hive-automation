import { Page, Locator } from '@playwright/test';
import { IDENTITY_URL } from '../../utils/constants';

export class LoginPage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitBtn: Locator;
  readonly errorMsg: Locator;
  readonly forgotPasswordLink: Locator;
  readonly registerLink: Locator;

  constructor(private readonly page: Page) {
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitBtn = page.getByRole('button', { name: /login|sign in/i });
    // Identity login shows errors in a bg-red-50 div (no role="alert").
    // Keep generic selectors as fallback for other contexts.
    this.errorMsg = page.locator('div.bg-red-50, [role="alert"], .error-message, [data-testid="error"]');
    this.forgotPasswordLink = page.getByRole('link', { name: /forgot/i });
    this.registerLink = page.getByRole('link', { name: /register|sign up/i });
  }

  async goto() {
    await this.page.goto(`${IDENTITY_URL}/login`);
    // Use domcontentloaded instead of networkidle to avoid timeout in Firefox
    // (Firefox may have long-lived connections that prevent networkidle)
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for submit button to be visible to ensure page rendered
    await this.page.getByRole('button', { name: /login|sign in/i }).waitFor({ timeout: 10_000 }).catch(() => null);
  }

  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.submitBtn.click();
  }

  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.submit();
  }

  async getErrorMessage(): Promise<string> {
    // Filter to only elements that have visible, non-empty text
    const nonEmpty = this.errorMsg.filter({ hasText: /\S/ });
    await nonEmpty.first().waitFor({ state: 'visible', timeout: 5_000 });
    return nonEmpty.first().innerText();
  }

  async isLockoutMessageVisible(): Promise<boolean> {
    return this.page
      .getByText(/locked|too many attempts|try again/i)
      .isVisible({ timeout: 3_000 })
      .catch(() => false);
  }
}
