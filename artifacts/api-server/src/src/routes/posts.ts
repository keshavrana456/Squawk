import { Router, type IRouter } from "express";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db, usersTable, postsTable, likesTable, savesTable, commentsTable, commentLikesTable, followsTable, notificationsTable } from "@workspace/db";
import { requireUser, resolveUser } from "../lib/auth";
import { getAuth } from "@clerk/express";
import { buildPostWithMeta, buildPostsWithMeta, buildUserSummary } from "../lib/userHelpers";
import {
  ListPostsQueryParams,
  CreatePostBody,
  GetPostParams,
  DeletePostParams,
  GetTrendingPostsQueryParams,
  LikePostParams,
  SavePostParams,
  GetPostCommentsParams,
  CreateCommentParams,
  CreateCommentBody,
  DeleteCommentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /posts
router.get("/posts", async (req, res): Promise<void> => {
  const queryParams = ListPostsQueryParams.safeParse(req.query);
  const limit = queryParams.success ? (queryParams.data.limit ?? 12) : 12;
  const cursor = queryParams.success ? queryParams.data.cursor : null;

  const clerkId = getAuth(req).userId ?? undefined;
  let currentUserId: number | undefined;
  if (clerkId) {
    const cur = await resolveUser(clerkId);
    currentUserId = cur?.id;
  }

  let query = db.select({ post: postsTable, author: usersTable })
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .orderBy(desc(postsTable.createdAt))
    .limit(limit + 1) as any;

  if (cursor) {
    query = query.where(sql`${postsTable.id} < ${cursor}`);
  }

  const rows = await query;
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;

  const postsWithMeta = await buildPostsWithMeta(data, currentUserId);

  res.json({ posts: postsWithMeta, hasMore, nextCursor: hasMore ? data[data.length - 1].post.id : null });
});

// POST /posts
router.post("/posts", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [post] = await db.insert(postsTable).values({
    authorId: currentUser.id,
    caption: parsed.data.caption ?? null,
    mediaUrl: parsed.data.mediaUrl,
    mediaType: parsed.data.mediaType,
    thumbnailUrl: parsed.data.thumbnailUrl ?? null,
    hashtags: parsed.data.hashtags ?? [],
  }).returning();

  const withMeta = await buildPostWithMeta(post, currentUser, currentUser.id);
  res.status(201).json(withMeta);
});

// GET /posts/trending
router.get("/posts/trending", async (req, res): Promise<void> => {
  const qp = GetTrendingPostsQueryParams.safeParse(req.query);
  const limit = qp.success ? (qp.data.limit ?? 20) : 20;
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect | undefined;

  const rows = await db.select({ post: postsTable, author: usersTable, likesCount: sql<number>`count(${likesTable.id})::int` })
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .leftJoin(likesTable, eq(likesTable.postId, postsTable.id))
    .groupBy(postsTable.id, usersTable.id)
    .orderBy(desc(sql`count(${likesTable.id})`), desc(postsTable.createdAt))
    .limit(limit);

  const postsWithMeta = await Promise.all(rows.map((r: any) => buildPostWithMeta(r.post, r.author, currentUser?.id)));
  res.json(postsWithMeta);
});

// GET /posts/:id
router.get("/posts/:id", async (req, res): Promise<void> => {
  const params = GetPostParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const clerkId = getAuth(req).userId ?? undefined;
  let currentUserId: number | undefined;
  if (clerkId) {
    const cur = await resolveUser(clerkId);
    currentUserId = cur?.id;
  }

  const [row] = await db.select({ post: postsTable, author: usersTable })
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .where(eq(postsTable.id, params.data.id));

  if (!row) { res.status(404).json({ error: "Post not found" }); return; }
  const withMeta = await buildPostWithMeta(row.post, row.author, currentUserId);
  res.json(withMeta);
});

// DELETE /posts/:id
router.delete("/posts/:id", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const params = DeletePostParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }
  if (post.authorId !== currentUser.id) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(postsTable).where(eq(postsTable.id, params.data.id));
  res.sendStatus(204);
});

// POST /posts/:id/like
router.post("/posts/:id/like", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const params = LikePostParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [existing] = await db.select().from(likesTable).where(
    and(eq(likesTable.userId, currentUser.id), eq(likesTable.postId, params.data.id))
  );

  let isLiked: boolean;
  if (existing) {
    await db.delete(likesTable).where(eq(likesTable.id, existing.id));
    isLiked = false;
  } else {
    await db.insert(likesTable).values({ userId: currentUser.id, postId: params.data.id });
    isLiked = true;

    // Notify post author
    const [post] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
    if (post && post.authorId !== currentUser.id) {
      await db.insert(notificationsTable).values({
        recipientId: post.authorId,
        actorId: currentUser.id,
        type: "like",
        postId: params.data.id,
      }).onConflictDoNothing();
    }
  }

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
    .from(likesTable).where(eq(likesTable.postId, params.data.id));

  res.json({ isLiked, likesCount: countResult?.count ?? 0 });
});

