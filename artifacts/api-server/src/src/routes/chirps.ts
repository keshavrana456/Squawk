import { Router, type IRouter } from "express";
import { eq, and, desc, sql, isNull, inArray, notInArray } from "drizzle-orm";
import {
  db, usersTable, followsTable,
  chirpsTable, chirpLikesTable, chirpSavesTable, chirpCommentsTable,
  notificationsTable, blocksTable,
} from "@workspace/db";
import { requireUser, optionalUser } from "../lib/auth";
import { emitToUser } from "../lib/socket";
import { sendPushToUser } from "../lib/push";
import { buildUserSummary } from "../lib/userHelpers";
import { syncChirpToSupabase } from "../lib/supabaseSync";

const router: IRouter = Router();

async function buildChirpWithMeta(chirp: typeof chirpsTable.$inferSelect, author: typeof usersTable.$inferSelect, currentUserId?: number) {
  const [likesResult, commentsResult, rechirpsResult, isLikedResult, isSavedResult, followResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(chirpLikesTable).where(eq(chirpLikesTable.chirpId, chirp.id)),
    db.select({ count: sql<number>`count(*)::int` }).from(chirpsTable).where(eq(chirpsTable.parentId, chirp.id)),
    db.select({ count: sql<number>`count(*)::int` }).from(chirpsTable).where(eq(chirpsTable.rechirpOfId, chirp.id)),
    currentUserId
      ? db.select().from(chirpLikesTable).where(and(eq(chirpLikesTable.userId, currentUserId), eq(chirpLikesTable.chirpId, chirp.id)))
      : Promise.resolve([]),
    currentUserId
      ? db.select().from(chirpSavesTable).where(and(eq(chirpSavesTable.userId, currentUserId), eq(chirpSavesTable.chirpId, chirp.id)))
      : Promise.resolve([]),
    currentUserId && currentUserId !== author.id
      ? db.select().from(followsTable).where(and(eq(followsTable.followerId, currentUserId), eq(followsTable.followingId, author.id)))
      : Promise.resolve([]),
  ]);

  // Fetch original chirp for rechirps
  let originalChirp: any = null;
  if (chirp.rechirpOfId) {
    const [origRow] = await db.select({ chirp: chirpsTable, author: usersTable })
      .from(chirpsTable)
      .innerJoin(usersTable, eq(chirpsTable.authorId, usersTable.id))
      .where(eq(chirpsTable.id, chirp.rechirpOfId));
    if (origRow) {
      originalChirp = {
        id: origRow.chirp.id,
        author: buildUserSummary(origRow.author),
        content: origRow.chirp.content,
        mediaUrl: origRow.chirp.mediaUrl ?? null,
        mediaType: origRow.chirp.mediaType ?? null,
        hashtags: origRow.chirp.hashtags ?? [],
        createdAt: origRow.chirp.createdAt.toISOString(),
      };
    }
  }

  return {
    id: chirp.id,
    authorId: chirp.authorId,
    author: buildUserSummary(author, (followResult as any[]).length > 0),
    content: chirp.content,
    hashtags: chirp.hashtags ?? [],
    mentions: chirp.mentions ?? [],
    mediaUrl: chirp.mediaUrl ?? null,
    mediaType: chirp.mediaType ?? null,
    parentId: chirp.parentId ?? null,
    rechirpOfId: chirp.rechirpOfId ?? null,
    quoteOfId: chirp.quoteOfId ?? null,
    originalChirp,
    viewCount: chirp.viewCount,
    likesCount: likesResult[0]?.count ?? 0,
    commentsCount: commentsResult[0]?.count ?? 0,
    rechirpsCount: rechirpsResult[0]?.count ?? 0,
    isLiked: (isLikedResult as any[]).length > 0,
    isSaved: (isSavedResult as any[]).length > 0,
    createdAt: chirp.createdAt.toISOString(),
  };
}

