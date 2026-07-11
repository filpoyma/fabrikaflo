# fabrikaflo-bot

Backend skeleton built with [Fastify](https://fastify.dev) (TypeScript, ESM) and
[Prisma 7](https://www.prisma.io) on PostgreSQL.

The project runs TypeScript directly via Node.js type stripping (Node 22.6+),
so no build step is required for development.

## Stack

- **Fastify 5** — HTTP framework, with `@fastify/autoload`, `@fastify/cors`,
  `@fastify/helmet`, `@fastify/sensible`
- **Prisma 7** — ORM using the `prisma-client` generator + `@prisma/adapter-pg`
- **PostgreSQL 17**
- **env-schema + TypeBox** — validated, typed configuration
- **node:test** — test runner via Fastify `inject()`

## Project structure

```
src/
  app.ts            # builds the Fastify instance (autoloads plugins + routes)
  server.ts         # standalone entry point + graceful shutdown
  plugins/
    env.ts          # validated config -> fastify.config
    prisma.ts       # PrismaClient -> fastify.prisma
    support.ts      # helmet, cors, sensible
  routes/
    root.ts         # GET /
    health.ts       # GET /health (DB ping)
    users.ts        # example resource (Prisma + validation)
  generated/        # Prisma client output (gitignored, run `prisma generate`)
prisma/
  schema.prisma
test/
  root.test.ts
```

## Getting started

Requirements: Node.js >= 22.6.

1. Install dependencies:

```bash
npm install
```

2. Create your env file:

```bash
cp .env.example .env
```

3. Start PostgreSQL (Docker):

```bash
docker compose up -d
```

4. Generate the Prisma client and run the first migration:

```bash
npm run prisma:generate
npm run db:migrate
```

5. Run the server in watch mode:

```bash
npm run dev
```

The API is available at <http://localhost:3000>.

## Scripts

| Script                 | Description                                  |
| ---------------------- | -------------------------------------------- |
| `npm run dev`          | Start with watch mode (type stripping)       |
| `npm start`            | Start the server                             |
| `npm run build`        | Compile to `dist/` with `tsc`                |
| `npm run typecheck`    | Type-check without emitting                  |
| `npm test`             | Run tests                                    |
| `npm run lint`         | Lint with ESLint                             |
| `npm run prisma:generate` | Generate the Prisma client                |
| `npm run db:migrate`   | Create/apply a dev migration                 |
| `npm run db:deploy`    | Apply migrations (production)                |
| `npm run db:studio`    | Open Prisma Studio                           |

## Endpoints

- `GET /` — service status
- `GET /health` — liveness + database ping
- `GET /users` — list users (example)
- `POST /users` — create a user (example)
