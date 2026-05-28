import { Router, type IRouter } from "express";
import { StreamClient } from "@stream-io/node-sdk";
import { requireUser } from "../lib/auth";

const router: IRouter = Router();

const apiKey = process.env.STREAM_API_KEY!;
const apiSecret = process.env.STREAM_API_SECRET!;

router.get("/stream/token", requireUser, async (req, res): Promise<void> => {
  try {
    const currentUser = (req as any).currentUser;
    const client = new StreamClient(apiKey, apiSecret);
    const token = client.generateUserToken({ user_id: String(currentUser.id) });
    res.json({ token, apiKey, userId: String(currentUser.id) });
  } catch (err) {
    console.error("[stream/token] error:", err);
    res.status(500).json({ error: "Failed to generate Stream token" });
  }
});

export default router;
