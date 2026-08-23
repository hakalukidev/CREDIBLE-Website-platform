# Credible

A sophisticated trust and verification platform where the public can search for and review businesses/professionals, and those businesses can register, manage their profile, apply for verification, and receive a "Credible Verified / Credible Certified" badge.

## Architecture

This is a monorepo containing:

- `apps/web` — Next.js 15 (App Router, TypeScript, Tailwind, shadcn/ui) — public site + dashboards
- `apps/api` — Node.js + Express + TypeScript REST API with clean architecture
- `packages/shared` — Shared utilities (zod schemas, formatters, etc.)
- `packages/types` — Shared TypeScript types
- `prisma` — Database schema (PostgreSQL + Prisma)

## Project Structure

```
credible/
├── apps/
│   ├── api/                          # Express REST API (port 4000)
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database schema
│   │   │   ├── migrations/           # Versioned migrations
│   │   │   └── seed.ts               # Dev/staging seed script
│   │   └── src/
│   │       ├── config/               # Env-based configuration
│   │       ├── lib/                  # Cross-cutting infrastructure
│   │       │   ├── ai/               # AI/ML helpers
│   │       │   ├── badge/            # Verified/Certified badge engine
│   │       │   ├── db/               # Prisma client + helpers
│   │       │   ├── errors/           # Typed API errors
│   │       │   ├── logger/           # Pino logger setup
│   │       │   ├── mail/             # Nodemailer / SendGrid transport
│   │       │   ├── payments/         # aamarPay & SSLCommerz adapters
│   │       │   ├── queue/            # BullMQ queues & workers
│   │       │   ├── storage/          # S3 / Cloudflare R2 client
│   │       │   └── utils/            # Password, slug, hash helpers
│   │       ├── middleware/           # Auth, rate-limit, error handler
│   │       ├── modules/              # Feature modules (vertical slices)
│   │       │   ├── admin/            # Admin panel endpoints
│   │       │   ├── auth/             # JWT + Passport.js strategies
│   │       │   ├── businesses/       # Business CRUD & dashboard
│   │       │   ├── categories/       # Business categories
│   │       │   ├── contact/          # Contact form
│   │       │   ├── payments/         # Subscriptions & billing
│   │       │   ├── public/           # Public search & profile routes
│   │       │   ├── reviews/          # Review submission & moderation
│   │       │   ├── subscriptions/    # Plans, vouchers, invoices
│   │       │   ├── upload/           # File upload endpoints
│   │       │   ├── users/            # User profile & settings
│   │       │   └── verification/     # Verification workflow
│   │       ├── routes/               # Express router composition
│   │       ├── services/             # Domain services (business logic)
│   │       ├── types/                # API-only TypeScript types
│   │       └── workers/              # Background job processors
│   └── web/                          # Next.js 15 frontend (port 3000)
│       ├── scripts/                  # Build/setup scripts
│       └── src/
│           ├── app/                  # App Router routes
│           │   ├── account/          # Logged-in user account
│           │   ├── admin/            # Admin dashboards
│           │   ├── api-docs/         # Interactive API docs
│           │   ├── business/         # Business dashboard
│           │   ├── for-business/     # Marketing landing pages
│           │   ├── login/            # Auth pages
│           │   ├── register-business/# Business onboarding
│           │   ├── search/           # Public business search
│           │   ├── submit-review/    # Public review submission
│           │   ├── verify/           # Verification status pages
│           │   └── widgets/          # Embeddable review widgets
│           ├── components/           # Reusable UI components
│           │   ├── admin/            # Admin-specific components
│           │   ├── auth/             # Auth forms & guards
│           │   ├── billing/          # Plans, invoices, checkout UI
│           │   ├── business/         # Business dashboard widgets
│           │   ├── charts/           # Recharts wrappers
│           │   ├── layout/           # Header, footer, sidebar
│           │   ├── reviews/          # Review cards & lists
│           │   ├── ui/               # shadcn/ui primitives
│           │   └── verification/     # Verification UI
│           ├── features/             # Feature-scoped hooks & state
│           │   ├── admin/
│           │   ├── auth/
│           │   ├── billing/
│           │   ├── business/
│           │   ├── review/
│           │   └── verification/
│           ├── lib/                  # Client utilities
│           │   ├── api/              # Fetch wrapper & endpoints
│           │   ├── hooks/            # Shared React hooks
│           │   ├── seo/              # Metadata & structured data
│           │   ├── store/            # Zustand stores
│           │   └── utils/            # Formatters, cn(), helpers
│           ├── styles/               # Global Tailwind & CSS
│           └── types/                # Frontend-only TypeScript types
├── packages/
│   ├── shared/                       # Cross-app utilities
│   │   └── src/
│   │       ├── constants/            # Plan codes, role enums, etc.
│   │       ├── schemas/              # zod schemas shared by API + web
│   │       └── utils/                # slugify, formatters, validators
│   └── types/                        # Cross-app TypeScript types
│       └── src/
├── prisma/                           # Top-level Prisma assets (if shared)
├── .github/                          # GitHub Actions workflows
├── .env.example                      # Environment template (commit this)
├── .gitignore                        # Ignored files & secrets
├── .prettierrc.json                  # Prettier config
├── tsconfig.base.json                # Shared TypeScript config
├── package.json                      # Root workspace config
└── README.md
```

