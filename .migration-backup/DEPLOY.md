# Deploying Squawk to Vercel

This guide walks you through deploying the full Squawk stack (frontend + API) to Vercel.

---

## Prerequisites

- A [Vercel](https://vercel.com) account
- A PostgreSQL database (e.g. [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Neon](https://neon.tech), or [Supabase](https://supabase.com))
- A [Clerk](https://clerk.com) account for authentication
- A [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) store for media uploads

---

## Step 1 — Push to GitHub

Vercel imports directly from a Git repository.

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/squawk.git
git push -u origin main
```

---

## Step 2 — Import into Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** and select your repo
3. Vercel will auto-detect the `vercel.json` configuration

**Framework Preset**: select **Other** (the `vercel.json` handles everything)

**Build & Output Settings** — these are already set in `vercel.json`, but confirm:
- Build Command: `pnpm run build:vercel`
- Output Directory: `artifacts/squawk/dist/public`
- Install Command: `pnpm install`

Click **Deploy** (it will fail without env vars — that's expected, set them in the next step).

---

## Step 3 — Set Environment Variables

In your Vercel project → **Settings → Environment Variables**, add:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key (from Clerk dashboard) |
| `CLERK_SECRET_KEY` | Clerk secret key (from Clerk dashboard) |
| `VITE_CLERK_PUBLISHABLE_KEY` | Same as `CLERK_PUBLISHABLE_KEY` |
| `VITE_CLERK_PROXY_URL` | Your Vercel app URL, e.g. `https://squawk.vercel.app` |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token (from Vercel Storage dashboard) |

See `.env.example` for full descriptions.

---

## Step 4 — Set Up Vercel Blob (Media Storage)

1. In your Vercel project → **Storage** → **Create Database** → **Blob**
2. Name it (e.g. `squawk-media`) and click **Create**
3. Go to the store's **.env.local** tab and copy `BLOB_READ_WRITE_TOKEN`
4. Add it to your Vercel environment variables

---

## Step 5 — Set Up the Database

### Option A: Vercel Postgres (Neon)
1. In your Vercel project → **Storage** → **Create Database** → **Postgres**
2. Copy `DATABASE_URL` from the **.env.local** tab
3. Add it as an environment variable

### Option B: External Postgres (Neon, Supabase, Railway)
1. Create a database and get the connection string
2. Add it as `DATABASE_URL`

### Push the schema
After setting `DATABASE_URL`, run this locally to push the Drizzle schema:

```bash
DATABASE_URL=your-connection-string pnpm --filter @workspace/db run push
```

---

## Step 6 — Configure Clerk for Production

1. Go to [clerk.com](https://clerk.com) → Your App → **Production** instance
2. In **Domains**, add your Vercel URL (e.g. `squawk.vercel.app`)
3. Copy the production API keys and update your Vercel env vars

---

## Step 7 — Redeploy

After setting all environment variables, go to **Deployments** → **Redeploy**.

---

## Architecture on Vercel

```
Browser
  │
  ├── GET /           → Vite static build (artifacts/squawk/dist/public/)
  ├── GET /home       → index.html (SPA routing via vercel.json rewrite)
  ├── GET /explore    → index.html
  │
  └── /api/*          → Vercel Serverless Function (api/server.js)
                           └── Express app (artifacts/api-server/)
                                  ├── Postgres via DATABASE_URL
                                  ├── Clerk via CLERK_SECRET_KEY
                                  └── Vercel Blob via BLOB_READ_WRITE_TOKEN
```

---

## Local Development

Local development is unchanged — Replit (or your local machine) runs both servers:

```bash
# Terminal 1 — API server (port 8080)
pnpm --filter @workspace/api-server run dev

# Terminal 2 — Frontend (port 5000)
PORT=5000 BASE_PATH=/ pnpm --filter @workspace/squawk run dev
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Build fails: "PORT is required" | Make sure `NODE_ENV=production` is set in the build command (already done in `build:vercel`) |
| Upload fails with 500 | Check `BLOB_READ_WRITE_TOKEN` is set in Vercel env vars |
| Auth not working | Verify `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `VITE_CLERK_PROXY_URL` are set |
| Database errors | Check `DATABASE_URL` is correct and schema has been pushed |
| API routes return 404 | Verify `vercel.json` is at the project root and rewrites are correct |
