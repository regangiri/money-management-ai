import { test, expect, type Page } from '@playwright/test';

// The public landing demo. Deliberately imports Playwright's own `test` rather
// than ./fixtures: /demo is unauthenticated, so signing in first would prove
// nothing and would burn a demo account per test.
//
// Every test drives the TEXT path, which is the whole point — voice is
// progressive enhancement, and headless Chromium has no SpeechRecognition, so
// what runs here is exactly what a Firefox visitor gets.
//
// The parse endpoint is stubbed with canned NDJSON: deterministic, instant, and
// no Anthropic spend.

type Chunk = Record<string, unknown>;

/** Serve the given snapshots as the NDJSON the real route emits. */
async function stubParse(page: Page, chunks: Chunk[], status = 200) {
  await page.route('**/api/demo/parse', async (route) => {
    await route.fulfill({
      status,
      contentType: 'application/x-ndjson; charset=utf-8',
      body: chunks.map((c) => JSON.stringify(c)).join('\n') + '\n',
    });
  });
}

const FULL_PARSE: Chunk[] = [
  { amountIDR: 35000 },
  { amountIDR: 35000, merchant: 'Kopi Kenangan' },
  { amountIDR: 35000, merchant: 'Kopi Kenangan', category: 'Food & Drink' },
  {
    amountIDR: 35000,
    merchant: 'Kopi Kenangan',
    category: 'Food & Drink',
    suggestedPocket: 'Flazz',
    confidence: 0.9,
  },
];

