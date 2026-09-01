# Credible Frontend

Next.js 16 (App Router) web app for the Credible trust & verification platform.

## Stack

- Next.js 16.3 (App Router, TypeScript)
- React 19
- TypeScript 5.7
- Tailwind CSS 3 + shadcn/ui (Radix UI primitives)
- TanStack Query 5 (server state)
- Zustand 5 (client state)
- Zod 3 (form validation)
- Framer Motion 13 (animations)
- Vitest

## Project Structure

```
frontend/
├── public/                      # Static assets (logo.jpg, etc.)
├── scripts/                     # One-off build/setup scripts
├── packages/
│   ├── shared/                  # Shared zod schemas + utilities
│   └── types/                   # Shared TypeScript types
├── src/
│   ├── app/                     # App Router routes
│   │   ├── account/             # Logged-in user account
│   │   ├── admin/               # Admin dashboards
│   │   ├── api-docs/            # Interactive API docs
│   │   ├── business/            # Business dashboard
│   │   ├── for-business/        # Marketing landing pages
│   │   ├── login/               # Auth pages
│   │   ├── register-business/   # Business onboarding
│   │   ├── search/              # Public business search
│   │   ├── submit-review/       # Public review submission
│   │   ├── verify/              # Verification status pages
│   │   └── widgets/             # Embeddable review widgets
│   ├── components/              # Reusable UI components
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── billing/
│   │   ├── business/
│   │   ├── charts/
│   │   ├── layout/              # Header, footer, sidebar
│   │   ├── reviews/
│   │   ├── ui/                  # shadcn/ui primitives
│   │   └── verification/
│   ├── features/                # Feature-scoped hooks & state
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── billing/
│   │   ├── business/
│   │   ├── review/
│   │   └── verification/
│   ├── lib/                     # Client utilities
│   │   ├── api/                 # Fetch wrapper & endpoints
│   │   ├── hooks/               # Shared React hooks
│   │   ├── seo/                 # Metadata & structured data
│   │   ├── store/               # Zustand stores
│   │   └── utils/               # Formatters, cn(), helpers
│   ├── styles/                  # Global Tailwind & CSS
│   └── types/                   # Frontend-only TypeScript types
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── tsconfig.base.json
├── vercel.json
└── package.json
```

## Prerequisites

- Node.js >= 20 (tested on 22.x)
- A running backend (`../backend`) — see its README for setup.

## Setup

```bash
# Install dependencies (npm workspaces resolves the local packages/*)
npm install

# Copy environment template and fill in real values
cp .env.example .env

# (Optional) Override the API base URL if backend is hosted elsewhere
# NEXT_PUBLIC_API_URL="https://api.your-domain.com/api/v1"
```

## Development

```bash
# Start Next.js dev server (port 3000)
npm run dev
```

App will be at `http://localhost:3000`. The browser reads `NEXT_PUBLIC_API_URL` from `.env` (default `http://localhost:4000/api/v1`) and proxies requests to the backend.

## Scripts

| Script                | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `npm run dev`         | Start Next.js dev server (Turbopack)                   |
| `npm run build`       | Production build                                       |
| `npm start`           | Run the production build                               |
| `npm run lint`        | `next lint`                                            |
| `npm run typecheck`   | `tsc --noEmit`                                         |
| `npm test`            | Run Vitest suite                                       |
| `npm run format`      | Format code with Prettier                              |
| `npm run format:check`| Check formatting without writing                       |

## Build output

`next build` produces a `.next/` directory with the compiled app. Deploy it to any platform that supports Next.js (Vercel, Netlify, a Node host, etc.).

### Deploying to Vercel

The repo includes a minimal `vercel.json`:

```json
{
  "framework": "nextjs"
}
```

Set these environment variables in your Vercel project:

- `NEXT_PUBLIC_API_URL` — the production URL of the backend (e.g. `https://api.your-domain.com/api/v1`)
- `NEXT_PUBLIC_WEB_URL` — the production URL of this frontend (used for metadata / sitemap absolute URLs)
- `NEXT_PUBLIC_SITE_NAME` — display name

`vercel deploy --prod` from this folder will pick up the rest.

## Related

- Backend lives in a separate repository / folder (`../backend`).
- Shared workspace packages (`@credible/shared`, `@credible/types`) are kept in sync with the backend copy. If you change a type or schema, mirror it on both sides.
