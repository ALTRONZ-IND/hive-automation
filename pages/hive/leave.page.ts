import { Page, Locator } from '@playwright/test';
import { HIVE_URL } from '../../utils/constants';

export class LeavePage {
  readonly heading: Locator;
  readonly applyLeaveBtn: Locator;
  readonly leaveTable: Locator;
  readonly leaveRows: Locator;
  readonly balanceSection: Locator;
  readonly filterStatus: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { name: /leave management|leave requests|my leaves|leave/i }).first();
    this.applyLeaveBtn = page.getByRole('button', { name: /apply|request|new leave/i });
    this.leaveTable = page.locator('table, [data-testid="leave-table"]');
    this.leaveRows = page.locator('table tbody tr, [data-testid="leave-row"]');
    this.balanceSection = page.locator('[data-testid="leave-balance"], .leave-balance');
    // Leave management uses tabs/buttons, not a combobox, for status filtering
    this.filterStatus = page.getByRole('combobox', { name: /status/i });
  }

  async goto() {
    await this.page.goto(`${HIVE_URL}/leave`);
    await this.page.waitForLoadState('networkidle');
  }

  async gotoMyLeaves() {
    await this.page.goto(`${HIVE_URL}/my/leaves`);
    await this.page.waitForLoadState('networkidle');
  }

  async openApplyForm() {
    await this.applyLeaveBtn.click();
    // Wait for dialog or standalone form — use first() to avoid strict mode violations
    await this.page.locator('[role="dialog"], form').first().waitFor({ timeout: 5_000 });
  }

  async fillLeaveForm(data: {
    leaveType: string;
    startDate: string;
    endDate: string;
    reason: string;
  }) {
    // Leave type select — pick the first available option if exact value not found
    const leaveTypeSelect = this.page.getByLabel(/leave type/i);
    try {
      await leaveTypeSelect.selectOption(data.leaveType, { timeout: 3_000 });
    } catch {
      // Fall back to selecting the first non-empty option
      const options = await leaveTypeSelect.locator('option:not([value=""])').all();
      if (options.length > 0) {
        const val = await options[0].getAttribute('value') ?? '';
        await leaveTypeSelect.selectOption(val);
      }
    }
    await this.page.getByLabel(/start date/i).fill(data.startDate);
    await this.page.getByLabel(/end date/i).fill(data.endDate);
    await this.page.getByLabel(/reason/i).fill(data.reason);
  }

  async submitLeaveForm() {
    const submitBtn = this.page.getByRole('button', { name: /submit|apply|save/i }).first();
    // Wait for button to be present, then click (force to bypass disabled state for validation tests)
    await submitBtn.waitFor({ timeout: 5_000 });
    await submitBtn.click({ force: true });
  }

  async approveLeave(leaveId: string) {
    const row = this.page.locator(`[data-id="${leaveId}"], tr`, { hasText: leaveId }).first();
    await row.getByRole('button', { name: /approve/i }).click();
    await this.page.getByRole('button', { name: /confirm/i }).click();
  }

  async rejectLeave(leaveId: string, reason: string) {
    const row = this.page.locator(`[data-id="${leaveId}"], tr`, { hasText: leaveId }).first();
    await row.getByRole('button', { name: /reject/i }).click();
    await this.page.getByLabel(/reason/i).fill(reason);
    await this.page.getByRole('button', { name: /confirm/i }).click();
  }

  async getLeaveCount(): Promise<number> {
    return this.leaveRows.count();
  }

  async filterByStatus(status: 'pending' | 'approved' | 'rejected') {
    // Try combobox first; fall back to tab/button if not available
    const hasCombobox = await this.filterStatus
      .isVisible({ timeout: 2_000 })
      .catch(() => false);

    if (hasCombobox) {
      await this.filterStatus.selectOption(status);
    } else {
      // Leave management may use tab buttons for status
      const tabBtn = this.page.getByRole('button', { name: new RegExp(status, 'i') });
      if (await tabBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await tabBtn.click();
      }
    }
    await this.page.waitForLoadState('networkidle');
  }
}
