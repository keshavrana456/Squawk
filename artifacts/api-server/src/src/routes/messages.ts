import { Router, type IRouter } from "express";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db, usersTable, conversationsTable, conversationParticipantsTable, messagesTable } from "@workspace/db";
import { requireUser } from "../lib/auth";
import { buildUserSummary } from "../lib/userHelpers";
import { GetMessagesParams, SendMessageParams } from "@workspace/api-zod";
import { z } from "zod";
import { emitToConversation, emitToUser } from "../lib/socket";

const router: IRouter = Router();

// Run migration to add new columns if they don't exist
(async () => {
  try {
    await db.execute(sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_group BOOLEAN NOT NULL DEFAULT FALSE`);
    await db.execute(sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS name TEXT`);
    await db.execute(sql`ALTER TABLE conversations ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
    await db.execute(sql`ALTER TABLE messages ALTER COLUMN content SET DEFAULT ''`);
    await db.execute(sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT NOT NULL DEFAULT 'text'`);
    await db.execute(sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_message_id INTEGER`);
    await db.execute(sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS gif_url TEXT`);
    await db.execute(sql`ALTER TABLE messages ADD COLUMN IF NOT EXISTS shared_post_id INTEGER`);
  } catch {
    // columns may already exist
  }
})();

const ExtendedMessageBody = z.object({
  content: z.string().optional().default(""),
  mediaUrl: z.string().nullish(),
  messageType: z.enum(["text", "gif", "image", "video", "shared_post"]).optional().default("text"),
  replyToMessageId: z.number().int().positive().optional(),
  gifUrl: z.string().url().optional(),
  sharedPostId: z.number().int().positive().optional(),
});

function buildMessageResponse(
  msg: typeof messagesTable.$inferSelect,
  sender: typeof usersTable.$inferSelect,
  replyToMsg?: (typeof messagesTable.$inferSelect & { senderUser: typeof usersTable.$inferSelect }) | null
) {
  return {
    id: msg.id,
    conversationId: msg.conversationId,
    senderId: msg.senderId,
    sender: buildUserSummary(sender),
    content: msg.content,
    mediaUrl: msg.mediaUrl ?? null,
    messageType: (msg as any).messageType ?? "text",
    gifUrl: (msg as any).gifUrl ?? null,
    sharedPostId: (msg as any).sharedPostId ?? null,
    replyToMessageId: (msg as any).replyToMessageId ?? null,
    replyTo: replyToMsg
      ? {
          id: replyToMsg.id,
          content: replyToMsg.content,
          sender: buildUserSummary(replyToMsg.senderUser),
          messageType: (replyToMsg as any).messageType ?? "text",
          gifUrl: (replyToMsg as any).gifUrl ?? null,
        }
      : null,
    isRead: msg.isRead,
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
  // Sort by most recent message
  results.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ?? a.createdAt;
    const bTime = b.lastMessage?.createdAt ?? b.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });
  res.json(results);
});

