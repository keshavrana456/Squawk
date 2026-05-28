import webpush from "web-push";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

let initialized = false;

function ensureInit() {
  if (initialized) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return;
  webpush.setVapidDetails("mailto:squawk069@gmail.com", pub, priv);
  initialized = true;
}

export async function ensureTable() {
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        endpoint TEXT NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id, endpoint)
      )
    `);
  } catch {}
}

export async function saveSubscription(userId: number, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  await db.execute(sql`
    INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
    VALUES (${userId}, ${subscription.endpoint}, ${subscription.keys.p256dh}, ${subscription.keys.auth})
    ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = ${subscription.keys.p256dh}, auth = ${subscription.keys.auth}
  `);
}

interface PushOptions {
  tag?: string;
  requireInteraction?: boolean;
  renotify?: boolean;
  actions?: Array<{ action: string; title: string }>;
  isCall?: boolean;
}

export async function sendPushToUser(
  userId: number,
  title: string,
  body: string,
  url = "/",
  opts: PushOptions = {}
) {
  ensureInit();
  if (!initialized) return;
  try {
    const result = await db.execute(sql`
      SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ${userId}
    `);
    const payload = JSON.stringify({
      title,
      body,
      url,
      icon: "/logo.png",
      badge: "/logo.png",
      tag: opts.tag,
      requireInteraction: opts.requireInteraction ?? false,
      renotify: opts.renotify ?? true,
      actions: opts.actions,
      isCall: opts.isCall ?? false,
    });
    for (const row of result.rows as any[]) {
      const sub = {
        endpoint: row.endpoint as string,
        keys: { p256dh: row.p256dh as string, auth: row.auth as string },
      };
      await webpush.sendNotification(sub, payload).catch(async (err) => {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.execute(sql`DELETE FROM push_subscriptions WHERE endpoint = ${row.endpoint}`).catch(() => {});
        }
      });
    }
  } catch {}
}
