import { Page, Locator } from '@playwright/test';
import { HIVE_URL } from '../../utils/constants';

export class PayrollPage {
  readonly heading: Locator;
  readonly createRunBtn: Locator;
  readonly payrollTable: Locator;
  readonly payrollRows: Locator;
  readonly approveBtn: Locator;
  readonly releaseBtn: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Payroll Management' }).or(page.getByRole('heading', { name: /payroll/i }).first());
    this.createRunBtn = page.getByRole('button', { name: /create run|new run|run payroll/i });
    this.payrollTable = page.locator('table, [data-testid="payroll-table"]');
    this.payrollRows = page.locator('table tbody tr, [data-testid="payroll-row"]');
    this.approveBtn = page.getByRole('button', { name: /approve/i });
    this.releaseBtn = page.getByRole('button', { name: /release/i });
  }

  async goto() {
    await this.page.goto(`${HIVE_URL}/payroll`);
    await this.page.waitForLoadState('networkidle');
  }

  async gotoPayslips() {
    await this.page.goto(`${HIVE_URL}/payslips`);
    await this.page.waitForLoadState('networkidle');
  }

  async createPayrollRun(data: { period: string; month: string; year: string }) {
    await this.createRunBtn.click();
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5_000 });
    await this.page.getByLabel(/period/i).fill(data.period);
    await this.page.getByLabel(/month/i).selectOption(data.month);
    await this.page.getByLabel(/year/i).fill(data.year);
    await this.page.getByRole('button', { name: /create|save/i }).click();
  }

  async approvePayrollRun(runId: string) {
    const row = this.page.locator(`[data-id="${runId}"], tr`, { hasText: runId }).first();
    await row.getByRole('button', { name: /approve/i }).click();
    await this.page.getByRole('button', { name: /confirm/i }).click();
  }

  async releasePayrollRun(runId: string) {
    const row = this.page.locator(`[data-id="${runId}"], tr`, { hasText: runId }).first();
    await row.getByRole('button', { name: /release/i }).click();
    await this.page.getByRole('button', { name: /confirm/i }).click();
  }

  async viewPayslip(employeeId: string) {
    await this.page.goto(`${HIVE_URL}/payslips?employeeId=${employeeId}`);
    await this.page.waitForLoadState('networkidle');
  }
}
