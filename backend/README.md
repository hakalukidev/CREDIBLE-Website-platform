# Credible Backend

Express 5 + Prisma 6 REST API for the Credible trust & verification platform.

## Stack

- Node.js 22 (>= 20)
- Express 5 + TypeScript 5.7
- PostgreSQL 16 + Prisma 6 ORM
- Redis 7 + BullMQ (background jobs)
- Passport.js (JWT, Google, Facebook)
- Pino structured logging
- Vitest + Supertest
- esbuild for production bundling
- ESLint 9, Prettier 3

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # Versioned migrations
│   ├── seed.ts                  # Dev seed
│   ├── seed-10.ts               # Larger dev seed
│   └── cleanup-10.mts           # Test data cleanup
├── scripts/
│   └── build.mjs                # esbuild bundler (produces dist/)
├── packages/
│   ├── shared/                  # Shared zod schemas + utilities
│   └── types/                   # Shared TypeScript types
├── src/
│   ├── server.ts                # Process entrypoint
│   ├── app.ts                   # Express app composition
│   ├── config/                  # Env-based configuration
│   ├── lib/                     # Cross-cutting infrastructure
│   │   ├── ai/                  # AI/ML helpers
│   │   ├── badge/               # Verified/Certified badge engine
│   │   ├── db/                  # Prisma client + helpers
│   │   ├── errors/              # Typed API errors
│   │   ├── logger/              # Pino logger setup
│   │   ├── mail/                # Nodemailer / SendGrid transport
│   │   ├── payments/            # aamarPay & SSLCommerz adapters
│   │   ├── queue/               # BullMQ queues & workers
│   │   ├── storage/             # S3 / Cloudflare R2 client
│   │   └── utils/               # Password, slug, hash helpers
│   ├── middleware/              # Auth, rate-limit, error handler
│   ├── modules/                 # Feature modules (vertical slices)
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── businesses/
│   │   ├── categories/
│   │   ├── contact/
│   │   ├── payments/
│   │   ├── public/
│   │   ├── reviews/
│   │   ├── subscriptions/
│   │   ├── upload/
│   │   ├── users/
│   │   └── verification/
│   ├── routes/                  # Express router composition
│   ├── services/                # Domain services
│   ├── types/                   # API-only TypeScript types
│   └── workers/                 # Background job processors
├── render.yaml                  # Render.com service definition
├── openapi.yaml                 # OpenAPI 3 spec
├── eslint.config.mjs
├── vitest.config.ts
├── tsconfig.json
├── tsconfig.base.json
└── package.json
```

## Prerequisites

- Node.js >= 20 (tested on 22.x)
- PostgreSQL 14+ (local or hosted)
- Redis 6+ (local or hosted)

## Setup

```bash
# Install dependencies (npm workspaces resolves the local packages/*)
npm install

# Copy environment template and fill in real values
cp .env.example .env

# Generate Prisma client
npm run db:generate

# Run database migrations (creates schema)
npm run db:migrate

# (Optional) Seed the database
npm run seed
# or
npm run seed:10
```

## Development

```bash
# Start API server with hot-reload (port 4000)
npm run dev

# In another terminal, start the background worker
npm run start:worker   # for production-style start
# or, with hot-reload:
npx tsx watch src/workers/index.ts
```

API will be at `http://localhost:4000/api/v1` (mounted under the prefix from `API_PREFIX`).
Health check: `GET http://localhost:4000/api/v1/health`

## Scripts

| Script              | Description                                              |
| ------------------- | -------------------------------------------------------- |
| `npm run dev`       | Start API with hot-reload (`tsx watch`)                  |
| `npm run build`     | Bundle server + worker with esbuild → `dist/`            |
| `npm start`         | Run the bundled server (`node dist/server.js`)           |
| `npm run start:worker` | Run the bundled worker (`node dist/workers/index.js`) |
| `npm run lint`      | ESLint over `src/**/*.ts`                                |
| `npm run typecheck` | `tsc --noEmit`                                           |
| `npm test`          | Run Vitest suite                                         |
| `npm run test:watch`| Vitest watch mode                                        |
| `npm run seed`      | Run `prisma/seed.ts`                                     |
| `npm run seed:10`   | Run `prisma/seed-10.ts`                                  |
| `npm run db:generate` | `prisma generate`                                      |
| `npm run db:migrate`  | `prisma migrate dev` (interactive)                    |
| `npm run db:migrate:deploy` | `prisma migrate deploy` (CI)                    |
| `npm run db:push`   | Push schema without migration files                      |
| `npm run db:studio` | Open Prisma Studio                                       |
| `npm run format`    | Format code with Prettier                                |
| `npm run format:check` | Check formatting without writing                       |

## Deployment

`render.yaml` defines the full infrastructure on Render.com:

- `credible-db` — managed PostgreSQL 16
- `credible-redis` — managed Redis
- `credible-api` — web service (Node)
- `credible-worker` — background worker

The build command is `npm ci && npx prisma generate && npm run build`. The start command is `node dist/server.js` (or `node dist/workers/index.js` for the worker).

Required environment variables are listed in `.env.example`. Secrets (`JWT_*`, `S3_*`, `GOOGLE_*`, `FACEBOOK_*`, `SMTP_*`, `OPENAI_API_KEY`, `SSLCZ_*`, etc.) are configured in the Render dashboard.

To migrate on production:

```bash
npm run db:migrate:deploy
```

## Related

- Frontend lives in a separate repository / folder (`../frontend`).
- Shared workspace packages (`@credible/shared`, `@credible/types`) are kept in sync with the frontend copy. If you change a type or schema, mirror it on both sides.