// GET /chirps — timeline feed (top-level only)
router.get("/chirps", optionalUser, async (req, res): Promise<void> => {
  const limit = Math.min(parseInt(String(req.query.limit ?? "20"), 10), 50);
  const cursor = req.query.cursor ? parseInt(String(req.query.cursor), 10) : null;
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect | undefined;

  const username = req.query.username ? String(req.query.username) : null;

  // If filtering by username: return all chirps authored OR rechirped by that user
  if (username) {
    const [userRow] = await db.select().from(usersTable).where(eq(usersTable.username, username));
    if (!userRow) { res.json({ items: [], hasMore: false, nextCursor: null }); return; }
    const uid = userRow.id;

    // Get original chirps + rechirps authored by this user (no parent = top-level)
    const rows = await db.select({ chirp: chirpsTable, author: usersTable })
      .from(chirpsTable)
      .innerJoin(usersTable, eq(chirpsTable.authorId, usersTable.id))
      .where(and(eq(chirpsTable.authorId, uid), isNull(chirpsTable.parentId)))
      .orderBy(desc(chirpsTable.createdAt))
      .limit(limit);

    // Add isRechirped flag per chirp when current user is known
    const items = await Promise.all(rows.map(async (r: any) => {
      const base = await buildChirpWithMeta(r.chirp, r.author, currentUser?.id);
      const isRechirped = r.chirp.rechirpOfId != null;
      return { ...base, isRechirped };
    }));

    res.json({ items, hasMore: false, nextCursor: null });
    return;
  }

  // Get blocked user IDs in both directions
  let blockedIds: number[] = [];
  if (currentUser) {
    const [blockedByMe, blockedMe] = await Promise.all([
      db.select({ id: blocksTable.blockedId }).from(blocksTable).where(eq(blocksTable.blockerId, currentUser.id)),
      db.select({ id: blocksTable.blockerId }).from(blocksTable).where(eq(blocksTable.blockedId, currentUser.id)),
    ]);
    blockedIds = [...new Set([...blockedByMe.map(b => b.id), ...blockedMe.map(b => b.id)])];
  }

  const baseWhere = blockedIds.length > 0
    ? and(isNull(chirpsTable.parentId), notInArray(chirpsTable.authorId, blockedIds))
    : isNull(chirpsTable.parentId);

  let q = db.select({ chirp: chirpsTable, author: usersTable })
    .from(chirpsTable)
    .innerJoin(usersTable, eq(chirpsTable.authorId, usersTable.id))
    .where(baseWhere)
    .orderBy(desc(chirpsTable.createdAt))
    .limit(limit + 1) as any;

  if (cursor) {
    q = db.select({ chirp: chirpsTable, author: usersTable })
      .from(chirpsTable)
      .innerJoin(usersTable, eq(chirpsTable.authorId, usersTable.id))
      .where(blockedIds.length > 0
        ? and(isNull(chirpsTable.parentId), sql`${chirpsTable.id} < ${cursor}`, notInArray(chirpsTable.authorId, blockedIds))
        : and(isNull(chirpsTable.parentId), sql`${chirpsTable.id} < ${cursor}`))
      .orderBy(desc(chirpsTable.createdAt))
      .limit(limit + 1);
  }

  const rows = await q;
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;

  // Add isRechirped flag (whether each chirp is itself a rechirp)
  const items = await Promise.all(data.map(async (r: any) => {
    const base = await buildChirpWithMeta(r.chirp, r.author, currentUser?.id);
    const isRechirped = r.chirp.rechirpOfId != null;
    // Check if current user has rechirped this chirp
    const isRechirpedByMe = currentUser
      ? (await db.select({ id: chirpsTable.id }).from(chirpsTable).where(and(eq(chirpsTable.authorId, currentUser.id), eq(chirpsTable.rechirpOfId, r.chirp.id))).limit(1)).length > 0
      : false;
    return { ...base, isRechirped, isRechirpedByMe };
  }));

  res.json({ items, hasMore, nextCursor: hasMore ? data[data.length - 1].chirp.id : null });
});

