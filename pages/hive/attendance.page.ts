import { Page, Locator } from '@playwright/test';
import { HIVE_URL } from '../../utils/constants';

export class AttendancePage {
  readonly heading: Locator;
  readonly markAttendanceBtn: Locator;
  readonly attendanceTable: Locator;
  readonly attendanceRows: Locator;
  readonly regulariseBtn: Locator;
  readonly summarySection: Locator;
  readonly dateFilter: Locator;
  readonly employeeFilter: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Attendance Management' });
    this.markAttendanceBtn = page.getByRole('button', { name: /mark|check in|check-in/i });
    this.attendanceTable = page.locator('table, [data-testid="attendance-table"]');
    this.attendanceRows = page.locator('table tbody tr, [data-testid="attendance-row"]');
    this.regulariseBtn = page.getByRole('button', { name: /regularise|regularize/i });
    this.summarySection = page.locator('[data-testid="attendance-summary"], .attendance-summary');
    // Attendance filters by Month/Year selects, not a single date input
    this.dateFilter = page.locator('select').first();
    this.employeeFilter = page.getByLabel(/employee/i);
  }

  async goto() {
    await this.page.goto(`${HIVE_URL}/attendance`);
    await this.page.waitForLoadState('networkidle');
  }

  async gotoMyAttendance() {
    await this.page.goto(`${HIVE_URL}/my/attendance`);
    await this.page.waitForLoadState('networkidle');
  }

  async markAttendance(employeeId: string, status: 'present' | 'absent' | 'half_day') {
    await this.markAttendanceBtn.click();
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5_000 });
    await this.page.getByLabel(/employee/i).fill(employeeId);
    await this.page.getByLabel(/status/i).selectOption(status);
    await this.page.getByRole('button', { name: /save|submit/i }).click();
  }

  async openRegulariseForm(recordId: string) {
    const row = this.page.locator(`[data-id="${recordId}"], tr`, { hasText: recordId }).first();
    await row.getByRole('button', { name: /regularise|regularize/i }).click();
    await this.page.waitForSelector('[role="dialog"]', { timeout: 5_000 });
  }

  async submitRegularisation(reason: string) {
    await this.page.getByLabel(/reason/i).fill(reason);
    await this.page.getByRole('button', { name: /submit|save/i }).click();
  }

  async filterByDate(date: string) {
    // Attendance page filters by month/year selects (e.g. "2026-05-07" → month=5, year=2026)
    const [year, month] = date.split('-').map(Number);
    const selects = this.page.locator('select');
    const count = await selects.count();
    if (count >= 2) {
      await selects.first().selectOption({ value: String(month) });
      await selects.nth(1).selectOption({ value: String(year) });
    }
    await this.page.waitForLoadState('networkidle');
  }
}
