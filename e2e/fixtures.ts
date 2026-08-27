import { test as base, expect, type Page } from '@playwright/test';

// How the suite got into the app. The same specs run against three setups, so
// each test can state what it actually needs instead of assuming a backend:
//
//  - `E2E_EMAIL` + `E2E_PASSWORD` set -> a real registered account, no plan
//    caps: every write test runs.
//  - otherwise -> the "Try the demo" anonymous account. It is seeded up to the
//    demo caps (3 transactions, 1 budget), so creating a *transaction* is
//    already blocked, but pockets (cap 3, none seeded) are free.
//  - Supabase not configured at all -> no auth, pages render mock data and
//    every write returns 401.
export type Session = {
  /** A real session exists, so writes reach the database. */
  signedIn: boolean;
  /** Signed in as the demo user, whose plan caps what can be created. */
  demoPlan: boolean;
};

async function signIn(page: Page): Promise<Session> {
  await page.goto('/');

  // No redirect to /login means Supabase isn't configured: the middleware lets
  // everything through and the pages fall back to mock data.
  if (!new URL(page.url()).pathname.startsWith('/login')) {
    return { signedIn: false, demoPlan: false };
  }

  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  if (email && password) {
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: 'Sign in' }).click();
  } else {
    await page.getByRole('button', { name: /try the demo/i }).click();
  }

  // A failed sign-in bounces back to /login?error=… — surface that message
  // rather than letting every later assertion fail for no visible reason.
  await page
    .waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 })
    .catch(async () => {
      const error = await page
        .locator('.text-red-600, .text-red-400')
        .first()
        .textContent()
        .catch(() => null);
      throw new Error(
        `Could not sign in for the e2e run: ${error?.trim() ?? 'still on /login'}. ` +
          'Enable anonymous sign-ins on the Supabase project, or set E2E_EMAIL / E2E_PASSWORD.',
      );
    });

  const demoPlan = await page
    .getByText(/exploring the demo/i)
    .isVisible()
    .catch(() => false);

  return { signedIn: true, demoPlan };
}

// `auto` so every test lands on the dashboard already signed in, whether or
// not it cares which kind of session it got.
export const test = base.extend<{ session: Session }>({
  session: [
    async ({ page }, use) => {
      await use(await signIn(page));
    },
    { auto: true },
  ],
});

/** Unique per run — pocket names are unique per user in the database. */
export function uniqueName(prefix: string): string {
  return `${prefix} ${Date.now().toString().slice(-6)}`;
}

/**
 * A form control by its `name` attribute. The app's forms pair labels with
 * inputs as siblings rather than with `for`/`id`, so `getByLabel` can't see
 * them; the submitted field name is the stable contract instead.
 */
export function field(page: Page, name: string) {
  return page.locator(
    `input[name="${name}"], select[name="${name}"], textarea[name="${name}"]`,
  );
}

export { expect };
