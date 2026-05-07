/**
 * Thin wrappers around Playwright APIRequestContext for the Hive REST API.
 * All methods require a context that already carries valid auth cookies.
 */

import { APIRequestContext, expect } from '@playwright/test';
import { HIVE_URL } from '../utils/constants';

type Json = Record<string, unknown> | unknown[];

export class HiveApiHelper {
  constructor(private readonly req: APIRequestContext) {}

  // ── Employees ─────────────────────────────────────────────────────────────

  async createEmployee(data: Json) {
    // super_admin has no alt_eid cookie, so employerId must be explicit.
    // Auto-resolve from employer list when not provided.
    const payload = data as Record<string, unknown>;
    if (!payload.employerId) {
      const employerId = await this.resolveEmployerId();
      if (employerId) {
        return this.withRefreshRetry(
          () => this.req.post(`${HIVE_URL}/api/employee`, { data: { ...payload, employerId } }),
          'createEmployee',
        );
      }
    }
    return this.withRefreshRetry(() => this.req.post(`${HIVE_URL}/api/employee`, { data }), 'createEmployee');
  }

  async getEmployee(id: string) {
    return this.withRefreshRetry(() => this.req.get(`${HIVE_URL}/api/employee/${id}`), 'getEmployee');
  }

  async updateEmployee(id: string, data: Json) {
    return this.withRefreshRetry(() => this.req.put(`${HIVE_URL}/api/employee/${id}`, { data }), 'updateEmployee');
  }

  async deleteEmployee(id: string) {
    return this.withRefreshRetry(() => this.req.delete(`${HIVE_URL}/api/employee/${id}`), 'deleteEmployee');
  }

