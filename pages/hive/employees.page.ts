import { Page, Locator } from '@playwright/test';
import { HIVE_URL } from '../../utils/constants';

export class EmployeesPage {
  readonly heading: Locator;
  readonly addEmployeeBtn: Locator;
  readonly searchInput: Locator;
  readonly employeeTable: Locator;
  readonly employeeRows: Locator;
  readonly bulkImportBtn: Locator;
  readonly filterBtn: Locator;
  readonly exportBtn: Locator;

  constructor(private readonly page: Page) {
    // The employees page renders "Employee Management" as its h1
    this.heading = page.getByRole('heading', { name: 'Employee Management' });
    this.addEmployeeBtn = page.getByRole('button', { name: /add employee|new employee/i });
    this.searchInput = page.getByPlaceholder(/search/i);
    this.employeeTable = page.locator('table, [data-testid="employee-table"]');
    this.employeeRows = page.locator('table tbody tr, [data-testid="employee-row"]');
    this.bulkImportBtn = page.getByRole('button', { name: /import|bulk/i });
    this.filterBtn = page.getByRole('button', { name: /filter/i });
    this.exportBtn = page.getByRole('button', { name: /export/i }).first();
  }

  async goto() {
    await this.page.goto(`${HIVE_URL}/employees`);
    await this.page.waitForLoadState('networkidle');
  }

  async openAddEmployeeForm() {
    await this.addEmployeeBtn.click();
    await this.page.waitForSelector('[role="dialog"], form', { timeout: 5_000 });
  }

  async fillEmployeeForm(data: {
    fullName?: string;
    /** @deprecated use fullName */
    firstName?: string;
    /** @deprecated use fullName */
    lastName?: string;
    email: string;
    phoneNumber?: string;
    /** @deprecated use phoneNumber */
    phone?: string;
    designation?: string;
    department?: string;
    joiningDate?: string;
  }) {
    const name = data.fullName ?? [data.firstName, data.lastName].filter(Boolean).join(' ');
    const phone = data.phoneNumber ?? data.phone ?? '';

    // AddEmployeeWizard uses a combined "Full Name" field, not separate first/last
    const fullNameInput = this.page.getByLabel(/full name/i);
    if (await fullNameInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await fullNameInput.fill(name);
    } else {
      const firstNameInput = this.page.getByLabel(/first name/i);
      if (await firstNameInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
        const parts = name.split(' ');
        await firstNameInput.fill(parts[0] ?? name);
        await this.page.getByLabel(/last name/i).fill(parts.slice(1).join(' ') || 'Employee');
      }
    }
    await this.page.getByLabel(/work email|email/i).first().fill(data.email);
    if (phone) {
      const phoneInput = this.page.getByLabel(/phone/i);
      if (await phoneInput.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await phoneInput.fill(phone);
      }
    }
    if (data.designation) {
      const desig = this.page.getByLabel(/designation/i);
      if (await desig.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await desig.fill(data.designation);
      }
    }
    if (data.department) {
      const dept = this.page.getByLabel(/department/i);
      if (await dept.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await dept.fill(data.department);
      }
    }
    if (data.joiningDate) {
      const joining = this.page.getByLabel(/joining date/i);
      if (await joining.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await joining.fill(data.joiningDate);
      }
    }
  }

  async submitEmployeeForm() {
    // The AddEmployeeWizard has 5 steps — click Next through steps 1-4,
    // then click "Create Employee" on step 5.
    // Field components use useId() + htmlFor, so getByLabel() works.
    for (let step = 0; step < 7; step++) {
      const createBtn = this.page.getByRole('button', { name: /create employee/i });
      if (await createBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await createBtn.click();
        return;
      }

      // Step 2: Employment Type, Joining Date, Designation
      const employmentTypeSelect = this.page.getByLabel(/^employment type/i);
      if (await employmentTypeSelect.isVisible({ timeout: 500 }).catch(() => false)) {
        const val = await employmentTypeSelect.inputValue().catch(() => '');
        if (!val) await employmentTypeSelect.selectOption('Full-Time').catch(() => null);
      }

      const joiningDateInput = this.page.getByLabel(/date of joining/i);
      if (await joiningDateInput.isVisible({ timeout: 500 }).catch(() => false)) {
        const val = await joiningDateInput.inputValue().catch(() => '');
        if (!val) await joiningDateInput.fill('2024-01-15').catch(() => null);
      }

      const designationInput = this.page.getByLabel(/^designation/i);
      if (await designationInput.isVisible({ timeout: 500 }).catch(() => false)) {
        const val = await designationInput.inputValue().catch(() => '');
        if (!val) await designationInput.fill('Software Engineer').catch(() => null);
      }

      // Step 3: Annual CTC — use placeholder to find the number input uniquely
      const ctcInput = this.page.getByPlaceholder(/e\.g\. 600000/i);
      if (await ctcInput.isVisible({ timeout: 500 }).catch(() => false)) {
        const val = await ctcInput.inputValue().catch(() => '');
        if (!val) await ctcInput.fill('500000').catch(() => null);
      }

      const nextBtn = this.page.getByRole('button', { name: /^next$/i });
      if (await nextBtn.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await nextBtn.click();
        await this.page.waitForTimeout(600);
      } else {
        break;
      }
    }
  }

  async searchEmployee(name: string) {
    await this.searchInput.fill(name);
    await this.page.waitForTimeout(500); // debounce
  }

  async getEmployeeCount(): Promise<number> {
    return this.employeeRows.count();
  }

  async clickEmployee(name: string) {
    await this.page.getByRole('link', { name: new RegExp(name, 'i') }).first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async deleteEmployee(name: string) {
    const row = this.page.locator('tr', { hasText: name });
    await row.getByRole('button', { name: /delete|remove/i }).click();
    await this.page.getByRole('button', { name: /confirm|yes/i }).click();
  }
}
