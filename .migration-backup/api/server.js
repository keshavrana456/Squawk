/**
 * Vercel Serverless Function — API handler
 *
 * All /api/* requests are routed here by vercel.json rewrites.
 * The Express app handles routing internally.
 *
 * Built by: pnpm --filter @workspace/api-server run build
 * Source:   artifacts/api-server/src/vercel-handler.ts
 * Output:   artifacts/api-server/dist/vercel/vercel-handler.cjs
 */
const { default: app } = require("../artifacts/api-server/dist/vercel/vercel-handler.cjs");

module.exports = app;