// POST /chirps — create chirp
router.post("/chirps", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const { content, hashtags, mentions, mediaUrl, mediaType, parentId, quoteOfId } = req.body;
  if (!content || typeof content !== "string" || content.trim().length === 0) {
    res.status(400).json({ error: "Content is required" });
    return;
  }
  const [chirp] = await db.insert(chirpsTable).values({
    authorId: currentUser.id,
    content: content.trim().slice(0, 500),
    hashtags: Array.isArray(hashtags) ? hashtags : [],
    mentions: Array.isArray(mentions) ? mentions : [],
    mediaUrl: mediaUrl ?? null,
    mediaType: mediaType ?? null,
    parentId: parentId ? parseInt(String(parentId), 10) : null,
    quoteOfId: quoteOfId ? parseInt(String(quoteOfId), 10) : null,
  }).returning();
  syncChirpToSupabase(chirp).catch(() => {});

  if (parentId) {
    const pid = parseInt(String(parentId), 10);
    await db.insert(chirpCommentsTable).values({
      chirpId: pid,
      authorId: currentUser.id,
      content: content.trim().slice(0, 500),
    });
    // Notify parent chirp author
    const [parentChirp] = await db.select().from(chirpsTable).where(eq(chirpsTable.id, pid));
    if (parentChirp && parentChirp.authorId !== currentUser.id) {
      await db.insert(notificationsTable).values({
        recipientId: parentChirp.authorId,
        actorId: currentUser.id,
        type: "comment",
        message: content.trim().slice(0, 100),
      }).onConflictDoNothing();
      emitToUser(parentChirp.authorId, "notification", {
        type: "comment",
        actorUsername: currentUser.username,
        actorDisplayName: currentUser.displayName,
        actorAvatarUrl: currentUser.avatarUrl,
        message: content.trim().slice(0, 100),
        url: `/chirps/${parentChirp.id}?comment=${chirp.id}`,
        createdAt: new Date().toISOString(),
      });
      sendPushToUser(
        parentChirp.authorId,
        `${currentUser.displayName} replied to your chirp`,
        content.trim().slice(0, 100),
        `/chirps/${parentChirp.id}?comment=${chirp.id}`
      );
    }
  }

  // Mention notifications (fire-and-forget)
  ;(async () => {
    const allMentions = Array.isArray(mentions) && mentions.length > 0
      ? mentions as string[]
      : (content.match(/@(\w+)/g) ?? []).map((m: string) => m.slice(1));
    const uniqueHandles = [...new Set(allMentions.map((h: string) => h.toLowerCase()))];
    if (uniqueHandles.length === 0) return;
    const mentionedUsers = await db.select().from(usersTable).where(inArray(usersTable.username, uniqueHandles));
    for (const mentioned of mentionedUsers) {
      if (mentioned.id === currentUser.id) continue;
      await db.insert(notificationsTable).values({
        recipientId: mentioned.id,
        actorId: currentUser.id,
        type: "mention" as const,
        message: content.trim().slice(0, 100),
      }).onConflictDoNothing();
      emitToUser(mentioned.id, "notification", {
        type: "mention",
        actorUsername: currentUser.username,
        actorDisplayName: currentUser.displayName,
        actorAvatarUrl: currentUser.avatarUrl,
        message: `${currentUser.displayName} mentioned you in a chirp`,
        url: `/chirps/${chirp.id}`,
        createdAt: new Date().toISOString(),
      });
      sendPushToUser(mentioned.id, `${currentUser.displayName} mentioned you in a chirp`, content.trim().slice(0, 80), `/chirps/${chirp.id}`);
    }
  })().catch(() => {});

  const result = await buildChirpWithMeta(chirp, currentUser, currentUser.id);
  res.status(201).json(result);
});

// GET /chirps/trending — trending hashtags
router.get("/chirps/trending", optionalUser, async (_req, res): Promise<void> => {
  const rows = await db.select({
    hashtag: sql<string>`unnest(${chirpsTable.hashtags})`,
    count: sql<number>`count(*)::int`,
  })
    .from(chirpsTable)
    .groupBy(sql`unnest(${chirpsTable.hashtags})`)
    .orderBy(desc(sql`count(*)`))
    .limit(10);

  res.json({ trending: rows.map(r => ({ hashtag: r.hashtag, count: r.count })) });
});

// GET /chirps/:id — single chirp with replies
router.get("/chirps/:id", optionalUser, async (req, res): Promise<void> => {
  const chirpId = parseInt(req.params.id, 10);
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect | undefined;

  const [row] = await db.select({ chirp: chirpsTable, author: usersTable })
    .from(chirpsTable)
    .innerJoin(usersTable, eq(chirpsTable.authorId, usersTable.id))
    .where(eq(chirpsTable.id, chirpId));

  if (!row) { res.status(404).json({ error: "Not found" }); return; }

  const replies = await db.select({ chirp: chirpsTable, author: usersTable })
    .from(chirpsTable)
    .innerJoin(usersTable, eq(chirpsTable.authorId, usersTable.id))
    .where(eq(chirpsTable.parentId, chirpId))
    .orderBy(desc(chirpsTable.createdAt))
    .limit(20);

  const chirpMeta = await buildChirpWithMeta(row.chirp, row.author, currentUser?.id);
  const replyMetas = await Promise.all(replies.map(r => buildChirpWithMeta(r.chirp, r.author, currentUser?.id)));

  // increment view count
  await db.update(chirpsTable).set({ viewCount: sql`${chirpsTable.viewCount} + 1` }).where(eq(chirpsTable.id, chirpId));

  res.json({ ...chirpMeta, replies: replyMetas });
});

