import type { Page } from '@playwright/test';
import { test, expect, field, uniqueName } from './fixtures';

// Pocket CRUD. Creating pockets fits inside the demo plan's cap (3, none
// seeded), so these run on the demo account too — only writes that need a
// *transaction* are out of reach there.

async function addPocket(
  page: Page,
  name: string,
  opts: { type?: string; issuer?: string; startingBalance?: string } = {},
) {
  await page.getByRole('button', { name: 'New pocket' }).click();
  if (opts.type) await field(page, 'type').selectOption(opts.type);
  await field(page, 'name').fill(name);
  if (opts.issuer) await field(page, 'issuer').fill(opts.issuer);
  if (opts.startingBalance) {
    await field(page, 'openingBalance').fill(opts.startingBalance);
  }
  await page.getByRole('button', { name: 'Add pocket' }).click();
}

function card(page: Page, name: string) {
  return page.getByTestId('pocket-card').filter({ hasText: name });
}

test.describe('pockets', () => {
  test.beforeEach(async ({ page, session }) => {
    test.skip(!session.signedIn, 'writing pockets needs a real session');
    await page.goto('/pockets');
  });

  test('creates an e-money pocket with a starting balance', async ({
    page,
  }) => {
    const name = uniqueName('Flazz');

    await addPocket(page, name, {
      type: 'emoney',
      issuer: 'BCA Flazz',
      startingBalance: '250000',
    });

    const pocket = card(page, name);
    await expect(pocket).toBeVisible({ timeout: 15_000 });
    await expect(pocket.getByText(/E-money · BCA Flazz/)).toBeVisible();
    // Nothing has moved through it yet, so the balance is what it opened with.
    await expect(pocket.getByText(/250\.000/).first()).toBeVisible();
    await expect(pocket.getByText(/0 transactions/)).toBeVisible();
  });

  test('renames a pocket', async ({ page }) => {
    const name = uniqueName('Cash');
    const renamed = `${name} renamed`;

    await addPocket(page, name, { type: 'cash' });
    await expect(card(page, name)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: `Edit ${name}` }).click();
    await field(page, 'name').fill(renamed);
    await page.getByRole('button', { name: 'Save changes' }).click();

    await expect(card(page, renamed)).toBeVisible({ timeout: 15_000 });
  });

  test('deletes an empty pocket without asking where its money goes', async ({
    page,
  }) => {
    const name = uniqueName('Throwaway');

    await addPocket(page, name);
    await expect(card(page, name)).toBeVisible({ timeout: 15_000 });

    await page.getByRole('button', { name: `Delete ${name}` }).click();
    await expect(page.getByText('It has no transactions.')).toBeVisible();
    // Nothing to reassign, so the dialog doesn't offer a pointless choice.
    await expect(page.getByLabel('Its transactions')).toHaveCount(0);
    await page.getByRole('button', { name: 'Delete', exact: true }).click();

    await expect(card(page, name)).toHaveCount(0, { timeout: 15_000 });
  });

  test('refuses a duplicate pocket name', async ({ page }) => {
    const name = uniqueName('Dompet');

    await addPocket(page, name);
    await expect(card(page, name)).toBeVisible({ timeout: 15_000 });

    await addPocket(page, name);
    await expect(
      page.getByText(`You already have a pocket called "${name}"`),
    ).toBeVisible();
  });
});
