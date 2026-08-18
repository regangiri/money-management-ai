# Voice demo (`/demo`)

The public landing page. A visitor says a transaction out loud and watches it
parse field-by-field in front of them. There is no screenshot carousel — the
page *is* the product demo.

**There is no text-to-speech anywhere in this feature.** The person speaks; the
page answers in motion.

## Flow

```
"Try it — say a transaction"
  ├─ AudioContext.resume() + getUserMedia   (user gesture only; never on load)
  ├─ AnalyserNode  → amplitude ref → canvas particle speed + glow
  └─ SpeechRecognition → interim transcript → aria-live region
        └─ final result | 10s silence | "Stop listening"
              └─ tracks.stop() + recognition.stop() + context.close()
                    ↓
POST /api/demo/parse   { text }
  └─ streamObject(Haiku, Zod schema) → NDJSON, one accumulated snapshot per line
        └─ card fills: amount → merchant → category → pocket
              └─ result animates into a mock pocket balance bar
```

`/demo` is listed in `PUBLIC_PREFIXES` (`src/lib/supabase/middleware.ts`) and in
`CHROMELESS_ROUTES` (`src/lib/nav.ts`), so it renders without auth and without
the sidebar/bottom nav.

> **`/api/demo` must be listed in `PUBLIC_PREFIXES` separately.** The prefix
> match runs against the whole path, and `/api/demo/parse` does not start with
> `/demo`. Miss it and the middleware answers a signed-out visitor's fetch with
> a 307 to `/login`; the fetch follows it, resolves 200 with HTML, and the demo
> quietly does nothing. Covered by the "does not mistake an auth redirect for a
> parse result" test.

## Files

| Path | Role |
| --- | --- |
| `src/app/demo/page.tsx` | Public page; static hero copy is the LCP element |
| `src/app/api/demo/parse/route.ts` | Streaming parser. No auth, no database |
| `src/components/demo/DemoHero.tsx` | State machine, owns all state |
| `src/components/demo/AmbientField.tsx` | Canvas flow field (lazy, `ssr: false`) |
| `src/components/demo/ParsedCard.tsx` | The progressive fill |
| `src/components/demo/PromptInput.tsx` | Text fallback + example chips |
| `src/lib/demo/schema.ts` | **Server only** — Zod schema |
| `src/lib/demo/types.ts` | Client contract, deliberately Zod-free |
| `src/lib/demo/parse-stream.ts` | NDJSON reader (~25 lines, no dependencies) |
| `src/lib/rate-limit.ts` | General in-memory IP limiter |

## Rules this feature is built on

**Voice is an enhancement, never a requirement.** The text input and the example
chips are a complete path on their own. Browsers without `SpeechRecognition`
(Firefox, some iOS) silently get the text path — no error, no dead end. Same for
a denied mic: the message points at the text box.

**Nothing persists.** No Supabase client is imported by the parse route, not even
transitively. That is why the category list lives in `src/lib/categories.ts`
rather than `src/lib/assistant.ts` — the latter reaches `@/lib/queries`, which
reaches the database. If you ever import `@/lib/assistant` here, you have broken
the guarantee.

**Zod stays on the server.** `schema.ts` (Zod) is imported only by the route.
The browser gets `types.ts`, which is a plain type plus two helpers. Importing
`schema.ts` from a component adds ~50KB gzipped — more than this page's entire
JS budget. `schema.ts` carries a compile-time assertion that the two still
describe the same shape, so they cannot drift silently.

**NDJSON, not the AI SDK's wire format.** The route consumes
`partialObjectStream` server-side, where the SDK already does tolerant
partial-JSON parsing, and writes one accumulated snapshot per line. The client
therefore needs neither the AI SDK nor a partial-JSON parser.

**Field order is best-effort.** It comes from the key order in the Zod schema
plus an instruction in the system prompt. The card renders whatever has arrived,
so an out-of-order model looks slightly different, never broken.

**No amount means no card.** `amountIDR` is nullable so the model can say "I
didn't find one" instead of inventing a value; that drives a friendly
"didn't catch that" message rather than a confident Rp 0 card.

**Never blame the visitor for our outage.** These are different failures and the
UI must say so:

| Situation | What the visitor sees |
| --- | --- |
| Model answered, no amount in the sentence | "Didn't catch an amount in that…" |
| Model call failed (bad key, no credit, outage) | "…That's on us — try again in a moment." |
| Stream produced zero objects | same as above — a failed call, not an empty answer |
| Response wasn't NDJSON (e.g. an auth redirect) | same as above |
| Too many requests from one IP | the rate-limit message |
| `ANTHROPIC_API_KEY` unset | "The live demo is not configured right now." |

