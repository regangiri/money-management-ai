# AGENTS.md

## Project

Next.js 15 (App Router) + TypeScript. Frontend-heavy product.
Package manager: pnpm. Node 20+.

## Setup & commands

- Install: `pnpm install`
- Dev server: `pnpm dev`
- Build: `pnpm build`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Test: `pnpm test`

Always run `pnpm typecheck` and `pnpm lint` before considering a task done.

## Conventions

- Use the App Router (`app/`), Server Components by default.
- Only add `"use client"` when the component needs state, effects, or browser APIs.
- Data fetching happens in Server Components or route handlers, not client effects.
- Styling: Tailwind utility classes; no inline style objects.
- Imports use the `@/` path alias, not long relative paths.
- Prefer named exports; one component per file.

## Do not

- Don't introduce a new dependency without flagging it first.
- Don't disable type or lint rules to make errors go away.

## Architecture notes

- `app/` routes, `components/` shared UI, `lib/` utilities & data access.
- API routes live in `app/api/*/route.ts`.