// POST /posts/:id/save
router.post("/posts/:id/save", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const params = SavePostParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [existing] = await db.select().from(savesTable).where(
    and(eq(savesTable.userId, currentUser.id), eq(savesTable.postId, params.data.id))
  );

  if (existing) {
    await db.delete(savesTable).where(eq(savesTable.id, existing.id));
    res.json({ isSaved: false });
  } else {
    await db.insert(savesTable).values({ userId: currentUser.id, postId: params.data.id });
    res.json({ isSaved: true });
  }
});

// GET /users/me/saved
router.get("/users/me/saved", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;

  const rows = await db.select({ post: postsTable, author: usersTable })
    .from(savesTable)
    .innerJoin(postsTable, eq(savesTable.postId, postsTable.id))
    .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .where(eq(savesTable.userId, currentUser.id))
    .orderBy(desc(savesTable.createdAt));

  const postsWithMeta = await Promise.all(rows.map(r => buildPostWithMeta(r.post, r.author, currentUser.id)));
  res.json(postsWithMeta);
});

// GET /posts/:id/comments
router.get("/posts/:id/comments", async (req, res): Promise<void> => {
  const params = GetPostCommentsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect | undefined;

  const rows = await db.select({ comment: commentsTable, author: usersTable })
    .from(commentsTable)
    .innerJoin(usersTable, eq(commentsTable.authorId, usersTable.id))
    .where(eq(commentsTable.postId, params.data.id))
    .orderBy(desc(commentsTable.createdAt));

  const commentIds = rows.map(r => r.comment.id);

  const [likeCounts, myLikes] = await Promise.all([
    commentIds.length > 0
      ? db.select({ commentId: commentLikesTable.commentId, count: sql<number>`count(*)::int` })
          .from(commentLikesTable)
          .where(inArray(commentLikesTable.commentId, commentIds))
          .groupBy(commentLikesTable.commentId)
      : Promise.resolve([]),
    currentUser && commentIds.length > 0
      ? db.select({ commentId: commentLikesTable.commentId })
          .from(commentLikesTable)
          .where(and(eq(commentLikesTable.userId, currentUser.id), inArray(commentLikesTable.commentId, commentIds)))
      : Promise.resolve([]),
  ]);

  const likeCountMap = new Map(likeCounts.map((l: any) => [l.commentId, l.count]));
  const myLikeSet = new Set((myLikes as any[]).map((l: any) => l.commentId));

  res.json(rows.map(r => ({
    id: r.comment.id,
    postId: r.comment.postId,
    authorId: r.comment.authorId,
    author: buildUserSummary(r.author),
    content: r.comment.content,
    parentCommentId: r.comment.parentCommentId ?? null,
    createdAt: r.comment.createdAt.toISOString(),
    likesCount: likeCountMap.get(r.comment.id) ?? 0,
    isLiked: myLikeSet.has(r.comment.id),
  })));
});

// POST /posts/:id/comments
router.post("/posts/:id/comments", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const params = CreateCommentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = CreateCommentBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  // Accept optional parentCommentId from body (not in OpenAPI spec but used by frontend)
  const parentCommentId = typeof (req.body as any).parentCommentId === "number"
    ? (req.body as any).parentCommentId
    : null;

  const [comment] = await db.insert(commentsTable).values({
    postId: params.data.id,
    authorId: currentUser.id,
    content: body.data.content,
    parentCommentId,
  }).returning();

  // Notify post author
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, params.data.id));
  if (post && post.authorId !== currentUser.id) {
    await db.insert(notificationsTable).values({
      recipientId: post.authorId,
      actorId: currentUser.id,
      type: "comment",
      postId: params.data.id,
      message: body.data.content.slice(0, 100),
    }).onConflictDoNothing();
  }

  res.status(201).json({
    id: comment.id,
    postId: comment.postId,
    authorId: comment.authorId,
    author: buildUserSummary(currentUser),
    content: comment.content,
    parentCommentId: comment.parentCommentId ?? null,
    createdAt: comment.createdAt.toISOString(),
    likesCount: 0,
    isLiked: false,
  });
});

// POST /comments/:id/like  (toggle)
router.post("/comments/:id/like", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const commentId = parseInt(req.params.id as string, 10);
  if (isNaN(commentId)) { res.status(400).json({ error: "Invalid comment id" }); return; }

  const [existing] = await db.select().from(commentLikesTable).where(
    and(eq(commentLikesTable.userId, currentUser.id), eq(commentLikesTable.commentId, commentId))
  );

  let isLiked: boolean;
  if (existing) {
    await db.delete(commentLikesTable).where(eq(commentLikesTable.id, existing.id));
    isLiked = false;
  } else {
    await db.insert(commentLikesTable).values({ userId: currentUser.id, commentId });
    isLiked = true;
  }

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
    .from(commentLikesTable).where(eq(commentLikesTable.commentId, commentId));

  res.json({ isLiked, likesCount: countResult?.count ?? 0 });
});

// DELETE /comments/:id
router.delete("/comments/:id", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const params = DeleteCommentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [comment] = await db.select().from(commentsTable).where(eq(commentsTable.id, params.data.id));
  if (!comment) { res.status(404).json({ error: "Comment not found" }); return; }
  const isFounderOrAdmin = (currentUser as any).isFounder || currentUser.id === 1;
  if (comment.authorId !== currentUser.id && !isFounderOrAdmin) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(commentsTable).where(eq(commentsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
