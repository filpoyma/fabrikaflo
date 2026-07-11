# SUMMARY — fabrikaflo-bot

Backend skeleton. Source of truth is the codebase; update this file as it evolves.

## Architecture

- **Runtime**: Node.js >= 22.6, ESM, TypeScript run directly via type stripping
  (no build step in dev). `tsc` is used only for typecheck and optional `dist` build.
- **Framework**: Fastify 5 with `@fastify/autoload` loading `src/plugins` then `src/routes`.
- **Config**: `src/plugins/env.ts` validates env with `env-schema` + TypeBox, exposes
  typed `fastify.config`. Loads `.env` via env-schema `dotenv: true`.
- **Database**: PostgreSQL via Prisma 7 using the new `prisma-client` generator
  (output: `src/generated/prisma`, gitignored) + `@prisma/adapter-pg` driver adapter.
  Connection string lives in `prisma.config.ts` (CLI) and `DATABASE_URL` (runtime).
  `src/plugins/prisma.ts` instantiates the client lazily (no eager connect) and
  decorates `fastify.prisma`; disconnects on `onClose`.
- **Security/util plugins**: `src/plugins/support.ts` registers helmet, cors, sensible.
- **Entry**: `src/app.ts` builds the instance; `src/server.ts` listens + graceful
  shutdown on SIGINT/SIGTERM.

## Endpoints

- `GET /` — service status (no DB).
- `GET /health` — `SELECT 1` DB ping, returns 503 (sensible) if DB down.
- `GET /users`, `POST /users` — example resource (Prisma + JSON-schema validation).

## Data model

- `User { id (uuid), email (unique), name?, createdAt, updatedAt }` — example, replace.

## Conventions / important notes

- Prisma 7: `url` is NOT allowed in `schema.prisma`; it lives in `prisma.config.ts`.
- Generated client is committed-out (gitignored); run `prisma generate` after install.
- The generated client is type-stripping safe (`@ts-nocheck`, `.ts` import extensions).

## Verified

- `npm run typecheck`, `npm run lint`, `npm test` (inject-based) all pass.
- Server boots; `/` returns 200; `/health` returns 503 until Postgres is reachable.

## Pending / next steps

- Start  `npm run db:migrate` for the first migration.
- Add real domain models/routes; add auth if needed.
