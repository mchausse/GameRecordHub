import { expect, test } from '@playwright/test';

const qaEmail = process.env['QA_E2E_EMAIL'];
const qaPassword = process.env['QA_E2E_PASSWORD'];

test('deployed application is the QA build', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByText('QA sign-in', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign in to QA' })).toBeVisible();
  await expect(page.locator('form.qa-login')).toBeVisible();
});

test('QA authenticated score entry persists to the QA database', async ({ page }) => {
  test.skip(!qaEmail || !qaPassword, 'Set QA_E2E_EMAIL and QA_E2E_PASSWORD to test persistence.');
  const runId = Date.now();
  const winnerName = `QA Player ${runId}`;

  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(qaEmail!);
  await page.getByLabel('Password', { exact: true }).fill(qaPassword!);
  await page.getByRole('button', { name: 'Sign in to QA' }).click();
  await expect(page).toHaveURL(/\/games$/);

  await page.goto('/games/sea-salt-paper');
  await page.getByLabel('Player 1', { exact: true }).fill(winnerName);
  await page.getByLabel('Player 2', { exact: true }).fill(`QA Opponent ${runId}`);
  const roundInputs = page.locator('.score-sheet tbody input');
  await roundInputs.nth(0).fill('40');
  await roundInputs.nth(1).fill('0');
  await page.getByRole('button', { name: 'Complete & save game' }).click();

  await expect(page).toHaveURL(/\/history$/);
  await expect(page.locator('.history-list')).toContainText(winnerName);
});