// POST /chirps/:id/like — toggle like
router.post("/chirps/:id/like", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const chirpId = parseInt(req.params.id, 10);

  const [existing] = await db.select().from(chirpLikesTable).where(
    and(eq(chirpLikesTable.userId, currentUser.id), eq(chirpLikesTable.chirpId, chirpId))
  );

  if (existing) {
    await db.delete(chirpLikesTable).where(eq(chirpLikesTable.id, existing.id));
  } else {
    await db.insert(chirpLikesTable).values({ userId: currentUser.id, chirpId }).onConflictDoNothing();
    // Notify chirp author
    const [chirp] = await db.select().from(chirpsTable).where(eq(chirpsTable.id, chirpId));
    if (chirp && chirp.authorId !== currentUser.id) {
      await db.insert(notificationsTable).values({
        recipientId: chirp.authorId,
        actorId: currentUser.id,
        type: "like",
        message: chirp.content?.slice(0, 100) ?? null,
      }).onConflictDoNothing();
      emitToUser(chirp.authorId, "notification", {
        type: "like",
        actorUsername: currentUser.username,
        actorDisplayName: currentUser.displayName,
        actorAvatarUrl: currentUser.avatarUrl,
        message: chirp.content?.slice(0, 100) ?? null,
        url: `/chirps/${chirpId}`,
        createdAt: new Date().toISOString(),
      });
      sendPushToUser(chirp.authorId, `${currentUser.displayName} liked your chirp`, chirp.content?.slice(0, 80) ?? "", `/chirps/${chirpId}`);
    }
  }

  const [count] = await db.select({ count: sql<number>`count(*)::int` }).from(chirpLikesTable).where(eq(chirpLikesTable.chirpId, chirpId));
  res.json({ isLiked: !existing, likesCount: count?.count ?? 0 });
});

// POST /chirps/:id/save — toggle save
router.post("/chirps/:id/save", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const chirpId = parseInt(req.params.id, 10);

  const [existing] = await db.select().from(chirpSavesTable).where(
    and(eq(chirpSavesTable.userId, currentUser.id), eq(chirpSavesTable.chirpId, chirpId))
  );

  if (existing) {
    await db.delete(chirpSavesTable).where(eq(chirpSavesTable.id, existing.id));
  } else {
    await db.insert(chirpSavesTable).values({ userId: currentUser.id, chirpId }).onConflictDoNothing();
  }

  res.json({ isSaved: !existing });
});

// POST /chirps/:id/rechirp — rechirp
router.post("/chirps/:id/rechirp", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const chirpId = parseInt(req.params.id, 10);

  const [existing] = await db.select().from(chirpsTable).where(
    and(eq(chirpsTable.authorId, currentUser.id), eq(chirpsTable.rechirpOfId, chirpId))
  );

  if (existing) {
    await db.delete(chirpsTable).where(eq(chirpsTable.id, existing.id));
    res.json({ rechirped: false });
    return;
  }

  const [originalChirp] = await db.select().from(chirpsTable).where(eq(chirpsTable.id, chirpId));

  await db.insert(chirpsTable).values({
    authorId: currentUser.id,
    content: "",
    rechirpOfId: chirpId,
    hashtags: [],
    mentions: [],
  });

  // Notify original chirp author
  if (originalChirp && originalChirp.authorId !== currentUser.id) {
    await db.insert(notificationsTable).values({
      recipientId: originalChirp.authorId,
      actorId: currentUser.id,
      type: "repost",
      message: originalChirp.content?.slice(0, 100) ?? null,
    }).onConflictDoNothing();
    emitToUser(originalChirp.authorId, "notification", {
      type: "repost",
      actorUsername: currentUser.username,
      actorDisplayName: currentUser.displayName,
      actorAvatarUrl: currentUser.avatarUrl,
      message: originalChirp.content?.slice(0, 100) ?? null,
      url: `/chirps/${chirpId}`,
      createdAt: new Date().toISOString(),
    });
    sendPushToUser(originalChirp.authorId, `${currentUser.displayName} rechirped your chirp`, originalChirp.content?.slice(0, 80) ?? "", `/chirps/${chirpId}`);
  }

  res.json({ rechirped: true });
});

// DELETE /chirps/:id — delete own chirp
router.delete("/chirps/:id", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const chirpId = parseInt(req.params.id, 10);
  if (isNaN(chirpId)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [chirp] = await db.select().from(chirpsTable).where(eq(chirpsTable.id, chirpId));
  if (!chirp) { res.status(404).json({ error: "Not found" }); return; }
  if (chirp.authorId !== currentUser.id) { res.status(403).json({ error: "Forbidden" }); return; }

  // Delete the chirp and cascade-delete any reposts of it
  await db.delete(chirpsTable).where(eq(chirpsTable.rechirpOfId, chirpId));
  await db.delete(chirpsTable).where(eq(chirpsTable.id, chirpId));
  res.json({ success: true });
});

// GET /chirps/:id/comments — replies
router.get("/chirps/:id/comments", optionalUser, async (req, res): Promise<void> => {
  const chirpId = parseInt(req.params.id, 10);
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect | undefined;

  const rows = await db.select({ chirp: chirpsTable, author: usersTable })
    .from(chirpsTable)
    .innerJoin(usersTable, eq(chirpsTable.authorId, usersTable.id))
    .where(eq(chirpsTable.parentId, chirpId))
    .orderBy(desc(chirpsTable.createdAt))
    .limit(30);

  const items = await Promise.all(rows.map(r => buildChirpWithMeta(r.chirp, r.author, currentUser?.id)));
  res.json(items);
});

export default router;
