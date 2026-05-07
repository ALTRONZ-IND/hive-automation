import { test, expect } from '../../../fixtures/index';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

test.describe('Bulk employee import', () => {
  // CSV headers must match BulkImportModal's REQUIRED_HEADERS: fullName, email
  const csvContent = `fullName,email,phoneNumber,employeeNumber
Import_Test_A Employee,import_a_${Date.now()}@hive.test,9876543210,
Import_Test_B Employee,import_b_${Date.now()}@hive.test,9876543211,`;

  let csvPath: string;

  test.beforeAll(() => {
    csvPath = path.join(os.tmpdir(), `hive_import_${Date.now()}.csv`);
    fs.writeFileSync(csvPath, csvContent);
  });

  test.afterAll(() => {
    if (fs.existsSync(csvPath)) fs.unlinkSync(csvPath);
  });

  test('bulk import dialog opens', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const importBtn = page.getByRole('button', { name: /import|bulk/i });
    await importBtn.click();

    await expect(page.locator('[role="dialog"]')).toBeVisible({ timeout: 5_000 });
  });

  test('uploads valid CSV without errors', async ({ page }) => {
    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const importBtn = page.getByRole('button', { name: /import|bulk/i });
    await importBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    const fileInput = dialog.locator('input[type="file"]');
    await fileInput.setInputFiles(csvPath);

    // Wait for CSV to be parsed and Import button to appear
    const submitBtn = dialog.getByRole('button', { name: /^import\s+\d+/i });
    await submitBtn.waitFor({ timeout: 5_000 });
    await submitBtn.click();

    // On success the dialog closes (parent calls onSuccess → setShowBulkImport(false))
    await dialog.waitFor({ state: 'hidden', timeout: 15_000 });
  });

  test('shows error for invalid CSV format', async ({ page }) => {
    const badCsvPath = path.join(os.tmpdir(), `bad_import_${Date.now()}.csv`);
    fs.writeFileSync(badCsvPath, 'invalid,csv,without,required,columns\n1,2,3,4,5');

    await page.goto('/employees');
    await page.waitForLoadState('networkidle');

    const importBtn = page.getByRole('button', { name: /import|bulk/i });
    await importBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5_000 });

    const fileInput = dialog.locator('input[type="file"]');
    await fileInput.setInputFiles(badCsvPath);

    // Error for missing required headers appears inline in the red banner
    // Use the specific error message text from BulkImportModal
    const errorBanner = dialog.locator('.bg-red-50, [class*="red"]').first();
    await expect(errorBanner).toBeVisible({ timeout: 10_000 });

    fs.unlinkSync(badCsvPath);
  });
});
