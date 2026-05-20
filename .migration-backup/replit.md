# Squawk

A full-stack social media platform inspired by Instagram, TikTok, and Discord — dark neon aesthetic, creator-focused, built for real-time social connection.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000 / workflow port 8080)
- `pnpm --filter @workspace/squawk run dev` — run the React frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS v4, Framer Motion, Wouter, shadcn/ui components
- Auth: Clerk (Replit-managed, whitelabel, cookie-based for web)
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Media: Replit Object Storage (presigned URL upload flow)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks
- `lib/api-zod/src/generated/api.ts` — generated Zod validation schemas
- `lib/db/src/schema/` — Drizzle ORM schema (users, posts, stories, messages, notifications)
- `artifacts/api-server/src/routes/` — Express route handlers (users, posts, stories, feed, explore, messages, notifications, storage)
- `artifacts/squawk/src/pages/` — React pages (Home, Explore, Reels, Messages, Notifications, Upload, Profile, Post, Settings)
- `artifacts/squawk/src/components/` — Shared UI components (PostCard, StoriesRow, UserCard, PostGrid, UploadFlow)

## Architecture decisions

- **Contract-first API**: OpenAPI spec defined first, Orval generates typed React Query hooks + Zod validators. Server also uses generated Zod schemas for request validation.
- **Clerk whitelabel auth**: Cookie-based sessions (no Bearer tokens). `publishableKeyFromHost()` auto-selects key by hostname. ClerkProvider proxy at `CLERK_PROXY_PATH`.
- **Object Storage presigned URL flow**: Client requests upload URL from `/api/storage/uploads/request-url`, PUTs file directly to returned `uploadURL`, then saves `objectPath` in DB. Files served via `/api/storage/objects/:objectPath`.
- **Drizzle ORM schema split**: Each domain in its own schema file (`users.ts`, `posts.ts`, `stories.ts`, `messages.ts`, `notifications.ts`) — all barrel-exported via `lib/db/src/schema/index.ts`.
- **TS2308 avoidance**: Endpoints with both path params AND query params cause Orval to collide on `*Params` type names. Fixed by removing pagination from `getUserPosts`, `getHashtagPosts`, `getMessages` endpoints in OpenAPI spec.

## Product

- **Home feed**: Stories row + infinite scroll personalized feed from followed users
- **Explore**: Search users/posts, trending hashtags, suggested users, trending posts grid
- **Reels**: Full-screen TikTok-style vertical swipeable feed with autoplay
- **Messages**: Two-panel real-time-feeling DMs with conversation list + chat
- **Notifications**: Categorized notification center (likes, comments, follows, mentions)
- **Upload**: Drag-and-drop media upload with caption and hashtag editor
- **Profile**: Cover photo + stats grid + posts grid + follow/unfollow
- **Settings**: Edit profile (name, bio, avatar, cover photo)

## User preferences

_No explicit preferences recorded yet._

## Gotchas

- After changing DB schema files, always run `pnpm run typecheck:libs` (rebuilds composite lib) before running `pnpm --filter @workspace/api-server run typecheck`.
- Always run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml` — this regenerates both React Query hooks and Zod schemas.
- Do NOT add both path params AND query params to the same OpenAPI endpoint — Orval will generate conflicting `*Params` type names (TS2308).
- Clerk proxy middleware must be mounted BEFORE `clerkMiddleware()` in `app.ts`.
- `VITE_CLERK_PROXY_URL` must be used unconditionally (never gate on NODE_ENV) — it's empty in dev, auto-set in production.
- The `@clerk/themes` shadcn CSS layer must be imported BEFORE `@import "tailwindcss"` in `index.css` and declared with `@layer theme, base, clerk, components, utilities`.
- Set `tailwindcss({ optimize: false })` in vite.config.ts for Tailwind v4 + Clerk compatibility.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- See `.local/skills/clerk-auth/` for Clerk auth setup and customization details
- See `.local/skills/object-storage/` for Object Storage upload/serve patterns
