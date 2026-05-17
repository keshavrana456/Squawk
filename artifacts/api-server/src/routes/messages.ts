import { Router, type IRouter } from "express";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db, usersTable, conversationsTable, conversationParticipantsTable, messagesTable } from "@workspace/db";
import { requireUser } from "../lib/auth";
import { buildUserSummary } from "../lib/userHelpers";
import { CreateConversationBody, GetMessagesParams, SendMessageParams, SendMessageBody } from "@workspace/api-zod";

const router: IRouter = Router();

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

  const results = await Promise.all(convoIds.map(async (convoId) => {
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
        sql`${messagesTable.senderId} != ${currentUser.id}`
      ));

    const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, convoId));

    return {
      id: convoId,
      participants: participants.map(p => buildUserSummary(p.user, false)),
      lastMessage: lastMsg ? buildMessageResponse(lastMsg.msg, lastMsg.sender) : undefined,
      unreadCount: unreadResult?.count ?? 0,
      createdAt: conv?.createdAt.toISOString() ?? new Date().toISOString(),
    };
  }));

  res.json(results);
});

// POST /conversations
router.post("/conversations", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [recipient] = await db.select().from(usersTable).where(eq(usersTable.username, parsed.data.recipientUsername));
  if (!recipient) { res.status(404).json({ error: "User not found" }); return; }
  if (recipient.id === currentUser.id) { res.status(400).json({ error: "Cannot message yourself" }); return; }

  // Check if convo exists
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
    existingConvoId = recipientConvos[0]?.conversationId;
  }

  if (existingConvoId) {
    const participants = await db.select({ user: usersTable })
      .from(conversationParticipantsTable)
      .innerJoin(usersTable, eq(conversationParticipantsTable.userId, usersTable.id))
      .where(eq(conversationParticipantsTable.conversationId, existingConvoId));
    const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, existingConvoId));
    res.status(201).json({
      id: existingConvoId,
      participants: participants.map(p => buildUserSummary(p.user, false)),
      unreadCount: 0,
      createdAt: conv?.createdAt.toISOString() ?? new Date().toISOString(),
    });
    return;
  }

  const [conv] = await db.insert(conversationsTable).values({}).returning();
  await db.insert(conversationParticipantsTable).values([
    { conversationId: conv.id, userId: currentUser.id },
    { conversationId: conv.id, userId: recipient.id },
  ]);

  res.status(201).json({
    id: conv.id,
    participants: [buildUserSummary(currentUser, false), buildUserSummary(recipient, false)],
    unreadCount: 0,
    createdAt: conv.createdAt.toISOString(),
  });
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

  // Mark as read
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
