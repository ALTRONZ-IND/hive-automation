import { Page, Locator } from '@playwright/test';
import { HIVE_URL } from '../../utils/constants';

export class DashboardPage {
  readonly heading: Locator;
  readonly navLinks: Locator;
  readonly attendanceWidget: Locator;
  readonly payrollWidget: Locator;
  readonly leaveWidget: Locator;
  readonly notificationsIcon: Locator;
  readonly userMenu: Locator;
  readonly logoutBtn: Locator;

  constructor(private readonly page: Page) {
    // Each role renders a different heading (e.g. "Admin Portal", "Finance Dashboard",
    // "Welcome back, ...", "Payroll Admin Dashboard", "Recruitment & Onboarding", etc.).
    this.heading = page.getByRole('heading', {
      name: /dashboard|portal|admin|finance|payroll|recruitment|hr|attendance|leave|shift|benefits|performance|expense|ewa|report|employee|management|welcome/i,
    }).first();
    // Sidebar renders <button> elements (onClick navigation), not <a> tags
    this.navLinks = page.locator('nav button, nav a, [data-testid="nav-link"]');
    this.attendanceWidget = page.locator('[data-testid="attendance-widget"], .attendance-stats');
    this.payrollWidget = page.locator('[data-testid="payroll-widget"], .payroll-stats');
    this.leaveWidget = page.locator('[data-testid="leave-widget"], .leave-stats');
    this.notificationsIcon = page.locator('[data-testid="notifications"], [aria-label*="notification"]');
    this.userMenu = page.locator('[data-testid="user-menu"], [aria-label*="user menu"]');
    this.logoutBtn = page.getByRole('button', { name: /logout|sign out/i });
  }

  async goto() {
    await this.page.goto(`${HIVE_URL}/dashboard`);
    await this.page.waitForLoadState('networkidle');
  }

  async isLoaded(): Promise<boolean> {
    return this.page.url().includes('/dashboard');
  }

  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  async logout() {
    await this.userMenu.click();
    await this.logoutBtn.click();
    await this.page.waitForURL(/localhost:3000/, { timeout: 15_000 });
  }

  async navigateTo(section: string) {
    await this.page.goto(`${HIVE_URL}/${section}`);
    await this.page.waitForLoadState('networkidle');
  }

  async getNavLinkTexts(): Promise<string[]> {
    return this.navLinks.allInnerTexts();
  }
}
