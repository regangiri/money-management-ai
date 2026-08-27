import { test, expect } from './fixtures';

// Every page renders and is reachable. Runs in all three setups (registered,
// demo, mock) because none of it writes anything.
test.describe('navigation', () => {
  test('dashboard renders for a signed-in visitor', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /good (morning|afternoon|evening)/i }),
    ).toBeVisible();
  });

  const pages = [
    { path: '/transactions', heading: 'Transactions' },
    { path: '/budgets', heading: 'Budgets' },
    { path: '/pockets', heading: 'Pockets' },
    { path: '/goals', heading: 'Goals' },
    { path: '/reports', heading: /reports?/i },
    { path: '/activity', heading: 'Activity' },
  ];

  for (const { path, heading } of pages) {
    test(`${path} renders its page`, async ({ page }) => {
      await page.goto(path);
      await expect(
        page.getByRole('heading', { name: heading }).first(),
      ).toBeVisible();
    });
  }

  test('reaches Pockets through the navigation', async ({ page }) => {
    const width = page.viewportSize()?.width ?? 1280;

    if (width < 640) {
      // Mobile: Pockets lives behind the bottom bar's "More" sheet.
      await page.getByRole('button', { name: 'More' }).click();
      await page.getByRole('link', { name: 'Pockets' }).click();
    } else {
      await page
        .getByRole('navigation')
        .getByRole('link', { name: 'Pockets' })
        .click();
    }

    await page.waitForURL('**/pockets');
    await expect(page.getByRole('heading', { name: 'Pockets' })).toBeVisible();
  });

  test('protected pages send signed-out visitors to the login screen', async ({
    page,
    context,
    session,
  }) => {
    test.skip(!session.signedIn, 'no auth to enforce without Supabase');

    await context.clearCookies();
    await page.goto('/pockets');
    await expect(page).toHaveURL(/\/login/);
  });
});