  async listEmployees(params?: Record<string, string>) {
    const url = new URL(`${HIVE_URL}/api/employee`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return this.withRefreshRetry(() => this.req.get(url.toString()), 'listEmployees');
  }

  // ── Attendance ────────────────────────────────────────────────────────────

  async createAttendance(data: Json) {
    return this.withRefreshRetry(() => this.req.post(`${HIVE_URL}/api/attendance`, { data }), 'createAttendance');
  }

  async regulariseAttendance(data: Json) {
    return this.withRefreshRetry(() => this.req.post(`${HIVE_URL}/api/attendance/regularise`, { data }), 'regulariseAttendance');
  }

  async getAttendanceSummary(params?: Record<string, string>) {
    const url = new URL(`${HIVE_URL}/api/attendance/summary`);
    if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return this.withRefreshRetry(() => this.req.get(url.toString()), 'getAttendanceSummary');
  }

  // ── Leave ─────────────────────────────────────────────────────────────────

  async createLeaveRequest(data: Json) {
    return this.withRefreshRetry(() => this.req.post(`${HIVE_URL}/api/leave`, { data }), 'createLeaveRequest');
  }

  async approveLeave(id: string, decision: 'approved' | 'rejected', note?: string) {
    return this.withRefreshRetry(
      () => this.req.put(`${HIVE_URL}/api/leave/${id}`, { data: { status: decision, note } }),
      'approveLeave',
    );
  }

  async getLeaveBalance(employeeId: string) {
    return this.withRefreshRetry(
      () => this.req.get(`${HIVE_URL}/api/leave/balance?employeeId=${employeeId}`),
      'getLeaveBalance',
    );
  }

  // ── Payroll ───────────────────────────────────────────────────────────────

  async createPayrollRun(data: Json) {
    return this.withRefreshRetry(() => this.req.post(`${HIVE_URL}/api/payroll-run`, { data }), 'createPayrollRun');
  }

  async approvePayrollRun(id: string) {
    return this.withRefreshRetry(() => this.req.post(`${HIVE_URL}/api/payroll-run/${id}/approve`), 'approvePayrollRun');
  }

  async releasePayrollRun(id: string) {
    return this.withRefreshRetry(() => this.req.post(`${HIVE_URL}/api/payroll-run/${id}/release`), 'releasePayrollRun');
  }

  // ── Expenses ──────────────────────────────────────────────────────────────

  async createExpense(data: Json) {
    return this.withRefreshRetry(() => this.req.post(`${HIVE_URL}/api/expenses`, { data }), 'createExpense');
  }

  async approveExpense(id: string, decision: 'approved' | 'rejected') {
    return this.withRefreshRetry(
      () => this.req.post(`${HIVE_URL}/api/expenses/approvals`, { data: { expenseId: id, decision } }),
      'approveExpense',
    );
  }

  // ── Shifts ────────────────────────────────────────────────────────────────

  async createShiftTemplate(data: Json) {
    return this.withRefreshRetry(() => this.req.post(`${HIVE_URL}/api/shifts/templates`, { data }), 'createShiftTemplate');
  }

  async assignShift(data: Json) {
    return this.withRefreshRetry(() => this.req.post(`${HIVE_URL}/api/shifts/assignments`, { data }), 'assignShift');
  }

  // ── Performance ───────────────────────────────────────────────────────────

  async createPerformanceCycle(data: Json) {
    return this.withRefreshRetry(() => this.req.post(`${HIVE_URL}/api/performance/cycles`, { data }), 'createPerformanceCycle');
  }

  async createGoal(data: Json) {
    return this.withRefreshRetry(() => this.req.post(`${HIVE_URL}/api/performance/goals`, { data }), 'createGoal');
  }

  // ── Recruitment ───────────────────────────────────────────────────────────

  async createJobPosting(data: Json) {
    const payload = data as Record<string, unknown>;
    if (!payload.employerId) {
      const employerId = await this.resolveEmployerId();
      if (employerId) {
        return this.withRefreshRetry(
          () => this.req.post(`${HIVE_URL}/api/recruitment/jobs`, { data: { ...payload, employerId } }),
          'createJobPosting',
        );
      }
    }
    return this.withRefreshRetry(() => this.req.post(`${HIVE_URL}/api/recruitment/jobs`, { data }), 'createJobPosting');
  }

  async createCandidate(data: Json) {
    return this.withRefreshRetry(() => this.req.post(`${HIVE_URL}/api/recruitment/candidates`, { data }), 'createCandidate');
  }

  // ── EWA ──────────────────────────────────────────────────────────────────

  async createEwaRequest(data: Json) {
    return this.withRefreshRetry(() => this.req.post(`${HIVE_URL}/api/ewa/requests`, { data }), 'createEwaRequest');
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────

  async getDashboardSummary() {
    return this.withRefreshRetry(() => this.req.get(`${HIVE_URL}/api/dashboard/summary`), 'getDashboardSummary');
  }

  // ── Health ────────────────────────────────────────────────────────────────

  async healthCheck() {
    const res = await this.req.get(`${HIVE_URL}/api/health`);
    return this.assertOk(res, 'healthCheck');
  }

  // ── Permissions ───────────────────────────────────────────────────────────

  async getMyPermissions() {
    return this.withRefreshRetry(() => this.req.get(`${HIVE_URL}/api/permissions/me`), 'getMyPermissions');
  }

  // ── Internal ─────────────────────────────────────────────────────────────

  /**
   * Resolves the first employer ID from GET /api/employer.
   * Needed for super_admin which has no alt_eid cookie.
   */
  private async resolveEmployerId(): Promise<string | undefined> {
    const res = await this.req.get(`${HIVE_URL}/api/employer`).catch(() => null);
    if (!res?.ok()) return undefined;
    const body = await res.json().catch(() => null) as Record<string, unknown> | null;
    if (!body) return undefined;
    const items = (Array.isArray(body) ? body : (body.data ?? body.items ?? [])) as Record<string, unknown>[];
    return items[0]?.id as string | undefined;
  }

  /**
   * Wraps a request with automatic token refresh on 401.
   * Playwright's APIRequestContext maintains a cookie jar, so the refresh
   * response's Set-Cookie will be stored and used in the retried request.
   */
  private async withRefreshRetry(
    requestFn: () => Promise<import('@playwright/test').APIResponse>,
    operation: string,
  ): Promise<unknown> {
    let res = await requestFn();

    if (res.status() === 401) {
      // Attempt silent token refresh
      const refreshRes = await this.req.post(`${HIVE_URL}/api/auth/refresh`).catch(() => null);
      if (refreshRes?.ok()) {
        // Cookie jar updated — retry original request
        res = await requestFn();
      }
    }

    return this.assertOk(res, operation);
  }

  private async assertOk(
    res: import('@playwright/test').APIResponse,
    operation: string,
  ): Promise<unknown> {
    if (!res.ok()) {
      const body = await res.text().catch(() => '');
      throw new Error(`[${operation}] API call failed: ${res.status()} ${body}`);
    }
    const body = await res.json().catch(() => null);
    // Unwrap mediatedRoute envelope: { data: <result> } → <result>
    if (body && typeof body === 'object' && !Array.isArray(body) && 'data' in (body as Record<string, unknown>)) {
      return (body as Record<string, unknown>).data;
    }
    return body;
  }
}
