# Squawk

Squawk is a social media platform for the 10K Squad and Monad community — a Twitter/Instagram-style app with posts, reels, chirps, messages, explore, notifications, and user profiles.

## Run & Operate

- `artifacts/squawk: web` workflow — frontend Vite dev server (port 19926)
- `artifacts/api-server: API Server` workflow — Express API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind v4 + wouter + shadcn/ui (`artifacts/squawk/`)
- API: Express 5 (`artifacts/api-server/`)
- Auth: Clerk (Replit-managed, keys auto-provisioned)
- DB: PostgreSQL + Drizzle ORM (`lib/db/`)
- Validation: Zod, `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (ESM bundle)

## Where things live

- `artifacts/squawk/src/App.tsx` — root router + Clerk provider
- `artifacts/squawk/src/pages/` — all page components (Home, Explore, Reels, Chirps, Messages, Notifications, Profile, Settings, etc.)
- `artifacts/squawk/src/components/` — shared UI components
- `artifacts/api-server/src/routes/` — Express route handlers
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/api-client-react/src/generated/` — auto-generated React Query hooks (do not edit)
- `lib/db/src/` — Drizzle schema and migrations

## Architecture decisions

- Replit-managed Clerk auth with proxy middleware — `CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are auto-provisioned
- API routes served at `/api`, frontend at `/` via the shared reverse proxy
- `publishableKeyFromHost()` used for multi-domain Clerk key resolution in both frontend and backend
- Vercel serverless handler build step removed from `build.mjs` — Replit uses the ESM bundle only

## Product

Social platform for the Monad/10K Squad community with: feed, explore, reels, chirps (short posts), DMs, notifications, user profiles with follow/unfollow, post upload with NFT minting, settings, and an animated splash screen.

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing `lib/api-spec/openapi.yaml`
- The `build.mjs` Vercel handler step was removed — do not re-add it
- Clerk "development keys" warning in console is expected and normal during development

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
