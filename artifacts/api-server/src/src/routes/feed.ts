import { Router, type IRouter } from "express";
import { eq, and, desc, sql, inArray, notInArray } from "drizzle-orm";
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

  // Fetch followed/own posts
  let followedRows: any[] = [];
  if (feedUserIds.length > 0) {
    let q = db.select({ post: postsTable, author: usersTable })
      .from(postsTable)
      .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
      .where(
        cursor
          ? and(inArray(postsTable.authorId, feedUserIds), sql`${postsTable.id} < ${cursor}`)
          : inArray(postsTable.authorId, feedUserIds),
      )
      .orderBy(desc(postsTable.createdAt))
      .limit(limit + 1) as any;
    followedRows = await q;
  }

  // Always mix in up to 5 discovery posts from non-followed users
  const discoveryRows = await db.select({ post: postsTable, author: usersTable })
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .where(
      notInArray(postsTable.authorId, feedUserIds),
    )
    .orderBy(desc(postsTable.createdAt))
    .limit(5);

  // Merge: followed posts first, then discovery posts (deduplicated by post id)
  const seenIds = new Set<number>();
  const merged: any[] = [];
  for (const r of followedRows) {
    if (!seenIds.has(r.post.id)) { seenIds.add(r.post.id); merged.push(r); }
  }
  for (const r of discoveryRows) {
    if (!seenIds.has(r.post.id)) { seenIds.add(r.post.id); merged.push(r); }
  }

  // Sort merged by createdAt desc
  merged.sort((a, b) => new Date(b.post.createdAt).getTime() - new Date(a.post.createdAt).getTime());

  const hasMore = followedRows.length > limit;
  const data = hasMore ? merged.slice(0, limit) : merged;
  const postsWithMeta = await buildPostsWithMeta(data, currentUser.id);

  res.json({
    posts: postsWithMeta,
    hasMore,
    nextCursor: hasMore ? (followedRows[limit - 1]?.post.id ?? null) : null,
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