### Folder conventions

| Path | Purpose |
| ---- | ------- |
| `apps/api/src/modules/<feature>` | A vertical slice: routes → controllers → services → Prisma calls. Keep new features self-contained here. |
| `apps/api/src/lib` | Infrastructure adapters (payments, mail, storage, queue). Never import from `modules/`. |
| `apps/api/src/services` | Pure business logic that can be reused across modules. |
| `apps/web/src/app` | Next.js App Router routes — one folder per URL segment. |
| `apps/web/src/features/<domain>` | Feature-scoped hooks, stores, and view-models grouped by domain (not by type). |
| `apps/web/src/components` | Reusable, presentational components. |
| `packages/shared` | Code that must be identical on both API and web (zod schemas, plan codes, formatters). |
| `packages/types` | Pure TypeScript types — no runtime code — safe to import anywhere. |

## Tech Stack (latest versions)

| Layer            | Technology                                              |
| ---------------- | ------------------------------------------------------- |
| Frontend         | Next.js 15, React 19, TypeScript 5.7, Tailwind 4        |
| UI               | shadcn/ui, Radix UI primitives, lucide-react icons      |
| State Management | Zustand (global), TanStack Query (server cache)         |
| Backend          | Node.js 22, Express 5, TypeScript 5.7                   |
| Validation       | zod 3.x                                                 |
| Database         | PostgreSQL 16 + Prisma 6                                |
| Queue            | Redis + BullMQ                                          |
| Storage          | AWS S3 / Cloudflare R2                                  |
| Auth             | JWT + Passport.js (Google, Facebook)                    |
| Payments         | aamarPay, SSLCommerz (BDT, BD local gateways)            |
| Email            | Nodemailer / SendGrid                                   |
| Logging          | Pino                                                    |
| Testing          | Vitest + Supertest                                      |
| Linting          | ESLint 9, Prettier 3                                    |
| CI/CD            | GitHub Actions                                          |

## Getting Started

### Prerequisites

- Node.js >= 20 (tested on 22.x)
- PostgreSQL 14+
- Redis 6+

### Setup

```bash
# Install dependencies (workspaces)
npm install

# Copy environment template
cp .env.example .env
# Edit .env with your local credentials

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed the database
npm run db:seed

# Start both web (3000) and api (4000) in dev mode
npm run dev
```

## Development Phases

- **Phase 0** – Setup & Core Architecture (← **backbone**)
- **Phase 1** – Public Website & Core Models
- **Phase 2** – Business Dashboard & Review System
- **Phase 3** – Verification & Admin Panel
- **Phase 4** – Payments & Subscriptions (← **current phase**)
- **Phase 5** – SEO, Widgets & Final Polish

## Phase 4 — Payments & Subscriptions (overview)

Phase 4 introduces the monetisation engine:

- **Plans**: `FREE`, `BASIC`, `PROFESSIONAL`, `ENTERPRISE` with a per-plan feature matrix (verified badge, premium widgets, review-invitation limits, custom domain).
- **Payment gateways**: SSLCommerz and aamarPay (Bangladesh-local, BDT). Both ship as adapter modules under `apps/api/src/lib/payments/`.
- **Billing cycles**: monthly, quarterly, yearly and one-time, all driven from the same `paymentService.initiateCheckout`.
- **Vouchers**: percentage or fixed-amount codes with min-purchase, max-discount and per-plan applicability.
- **Invoices**: PDFKit-generated PDFs, sequential `INV-YYYY-NNNN` numbering, optional upload to S3 / R2. When storage is unavailable, the API streams the PDF on demand via `GET /api/v1/business/subscription/invoices/:id/download`.
- **Feature gating**: `checkFeature('reviewInvitations' | 'canGenerateQR' | …)` middleware is wired into the existing `POST /businesses/me/invite` and `GET /businesses/me/qr-code` routes.
- **Dashboards**:
  - Business: `/business/subscription` (current plan, usage, recent invoices + payments), `/business/subscription/plans`, `/business/subscription/checkout`, `/business/subscription/invoices/[id]`.
  - Admin: `/admin/billing` (KPIs, recent activity), `/admin/billing/payments`, `/admin/billing/subscriptions`, `/admin/billing/vouchers` (full CRUD).

