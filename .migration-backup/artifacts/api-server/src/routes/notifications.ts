import { Router, type IRouter } from "express";
import { eq, and, desc, sql } from "drizzle-orm";
import { db, usersTable, notificationsTable } from "@workspace/db";
import { requireUser } from "../lib/auth";
import { buildUserSummary } from "../lib/userHelpers";
import { GetNotificationsQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

function buildNotification(notif: typeof notificationsTable.$inferSelect, actor?: typeof usersTable.$inferSelect) {
  return {
    id: notif.id,
    type: notif.type,
    isRead: notif.isRead,
    actor: actor ? buildUserSummary(actor) : undefined,
    postId: notif.postId ?? null,
    message: notif.message ?? null,
    createdAt: notif.createdAt.toISOString(),
  };
}

// GET /notifications
router.get("/notifications", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const qp = GetNotificationsQueryParams.safeParse(req.query);
  const limit = qp.success ? (qp.data.limit ?? 30) : 30;
  const unreadOnly = qp.success ? qp.data.unreadOnly : false;

  let q = db.select({ notif: notificationsTable, actor: usersTable })
    .from(notificationsTable)
    .leftJoin(usersTable, eq(notificationsTable.actorId, usersTable.id))
    .where(eq(notificationsTable.recipientId, currentUser.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(limit) as any;

  if (unreadOnly) {
    q = db.select({ notif: notificationsTable, actor: usersTable })
      .from(notificationsTable)
      .leftJoin(usersTable, eq(notificationsTable.actorId, usersTable.id))
      .where(and(eq(notificationsTable.recipientId, currentUser.id), eq(notificationsTable.isRead, false)))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(limit);
  }

  const rows = await q;
  res.json(rows.map((r: any) => buildNotification(r.notif, r.actor)));
});

// POST /notifications/read-all
router.post("/notifications/read-all", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  await db.update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.recipientId, currentUser.id));
  res.json({ success: true });
});

// GET /notifications/unread-count
router.get("/notifications/unread-count", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const [result] = await db.select({ count: sql<number>`count(*)::int` })
    .from(notificationsTable)
    .where(and(eq(notificationsTable.recipientId, currentUser.id), eq(notificationsTable.isRead, false)));
  res.json({ count: result?.count ?? 0 });
});

export default router;
