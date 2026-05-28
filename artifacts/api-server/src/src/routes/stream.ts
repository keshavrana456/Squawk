import { Router, type IRouter } from "express";
import { createHmac } from "node:crypto";
import { requireUser } from "../lib/auth";

const router: IRouter = Router();

function base64urlEncode(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function generateStreamToken(userId: string, apiSecret: string): string {
  const header = base64urlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64urlEncode(
    JSON.stringify({ user_id: userId, iat: now, exp: now + 60 * 60 * 24 })
  );
  const signing = `${header}.${payload}`;
  const sig = createHmac("sha256", apiSecret)
    .update(signing)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
  return `${signing}.${sig}`;
}

router.get("/stream/token", requireUser, (req, res): void => {
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;
  if (!apiKey || !apiSecret) {
    res.status(503).json({ error: "Stream not configured" });
    return;
  }
  const currentUser = (req as any).currentUser;
  const token = generateStreamToken(String(currentUser.id), apiSecret);
  res.json({ token, apiKey, userId: String(currentUser.id) });
});

export default router;
