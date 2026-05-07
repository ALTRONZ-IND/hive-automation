# Hive Automation

End-to-end test suite for the **Hive** HR application and **Altronz Identity** auth service.

Built with Playwright + TypeScript. Covers:
- UI testing (all 10 roles)
- API testing (179 endpoints)
- Data integrity & encryption tests
- AI-assisted form testing (Claude API)

---

## Prerequisites

| Requirement | Notes |
|-------------|-------|
| Node.js ≥ 20 | |
| Running Hive app | `http://localhost:3001` |
| Running Altronz Identity | `http://localhost:3000` |
| Database initialised | `docker-compose up` in `altronz-db/` (seeds all test users automatically) |

### Test users (from altronz-db seed data)

All users share the password **`Test@1234`**.

| Role | Email |
|------|-------|
| super_admin | superadmin@altronz.com |
| admin | admin@altronz.com |
| employer | rajesh.sharma@techcorp.in |
| hr_admin | priya.nair@techcorp.in |
| payroll_admin | deepak.mehta@techcorp.in |
| finance_admin | meena.iyer@techcorp.in |
| manager | karthik.raj@techcorp.in |
| employee | ravi.kumar@techcorp.in |
| auditor | vijay.lakshmi@techcorp.in |
| recruiter | suresh.babu@techcorp.in |

---

## Setup

### 1. Install dependencies

```bash
cd hive-automation
npm install
npx playwright install --with-deps
```

### 2. Configure environment

```bash
cp .env.example .env
# Values already match the altronz-db seed data — no edits needed for local dev
```

### 3. Run tests

```bash
npm test
```

The first run executes `global-setup.ts` which logs in as all 10 roles and caches auth cookies to `.auth/`. Subsequent runs skip the login step and are much faster.

---

## Running Tests

```bash
# All tests
npm test

# By category
npm run test:auth       # Login, OTP bypass, lockout, token refresh
npm run test:roles      # RBAC — all 10 roles
npm run test:ui         # All feature UI tests
npm run test:api        # API contract tests (no browser)
npm run test:data       # Encryption + audit trail + integrity
npm run test:ai         # AI-assisted tests (requires ANTHROPIC_API_KEY)

# By role
npm run test:role:super-admin
npm run test:role:hr-admin
npm run test:role:payroll-admin
npm run test:role:finance-admin
npm run test:role:manager
npm run test:role:employee
npm run test:role:auditor
npm run test:role:recruiter

# Debug a specific test
npm run test:debug -- tests/ui/employees/employee-crud.spec.ts

# View HTML report
npm run test:report
```

---

## Project Structure

```
hive-automation/
├── playwright.config.ts        # Projects per role + category
├── global-setup.ts             # Pre-generates auth states for all roles
├── .env.example                # Pre-filled with altronz-db seed credentials
│
├── utils/
│   ├── constants.ts            # URLs, roles, test users, accessible/forbidden pages
│   └── test-data.ts            # Test data factories (unique per call)
│
├── helpers/
│   ├── auth.helper.ts          # Login flow (identity → hive, OTP skipped in dev)
│   ├── otp.helper.ts           # Fetches OTP from dev endpoint (fallback)
│   └── api.helper.ts           # HiveApiHelper — typed API wrappers
│
├── fixtures/
│   └── index.ts                # Extended test fixture with HiveApiHelper
│
├── pages/                      # Page Object Models
│   ├── identity/
│   │   ├── login.page.ts
│   │   └── otp.page.ts
│   └── hive/
│       ├── dashboard.page.ts
│       ├── employees.page.ts
│       ├── attendance.page.ts
│       ├── leave.page.ts
│       └── payroll.page.ts
│
└── tests/
    ├── auth/                   # Login, OTP bypass, lockout, token refresh
    ├── roles/                  # RBAC tests for all 10 roles
    ├── ui/                     # Feature-by-feature UI tests
    │   ├── dashboard/
    │   ├── employees/
    │   ├── attendance/
    │   ├── leave/
    │   ├── payroll/
    │   ├── finance/
    │   ├── benefits/
    │   ├── shifts/
    │   ├── performance/
    │   ├── recruitment/
    │   ├── expenses/
    │   ├── ewa/
    │   ├── reports/
    │   └── settings/
    ├── api/                    # Pure API contract tests
    ├── data/                   # Encryption, audit trail, integrity
    └── ai/                     # Claude API-powered tests
```

---

## Architecture Decisions

### Auth state caching
`global-setup.ts` logs in as all 10 roles once and saves browser storage state (cookies) to `.auth/<role>.json`. Individual tests load this state, skipping the full login flow — makes the suite ~10× faster.

### Dev login bypass
`altronz-identity` skips OTP when `NODE_ENV=development`. The login page detects `redirectUri` in the API response and redirects immediately — no OTP page interaction needed during tests.

### Page Object Model
All UI interactions go through POM classes in `pages/`. Tests import the POM, not raw Playwright locators. Centralises selector maintenance.

### Role-specific Playwright projects
`playwright.config.ts` defines one project per role. Each has `storageState` pre-loaded. `npm run test:role:hr-admin` runs only tests scoped to that role.

### AI testing (optional)
Tests in `tests/ai/` use `claude-haiku-4-5-20251001` for:
- Generating diverse form test data
- Semantically validating error messages
- Visual screenshot analysis and accessibility audits

Skipped automatically if `ANTHROPIC_API_KEY` is not set.

---

## CI Integration

```yaml
- name: Install Node
  uses: actions/setup-node@v4
  with: { node-version: '20' }

- name: Install Playwright
  run: |
    cd hive-automation
    npm ci
    npx playwright install --with-deps chromium

- name: Run tests
  run: cd hive-automation && npm run test:ci
  env:
    IDENTITY_URL: http://localhost:3000
    HIVE_URL: http://localhost:3001
    # Credentials match altronz-db seed data — commit them as non-secret in CI
    SUPER_ADMIN_EMAIL: superadmin@altronz.com
    SUPER_ADMIN_PASSWORD: Test@1234

- name: Upload report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: hive-automation/playwright-report/
```
