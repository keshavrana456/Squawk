import { Router, type IRouter } from "express";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db, usersTable, conversationsTable, conversationParticipantsTable, messagesTable } from "@workspace/db";
import { requireUser } from "../lib/auth";
import { buildUserSummary } from "../lib/userHelpers";
import { GetMessagesParams, SendMessageParams, SendMessageBody } from "@workspace/api-zod";
import { z } from "zod";

const router: IRouter = Router();

// Run migration to add new columns if they don't exist
(async () => {
  try {
    await db.execute(sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT FALSE`);
    await db.execute(sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS name TEXT`);
    await db.execute(sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
  } catch (e) {
    // columns may already exist
  }
})();

function buildMessageResponse(msg: typeof messagesTable.$inferSelect, sender: typeof usersTable.$inferSelect) {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    sender: buildUserSummary(sender),
    content: msg.content,
    mediaUrl: msg.mediaUrl ?? null,
    createdAt: msg.createdAt.toISOString(),
  };
}

async function buildConversationResponse(convoId: number, currentUserId: number) {
  const participants = await db.select({ user: usersTable })
    .from(conversationParticipantsTable)
    .innerJoin(usersTable, eq(conversationParticipantsTable.userId, usersTable.id))
    .where(eq(conversationParticipantsTable.conversationId, convoId));

  const [lastMsg] = await db.select({ msg: messagesTable, sender: usersTable })
    .from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
    .where(eq(messagesTable.conversationId, convoId))
    .orderBy(desc(messagesTable.createdAt))
    .limit(1);

  const [unreadResult] = await db.select({ count: sql<number>`count(*)::int` })
    .from(messagesTable)
    .where(and(
      eq(messagesTable.conversationId, convoId),
      eq(messagesTable.isRead, false),
      sql`${messagesTable.senderId} != ${currentUserId}`
    ));

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, convoId));

  return {
    id: convoId,
    isGroup: conv?.isGroup ?? false,
    name: conv?.name ?? null,
    avatarUrl: conv?.avatarUrl ?? null,
    participants: participants.map(p => buildUserSummary(p.user, false)),
    lastMessage: lastMsg ? buildMessageResponse(lastMsg.msg, lastMsg.sender) : undefined,
    unreadCount: unreadResult?.count ?? 0,
    createdAt: conv?.createdAt.toISOString() ?? new Date().toISOString(),
  };
}

// GET /conversations
router.get("/conversations", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;

  const myConvos = await db.select({ conversationId: conversationParticipantsTable.conversationId })
    .from(conversationParticipantsTable)
    .where(eq(conversationParticipantsTable.userId, currentUser.id));

  const convoIds = myConvos.map(c => c.conversationId);

  if (convoIds.length === 0) {
    res.json([]);
    return;
  }

  const results = await Promise.all(convoIds.map(id => buildConversationResponse(id, currentUser.id)));
  res.json(results);
});

// POST /conversations  (direct message)
router.post("/conversations", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;

  const parsed = z.object({ username: z.string().optional(), recipientUsername: z.string().optional() }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body" }); return; }

  const targetUsername = parsed.data.username || parsed.data.recipientUsername;
  if (!targetUsername) { res.status(400).json({ error: "username is required" }); return; }

  const [recipient] = await db.select().from(usersTable).where(eq(usersTable.username, targetUsername));
  if (!recipient) { res.status(404).json({ error: "User not found" }); return; }
  if (recipient.id === currentUser.id) { res.status(400).json({ error: "Cannot message yourself" }); return; }

  const myConvos = await db.select({ conversationId: conversationParticipantsTable.conversationId })
    .from(conversationParticipantsTable)
    .where(eq(conversationParticipantsTable.userId, currentUser.id));
  const myConvoIds = myConvos.map(c => c.conversationId);

  let existingConvoId: number | undefined;
  if (myConvoIds.length > 0) {
    const recipientConvos = await db.select({ conversationId: conversationParticipantsTable.conversationId })
      .from(conversationParticipantsTable)
      .where(and(
        eq(conversationParticipantsTable.userId, recipient.id),
        inArray(conversationParticipantsTable.conversationId, myConvoIds)
      ));
    // only use existing if it's a DM (not a group)
    for (const rc of recipientConvos) {
      const [c] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, rc.conversationId));
      if (c && !c.isGroup) { existingConvoId = rc.conversationId; break; }
    }
  }

  if (existingConvoId) {
    const result = await buildConversationResponse(existingConvoId, currentUser.id);
    res.status(201).json(result);
    return;
  }

  const [conv] = await db.insert(conversationsTable).values({ isGroup: false }).returning();
  await db.insert(conversationParticipantsTable).values([
    { conversationId: conv.id, userId: currentUser.id },
    { conversationId: conv.id, userId: recipient.id },
  ]);

  const result = await buildConversationResponse(conv.id, currentUser.id);
  res.status(201).json(result);
});

// POST /conversations/group
router.post("/conversations/group", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;

  const parsed = z.object({
    name: z.string().min(1).max(80),
    usernames: z.array(z.string()).min(1).max(49),
  }).safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { name, usernames } = parsed.data;

  const members = await db.select().from(usersTable).where(inArray(usersTable.username, usernames));
  if (members.length === 0) { res.status(400).json({ error: "No valid users found" }); return; }

  const [conv] = await db.insert(conversationsTable).values({ isGroup: true, name }).returning();

  const participantValues = [
    { conversationId: conv.id, userId: currentUser.id },
    ...members.map(m => ({ conversationId: conv.id, userId: m.id })),
  ];
  await db.insert(conversationParticipantsTable).values(participantValues);

  const result = await buildConversationResponse(conv.id, currentUser.id);
  res.status(201).json(result);
});

// GET /conversations/:id/messages
router.get("/conversations/:id/messages", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const params = GetMessagesParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const rows = await db.select({ msg: messagesTable, sender: usersTable })
    .from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(desc(messagesTable.createdAt))
    .limit(50);

  await db.update(messagesTable).set({ isRead: true }).where(
    and(eq(messagesTable.conversationId, params.data.id), sql`${messagesTable.senderId} != ${currentUser.id}`)
  );

  res.json({
    messages: rows.reverse().map(r => buildMessageResponse(r.msg, r.sender)),
    hasMore: false,
    nextCursor: null,
  });
});

// POST /conversations/:id/messages
router.post("/conversations/:id/messages", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = SendMessageBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const [msg] = await db.insert(messagesTable).values({
    conversationId: params.data.id,
    senderId: currentUser.id,
    content: body.data.content,
    mediaUrl: body.data.mediaUrl ?? null,
  }).returning();

  res.status(201).json(buildMessageResponse(msg, currentUser));
});

export default router;
