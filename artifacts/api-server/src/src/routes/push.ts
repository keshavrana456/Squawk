import { Router, type IRouter } from "express";
import { requireUser } from "../lib/auth";
import { saveSubscription, ensureTable } from "../lib/push";

const router: IRouter = Router();

ensureTable();

router.get("/push/vapid-public-key", (_req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY ?? "" });
});

router.post("/push/subscribe", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser;
  const { subscription } = req.body as {
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  };

  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    res.status(400).json({ error: "Invalid subscription" });
    return;
  }

  await saveSubscription(currentUser.id, subscription);
  res.json({ success: true });
});

export default router;