// GET /conversations/unread-count
router.get("/conversations/unread-count", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;

  const myConvos = await db.select({ conversationId: conversationParticipantsTable.conversationId })
    .from(conversationParticipantsTable)
    .where(eq(conversationParticipantsTable.userId, currentUser.id));

  const convoIds = myConvos.map(c => c.conversationId);
  if (convoIds.length === 0) { res.json({ count: 0 }); return; }

  const [result] = await db.select({ count: sql<number>`count(*)::int` })
    .from(messagesTable)
    .where(and(
      inArray(messagesTable.conversationId, convoIds),
      eq(messagesTable.isRead, false),
      sql`${messagesTable.senderId} != ${currentUser.id}`
    ));

  res.json({ count: result?.count ?? 0 });
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

  const [membership] = await db.select()
    .from(conversationParticipantsTable)
    .where(and(
      eq(conversationParticipantsTable.conversationId, params.data.id),
      eq(conversationParticipantsTable.userId, currentUser.id)
    ));
  if (!membership) { res.status(403).json({ error: "Forbidden" }); return; }

  const rows = await db.select({ msg: messagesTable, sender: usersTable })
    .from(messagesTable)
    .innerJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
    .where(eq(messagesTable.conversationId, params.data.id))
    .orderBy(desc(messagesTable.createdAt))
    .limit(50);

  // Fetch reply-to messages in batch
  const replyIds = rows
    .map(r => (r.msg as any).replyToMessageId)
    .filter((id): id is number => typeof id === "number");

  const replyMap = new Map<number, typeof messagesTable.$inferSelect & { senderUser: typeof usersTable.$inferSelect }>();
  if (replyIds.length > 0) {
    const replyRows = await db.select({ msg: messagesTable, senderUser: usersTable })
      .from(messagesTable)
      .innerJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
      .where(inArray(messagesTable.id, replyIds));
    for (const r of replyRows) {
      replyMap.set(r.msg.id, { ...r.msg, senderUser: r.senderUser });
    }
  }

  // Mark messages as read
  await db.update(messagesTable).set({ isRead: true }).where(
    and(eq(messagesTable.conversationId, params.data.id), sql`${messagesTable.senderId} != ${currentUser.id}`)
  );

  // Notify sender that messages were read
  const senderIds = [...new Set(rows.map(r => r.msg.senderId).filter(id => id !== currentUser.id))];
  for (const senderId of senderIds) {
    emitToUser(String(senderId), "messages_read", { conversationId: params.data.id, readBy: currentUser.id });
  }

  res.json({
    messages: rows.reverse().map(r => {
      const replyToId = (r.msg as any).replyToMessageId;
      const replyTo = replyToId ? replyMap.get(replyToId) ?? null : null;
      return buildMessageResponse(r.msg, r.sender, replyTo);
    }),
    hasMore: false,
    nextCursor: null,
  });
});

// POST /conversations/:id/messages
router.post("/conversations/:id/messages", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const params = SendMessageParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [membership] = await db.select()
    .from(conversationParticipantsTable)
    .where(and(
      eq(conversationParticipantsTable.conversationId, params.data.id),
      eq(conversationParticipantsTable.userId, currentUser.id)
    ));
  if (!membership) { res.status(403).json({ error: "Forbidden" }); return; }

  const body = ExtendedMessageBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  // Require content OR mediaUrl OR gifUrl
  if (!body.data.content && !body.data.mediaUrl && !body.data.gifUrl) {
    res.status(400).json({ error: "Message must have content, media, or a GIF" });
    return;
  }

  const [msg] = await db.insert(messagesTable).values({
    conversationId: params.data.id,
    senderId: currentUser.id,
    content: body.data.content ?? "",
    mediaUrl: body.data.mediaUrl ?? null,
    ...(body.data.messageType && { messageType: body.data.messageType }),
    ...(body.data.replyToMessageId && { replyToMessageId: body.data.replyToMessageId }),
    ...(body.data.gifUrl && { gifUrl: body.data.gifUrl }),
    ...(body.data.sharedPostId && { sharedPostId: body.data.sharedPostId }),
  } as any).returning();

  // Fetch reply-to for response
  let replyTo: (typeof messagesTable.$inferSelect & { senderUser: typeof usersTable.$inferSelect }) | null = null;
  if ((msg as any).replyToMessageId) {
    const [rr] = await db.select({ msg: messagesTable, senderUser: usersTable })
      .from(messagesTable)
      .innerJoin(usersTable, eq(messagesTable.senderId, usersTable.id))
      .where(eq(messagesTable.id, (msg as any).replyToMessageId));
    if (rr) replyTo = { ...rr.msg, senderUser: rr.senderUser };
  }

  const msgResponse = buildMessageResponse(msg, currentUser, replyTo);

  // Real-time: broadcast to everyone in the conversation room
  emitToConversation(String(params.data.id), "new_message", msgResponse);

  // Notify all other participants' user rooms
  const participants = await db.select({ userId: conversationParticipantsTable.userId })
    .from(conversationParticipantsTable)
    .where(eq(conversationParticipantsTable.conversationId, params.data.id));
  for (const p of participants) {
    if (p.userId !== currentUser.id) {
      emitToUser(String(p.userId), "conversation_updated", { conversationId: params.data.id });
    }
  }

  res.status(201).json(msgResponse);
});

export default router;
