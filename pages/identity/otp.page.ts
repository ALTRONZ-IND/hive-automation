import { Page, Locator } from '@playwright/test';
import { fillOtp } from '../../helpers/auth.helper';
import { getTestOtp, extractUserIdFromUrl } from '../../helpers/otp.helper';

export class OtpPage {
  readonly heading: Locator;
  readonly resendBtn: Locator;
  readonly errorMsg: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /otp|verify|verification/i });
    this.resendBtn = page.getByRole('button', { name: /resend/i });
    this.errorMsg = page.locator('[role="alert"], .error-message, [data-testid="error"]');
  }

  async waitForPage() {
    await this.page.waitForURL(/\/otp/, { timeout: 15_000 });
    await this.page.waitForLoadState('networkidle');
  }

  async fillAndSubmit(otp: string) {
    await fillOtp(this.page, otp);
  }

  /** Full helper: fetch OTP from dev endpoint and submit */
  async completeWithTestOtp() {
    const userId = extractUserIdFromUrl(this.page.url());
    const otp = await getTestOtp(this.page.request, userId);
    await this.fillAndSubmit(otp);
  }

  async submitWrongOtp() {
    await this.fillAndSubmit('000000');
  }

  async resendOtp() {
    await this.resendBtn.click();
  }

  async getErrorMessage(): Promise<string> {
    await this.errorMsg.waitFor({ state: 'visible', timeout: 5_000 });
    return this.errorMsg.innerText();
  }
}