test.describe('landing demo', () => {
  test('is reachable without an account and shows the examples', async ({
    page,
  }) => {
    await page.goto('/demo');

    await expect(page).toHaveURL(/\/demo$/);
    await expect(
      page.getByRole('heading', { name: /say what you spent/i }),
    ).toBeVisible();

    // The demo has to work with zero permissions granted.
    for (const phrase of [
      'Beli kopi 35 ribu di Kopi Kenangan',
      'Bayar listrik 450 ribu',
      'Lunch 120k at Plaza Indonesia',
    ]) {
      await expect(page.getByRole('button', { name: phrase })).toBeVisible();
    }
  });

  test('renders without any app chrome', async ({ page }) => {
    await page.goto('/demo');

    // Neither the desktop sidebar nor the mobile tab bar belongs on a landing
    // page — both are pathname-guarded through isChromeless().
    await expect(page.getByRole('link', { name: 'Transactions' })).toHaveCount(
      0,
    );
    await expect(page.getByRole('button', { name: 'More' })).toHaveCount(0);
  });

  test('an example chip fills the card and lands on a pocket balance', async ({
    page,
  }) => {
    await stubParse(page, FULL_PARSE);
    await page.goto('/demo');

    await page
      .getByRole('button', { name: 'Beli kopi 35 ribu di Kopi Kenangan' })
      .click();

    // Every field the model streamed shows up on the card. Scoped to the card
    // because the page also echoes the sentence that was submitted.
    const card = page.getByTestId('parsed-card');
    await expect(card.getByText('Rp 35.000')).toBeVisible();
    await expect(card.getByText('Kopi Kenangan')).toBeVisible();
    await expect(card.getByText('Food & Drink')).toBeVisible();
    // Exact: the pocket's subtitle ("E-money · BCA Flazz") contains it too.
    await expect(card.getByText('Flazz', { exact: true })).toBeVisible();

    // …and the result animates into the mock pocket bar.
    await expect(
      page.getByRole('img', { name: /Flazz balance after this transaction/ }),
    ).toBeVisible();
    await expect(page.getByText('Demo only — nothing is saved.')).toBeVisible();

    await page.getByRole('button', { name: 'Try another' }).click();
    await expect(page.getByTestId('parsed-card')).toHaveCount(0);
  });

  test('renders a half-arrived object without waiting for the rest', async ({
    page,
  }) => {
    // The card must never hold back a field until the object is complete —
    // filling as the stream lands is the entire effect.
    await stubParse(page, [
      { amountIDR: 450000 },
      { amountIDR: 450000, merchant: 'Listrik' },
    ]);
    await page.goto('/demo');

    await page.getByRole('button', { name: 'Bayar listrik 450 ribu' }).click();

    const card = page.getByTestId('parsed-card');
    await expect(card.getByText('Rp 450.000')).toBeVisible();
    await expect(card.getByText('Listrik')).toBeVisible();
    // Category and pocket never arrived, so those rows stay pending rather
    // than inventing a value.
    await expect(card.getByText('Food & Drink')).toHaveCount(0);
  });

  test('says so plainly when it hears no amount', async ({ page }) => {
    await stubParse(page, [
      {
        amountIDR: null,
        merchant: 'Unknown',
        category: 'Shopping',
        suggestedPocket: 'Cash',
        confidence: 0.2,
      },
    ]);
    await page.goto('/demo');

    await page.getByLabel('Type a transaction').fill('halo apa kabar');
    await page.getByRole('button', { name: 'Parse' }).click();

    await expect(page.getByText(/didn't catch an amount/i)).toBeVisible();
    // No zero-rupiah card.
    await expect(page.getByText('Rp 0')).toHaveCount(0);
  });

  test('blames itself, not the visitor, when the model call fails', async ({
    page,
  }) => {
    // A dead API key used to end the stream with zero items, which the UI
    // reported as "didn't catch an amount" — telling the visitor they spoke
    // wrong when actually the demo was broken. The route now flags it.
    await stubParse(page, [{ error: 'UPSTREAM', detail: 'API key is invalid.' }]);
    await page.goto('/demo');

    await page.getByRole('button', { name: 'Bayar listrik 450 ribu' }).click();

    await expect(page.getByText(/that's on us/i)).toBeVisible();
    await expect(page.getByText(/didn't catch an amount/i)).toHaveCount(0);
  });

  test('treats an empty stream as a failure, not an amountless sentence', async ({
    page,
  }) => {
    await stubParse(page, []);
    await page.goto('/demo');

    await page.getByRole('button', { name: 'Bayar listrik 450 ribu' }).click();

    await expect(page.getByText(/that's on us/i)).toBeVisible();
    await expect(page.getByText(/didn't catch an amount/i)).toHaveCount(0);
  });

  test('does not mistake an auth redirect for a parse result', async ({
    page,
  }) => {
    // If /api/demo ever falls out of the middleware allowlist again, the fetch
    // follows a 307 to /login and resolves 200 with HTML. Reading that as
    // NDJSON yields nothing, which must not look like a successful parse.
    await page.route('**/api/demo/parse', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html; charset=utf-8',
        body: '<!doctype html><title>Sign in</title>',
      }),
    );
    await page.goto('/demo');

    await page.getByRole('button', { name: 'Bayar listrik 450 ribu' }).click();

    await expect(page.getByText(/that's on us/i)).toBeVisible();
    await expect(page.getByTestId('parsed-card')).toHaveCount(0);
  });

  test('surfaces the rate limit as a friendly message', async ({ page }) => {
    await page.route('**/api/demo/parse', (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({
          error: "That's a lot of demoing! Give it a few minutes and try again.",
          code: 'RATE_LIMITED',
        }),
      }),
    );
    await page.goto('/demo');

    await page.getByRole('button', { name: 'Bayar listrik 450 ribu' }).click();
    await expect(page.getByText(/lot of demoing/i)).toBeVisible();
  });

  test('is fully operable from the keyboard', async ({ page }) => {
    await stubParse(page, FULL_PARSE);
    await page.goto('/demo');

    const input = page.getByLabel('Type a transaction');
    await input.focus();
    await page.keyboard.type('Beli kopi 35 ribu di Kopi Kenangan');
    await page.keyboard.press('Enter');

    await expect(
      page.getByTestId('parsed-card').getByText('Rp 35.000'),
    ).toBeVisible();

    // Reach "Try another" and fire it with the keyboard, no mouse involved.
    const tryAnother = page.getByRole('button', { name: 'Try another' });
    await expect(tryAnother).toBeVisible();
    await tryAnother.focus();
    await expect(tryAnother).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('parsed-card')).toHaveCount(0);
  });

  test('announces the result politely for screen readers', async ({ page }) => {
    await stubParse(page, FULL_PARSE);
    await page.goto('/demo');

    // A live region exists before anything happens, so assistive tech has
    // something stable to observe rather than a node appearing mid-update.
    const hero = page.locator('section');
    await expect(hero.locator('[aria-live="polite"]').first()).toBeAttached();
    // Polite, never assertive — it must not interrupt a reader mid-sentence.
    // Scoped to the hero: Next's own route announcer is assertive by design.
    await expect(hero.locator('[aria-live="assertive"]')).toHaveCount(0);

    await page.getByLabel('Type a transaction').fill('Lunch 120k');
    await page.getByRole('button', { name: 'Parse' }).click();

    // The card fills visually; this is what a screen reader gets instead.
    await expect(
      page.getByText(/Parsed: .*Kopi Kenangan.*Food & Drink.*Flazz/),
    ).toBeAttached();
  });

  test('draws no canvas when the visitor prefers reduced motion', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/demo');

    // Not "a paused canvas" — no canvas element and no rAF loop at all.
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(
      page.getByRole('heading', { name: /say what you spent/i }),
    ).toBeVisible();
  });

  test('draws the ambient canvas when motion is welcome', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/demo');

    await expect(page.locator('canvas')).toHaveCount(1);
  });
});
