import { Router, type IRouter } from "express";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { db, usersTable, postsTable, likesTable, followsTable } from "@workspace/db";
import { requireUser } from "../lib/auth";
import { buildPostsWithMeta } from "../lib/userHelpers";
import { GetFeedQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /feed
router.get("/feed", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const qp = GetFeedQueryParams.safeParse(req.query);
  const limit = qp.success ? (qp.data.limit ?? 20) : 20;
  const cursor = qp.success ? qp.data.cursor : null;

  // Get followed users
  const following = await db.select({ followingId: followsTable.followingId })
    .from(followsTable).where(eq(followsTable.followerId, currentUser.id));
  const followingIds = following.map(f => f.followingId);
  const feedUserIds = [currentUser.id, ...followingIds];

  let rows: any[];
  if (feedUserIds.length > 0) {
    let q = db.select({ post: postsTable, author: usersTable })
      .from(postsTable)
      .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
      .where(inArray(postsTable.authorId, feedUserIds))
      .orderBy(desc(postsTable.createdAt))
      .limit(limit + 1) as any;

    if (cursor) {
      q = q.where(and(
        inArray(postsTable.authorId, feedUserIds),
        sql`${postsTable.id} < ${cursor}`
      ));
    }
    rows = await q;
  } else {
    // No follows — show trending posts
    rows = await db.select({ post: postsTable, author: usersTable })
      .from(postsTable)
      .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
      .orderBy(desc(postsTable.createdAt))
      .limit(limit + 1);
  }

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const postsWithMeta = await buildPostsWithMeta(data, currentUser.id);

  res.json({
    posts: postsWithMeta,
    hasMore,
    nextCursor: hasMore ? data[data.length - 1].post.id : null,
  });
});

// GET /feed/stats
router.get("/feed/stats", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;

  const [postsCount, followersCount, totalLikesResult, totalViewsResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(postsTable).where(eq(postsTable.authorId, currentUser.id)),
    db.select({ count: sql<number>`count(*)::int` }).from(followsTable).where(eq(followsTable.followingId, currentUser.id)),
    db.select({ total: sql<number>`coalesce(count(${likesTable.id}), 0)::int` })
      .from(postsTable)
      .leftJoin(likesTable, eq(likesTable.postId, postsTable.id))
      .where(eq(postsTable.authorId, currentUser.id)),
    db.select({ total: sql<number>`coalesce(sum(${postsTable.viewsCount}), 0)::int` })
      .from(postsTable).where(eq(postsTable.authorId, currentUser.id)),
  ]);

  const recentPosts = await db.select({ post: postsTable })
    .from(postsTable)
    .where(eq(postsTable.authorId, currentUser.id))
    .orderBy(desc(postsTable.createdAt))
    .limit(5);

  const recentActivity = recentPosts.map(r => ({
    type: "post",
    description: r.post.caption ? r.post.caption.slice(0, 60) : "New post",
    createdAt: r.post.createdAt.toISOString(),
  }));

  res.json({
    totalLikes: totalLikesResult[0]?.total ?? 0,
    totalPosts: postsCount[0]?.count ?? 0,
    totalFollowers: followersCount[0]?.count ?? 0,
    totalViews: totalViewsResult[0]?.total ?? 0,
    recentActivity,
  });
});

export default router;