### Phase 4 new API endpoints (highlights)

```
GET    /api/v1/business/subscription
GET    /api/v1/business/subscription/plans
POST   /api/v1/business/subscription/subscribe
POST   /api/v1/business/subscription/cancel
POST   /api/v1/business/subscription/reactivate
GET    /api/v1/business/subscription/invoices
GET    /api/v1/business/subscription/invoices/:id
GET    /api/v1/business/subscription/invoices/:id/download   # streams PDF
GET    /api/v1/business/subscription/payment-history
POST   /api/v1/business/subscription/voucher/validate

# Gateway callbacks (used by both aamarPay and SSLCommerz)
POST   /api/v1/payments/ipn/{aamarpay|sslcommerz}
GET/POST /api/v1/payments/{aamarpay|sslcommerz}/{success|fail|cancel}

# Admin
GET    /api/v1/admin/billing/payments
GET    /api/v1/admin/billing/payments/stats
GET    /api/v1/admin/billing/subscriptions
GET    /api/v1/admin/billing/vouchers
POST   /api/v1/admin/billing/vouchers
PUT    /api/v1/admin/billing/vouchers/:id
DELETE /api/v1/admin/billing/vouchers/:id
```

### Phase 4 environment variables

```
# aamarPay
AAMARPAY_STORE_ID=…
AAMARPAY_SIGNATURE_KEY=…
AAMARPAY_SANDBOX=true
AAMARPAY_SUCCESS_URL=http://localhost:4000/api/v1/payments/aamarpay/success
AAMARPAY_FAIL_URL=http://localhost:4000/api/v1/payments/aamarpay/fail
AAMARPAY_CANCEL_URL=http://localhost:4000/api/v1/payments/aamarpay/cancel

# SSLCommerz
SSLCZ_STORE_ID=…
SSLCZ_STORE_PASSWORD=…
SSLCZ_SANDBOX=true
SSLCZ_SUCCESS_URL=http://localhost:4000/api/v1/payments/sslcommerz/success
SSLCZ_FAIL_URL=http://localhost:4000/api/v1/payments/sslcommerz/fail
SSLCZ_CANCEL_URL=http://localhost:4000/api/v1/payments/sslcommerz/cancel
SSLCZ_IPN_URL=http://localhost:4000/api/v1/payments/ipn/sslcommerz

# Invoicing
INVOICE_VAT_RATE=0.05
```

### Phase 4 tests

```
# Run all tests
npm run test -w @credible/api

# Run only Phase 4 specs
npx vitest run \
  src/services/voucher.service.spec.ts \
  src/services/invoice.service.spec.ts \
  src/services/payment.service.spec.ts \
  src/lib/payments/sslcommerz.adapter.spec.ts \
  src/lib/payments/aamarpay.adapter.spec.ts
```

## Design Tokens

| Token              | Hex      | Purpose            |
| ------------------ | -------- | ------------------ |
| Primary (Trust)    | #1A56DB  | Brand / links      |
| Secondary (Gold)   | #F59E0B  | Certified / badges |
| Success            | #059669  | Confirmed actions  |
| Background         | #F3F4F6  | Page background    |
| Surface            | #FFFFFF  | Cards / panels     |
| Text               | #111827  | Headings           |
| Muted Text         | #6B7280  | Secondary text     |

## Scripts

| Script                 | Description                                |
| ---------------------- | ------------------------------------------ |
| `npm run dev`          | Run web (3000) + api (4000) concurrently   |
| `npm run dev:web`      | Run only the Next.js frontend              |
| `npm run dev:api`      | Run only the Express API                   |
| `npm run build`        | Build all workspaces                       |
| `npm run lint`         | Lint all workspaces                        |
| `npm run test`         | Run tests for all workspaces               |
| `npm run db:generate`  | Generate Prisma client                     |
| `npm run db:migrate`   | Run Prisma migrations                      |
| `npm run db:push`      | Push schema to DB without migration files  |
| `npm run db:studio`    | Open Prisma Studio                         |
| `npm run format`       | Format code with Prettier                  |