The trap: **the AI SDK does not throw provider errors out of
`partialObjectStream`** — the stream just ends with no items. Without the
`onError` callback in the route, an expired API key is indistinguishable from a
sentence with no amount in it, and the demo tells the visitor they spoke wrong.
The route captures `onError`, treats a zero-item stream as a failure, and emits
`{"error":"UPSTREAM","detail":"…"}`. The real reason is logged server-side and
echoed to the browser console; the visitor only ever sees the neutral message.

To check whether the key is the problem:

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" -H 'anthropic-version: 2023-06-01' \
  -H 'content-type: application/json' \
  -d '{"model":"claude-haiku-4-5","max_tokens":8,"messages":[{"role":"user","content":"hi"}]}'
# 401 = invalid/revoked key · 400 with credit_balance = out of credit · 200 = fine
```

## Perf budget

Measured from `pnpm build` against the `/login` route as the baseline (same root
layout, same shared chunks):

| | gzipped |
| --- | --- |
| Budget agreed for the hero | < 40 KB |
| **Eager JS added by `/demo`** | **11.7 KB** |
| Lazy canvas chunk (`AmbientField` + `simplex-noise`) | 1.7 KB |
| **Worst case (motion allowed, canvas fetched)** | **13.4 KB** |
| Zod / AI SDK in any client chunk | 0 KB — asserted at build time |

Canvas budget: 1500 particles in flat `Float32Array` pools, `devicePixelRatio`
capped at 2, trails drawn with a low-alpha `fillRect` instead of a second pass.
The rAF loop stops entirely on tab blur (`visibilitychange`) and when an
`IntersectionObserver` reports the hero off-screen.

`prefers-reduced-motion: reduce` renders a static CSS gradient — the canvas
component is never mounted and its chunk is never fetched, so there is no rAF
loop at all. The preference is read with `useSyncExternalStore` whose *server*
snapshot is `true`, so server-rendered markup never contains a canvas.

### Re-measuring

```bash
pnpm build
# then compare the client chunks of /demo against /login via
# .next/server/app/<route>_client-reference-manifest.js
```

## Cost controls

The endpoint is unauthenticated public traffic on a paid model:

- Haiku (`CLAUDE_MODEL` from `src/lib/anthropic.ts`), `maxOutputTokens: 300`
- input truncated to 200 characters
- 12 requests per IP per 10 minutes (`src/lib/rate-limit.ts`)
- missing `ANTHROPIC_API_KEY` → friendly 503, never a stack trace

The limiter holds counters in process memory. On one container that is exact;
across several instances each keeps its own tally, so the effective limit is
per-instance. It is abuse-dampening, not a billing control — swap in a shared
store if that ever matters.

## Ambient audio

A generative drone built from four `OscillatorNode`s on an A pentatonic set
through a feedback delay (`src/lib/demo/useDrone.ts`). Default **off**; nothing
is constructed until the visitor unmutes, and the state lives in React only, so
it resets on reload.

Tone.js was specified originally and rejected: ~150KB gzipped for a decorative
feature, against a 40KB budget for the whole page.

## Tests

`e2e/demo.spec.ts` — 13 tests, desktop and mobile viewports:

```bash
pnpm test e2e/demo.spec.ts
```

They drive the **text** path with `/api/demo/parse` stubbed with canned NDJSON:
deterministic, no model spend. Headless Chromium has no `SpeechRecognition`, so
this is also exactly what a Firefox visitor experiences. Covered: public
reachability, absence of app chrome, the full fill, a half-arrived object, the
no-amount state, all three upstream-failure shapes, the rate-limit message, the
keyboard-only path, the live region, and both motion preferences.

The spec imports Playwright's own `test`, not `e2e/fixtures.ts` — `/demo` is
public, so signing in first would prove nothing.

Because every test stubs `/api/demo/parse`, the suite cannot catch a problem
with the *real* endpoint — the auth-redirect bug above shipped past a green
suite for exactly that reason. Smoke-test the live route directly after
touching the middleware or the route itself:

```bash
curl -s -i -X POST http://localhost:3000/api/demo/parse \
  -H 'Content-Type: application/json' \
  -d '{"text":"Beli kopi 35 ribu di Kopi Kenangan"}' | head -12
# expect: 200, content-type application/x-ndjson, one JSON object per line
# a 307 to /login means /api/demo fell out of PUBLIC_PREFIXES
```

## Not covered by automated tests

Needs a real device and a human:

- the mic permission prompt, and the denied path
- 60fps on a mid-range Android; LCP on throttled 4G
- iOS Safari `webkitSpeechRecognition`, including the case where it exists but
  never fires a result
- `id-ID` recognition accuracy against spoken Indonesian
- how the drone actually sounds
- live model output: field ordering and money normalisation against the real API
