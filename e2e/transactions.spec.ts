import type { Page } from '@playwright/test';
import { test, expect, field, uniqueName } from './fixtures';

// The page header's trigger and the modal's submit share the label "Add
// Transaction", so the submit is always scoped to the open form.
function submit(page: Page, name: string) {
  return page.locator('form').getByRole('button', { name, exact: true });
}

async function addPocket(
  page: Page,
  name: string,
  type: string,
  startingBalance: string,
) {
  await page.goto('/pockets');
  await page.getByRole('button', { name: 'New pocket' }).click();
  await field(page, 'type').selectOption(type);
  await field(page, 'name').fill(name);
  await field(page, 'openingBalance').fill(startingBalance);
  await submit(page, 'Add pocket').click();
  await expect(
    page.getByTestId('pocket-card').filter({ hasText: name }),
  ).toBeVisible({ timeout: 15_000 });
}

async function addExpense(
  page: Page,
  opts: { name: string; category: string; amount: string; pocket: string },
) {
  await page.goto('/transactions');
  await page
    .getByRole('button', { name: 'Add Transaction' })
    .first()
    .click();
  await field(page, 'name').fill(opts.name);
  await field(page, 'category').selectOption(opts.category);
  await field(page, 'amount').fill(opts.amount);
  // The option's label is "<name> — <type> · <issuer>", so match on the name
  // and select by the value that carries it.
  const pocketValue = await page
    .locator('select[name="pocketId"] option', { hasText: opts.pocket })
    .first()
    .getAttribute('value');
  await field(page, 'pocketId').selectOption(pocketValue);
  await submit(page, 'Add Transaction').click();
}

test.describe('transaction details', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/transactions');
  });

  test('opens a transaction and shows what it was, when, and its pocket', async ({
    page,
  }) => {
    const row = page.getByTestId('transaction-row').first();
    await expect(row).toBeVisible();
    const name = (await row.locator('p').first().textContent())?.trim() ?? '';

    await row.getByRole('button', { name: /^View / }).click();

    await expect(
      page.getByRole('heading', { name: 'Transaction', exact: true }),
    ).toBeVisible();
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
    for (const label of ['Type', 'Category', 'Date']) {
      await expect(page.getByText(label, { exact: true })).toBeVisible();
    }

    // Either it names the pocket it moved through, or it says plainly that it
    // has none — the state a deleted pocket leaves behind.
    await expect(
      page.getByText(/Paid from|Received into|No pocket\./).first(),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Close modal' }).click();
    await expect(
      page.getByRole('heading', { name: 'Transaction', exact: true }),
    ).toHaveCount(0);
  });
});

test.describe('spending from a pocket', () => {
  test.beforeEach(async ({ session }) => {
    test.skip(!session.signedIn, 'adding a transaction needs a real session');
    test.skip(
      session.demoPlan,
      'the demo account is seeded to its 3-transaction cap',
    );
  });

  test('records an expense against a pocket and moves its balance', async ({
    page,
  }) => {
    const pocketName = uniqueName('Flazz');
    const expense = uniqueName('Kopi');

    await addPocket(page, pocketName, 'emoney', '100000');
    await addExpense(page, {
      name: expense,
      category: 'Food & Drink',
      amount: '25000',
      pocket: pocketName,
    });

    // The row names the pocket that paid.
    const row = page.getByTestId('transaction-row').filter({ hasText: expense });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.getByText(new RegExp(pocketName))).toBeVisible();

    // 100.000 opening - 25.000 spent = 75.000 left.
    await page.goto('/pockets');
    const pocket = page
      .getByTestId('pocket-card')
      .filter({ hasText: pocketName });
    await expect(pocket.getByText(/75\.000/).first()).toBeVisible();
    await expect(pocket.getByText(/1 transaction\b/)).toBeVisible();
  });

  test('the budget counts the spend whichever pocket paid', async ({
    page,
  }) => {
    const pocketName = uniqueName('Tunai');
    const expense = uniqueName('Makan');
    const category = 'Health'; // Unseeded, so the spent figure starts at zero.

    await addPocket(page, pocketName, 'cash', '500000');

    await page.goto('/budgets');
    await page
      .getByRole('button', { name: /New Budget|Create a budget/ })
      .first()
      .click();
    await field(page, 'category').fill(category);
    await field(page, 'total').fill('400000');
    await submit(page, 'Add Budget').click();
    await expect(page.getByText(`${category}`).first()).toBeVisible({
      timeout: 15_000,
    });

    await addExpense(page, {
      name: expense,
      category,
      amount: '30000',
      pocket: pocketName,
    });
    await expect(
      page.getByTestId('transaction-row').filter({ hasText: expense }),
    ).toBeVisible({ timeout: 15_000 });

    // Budgets ignore pockets: the spend counts even though a pocket paid.
    await page.goto('/budgets');
    await expect(page.getByText(/30\.000 spent/).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
