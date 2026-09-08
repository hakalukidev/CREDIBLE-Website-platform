# Credible

This repository is split into two independent projects that are deployed separately:

| Folder      | Description                          | Deploy target     |
| ----------- | ------------------------------------ | ----------------- |
| `frontend/` | Next.js 16 web app                   | Vercel (or any)   |
| `backend/`  | Express 5 + Prisma 6 REST API        | Render.com (or any) |

See each subfolder's `README.md` for setup, scripts, environment variables, and deployment instructions.

## Repository layout

```
credible/
├── frontend/    # Next.js app (consumer-facing site + dashboards)
└── backend/     # Node API + Prisma schema + background workers
```

Each folder is a self-contained npm project. They share TypeScript types and zod schemas by **duplicating** two small workspace packages (`@credible/types`, `@credible/shared`) inside each — there is no monorepo workspace at this level. If you change a type or schema on one side, mirror it on the other.

## Quick start

```bash
# Frontend
cd frontend
npm install
cp .env.example .env
npm run dev          # http://localhost:3000

# Backend (in another terminal)
cd backend
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run seed         # optional
npm run dev          # http://localhost:4000/api/v1
```