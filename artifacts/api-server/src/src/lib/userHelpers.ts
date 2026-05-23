import { db, usersTable, followsTable, postsTable, likesTable, savesTable, commentsTable } from "@workspace/db";
import { eq, and, inArray, sql, desc, or, ilike } from "drizzle-orm";

export async function buildPostsWithMeta(
  rows: Array<{ post: typeof postsTable.$inferSelect; author: typeof usersTable.$inferSelect }>,
  currentUserId?: number
) {
  if (rows.length === 0) return [];

  const postIds = rows.map(r => r.post.id);
  const authorIds = [...new Set(rows.map(r => r.author.id))];

  const [likeCounts, commentCounts, savedRows, likedRows, followRows] = await Promise.all([
    db.select({ postId: likesTable.postId, count: sql<number>`count(*)::int` })
      .from(likesTable).where(inArray(likesTable.postId, postIds)).groupBy(likesTable.postId),
    db.select({ postId: commentsTable.postId, count: sql<number>`count(*)::int` })
      .from(commentsTable).where(inArray(commentsTable.postId, postIds)).groupBy(commentsTable.postId),
    currentUserId
      ? db.select({ postId: savesTable.postId }).from(savesTable)
          .where(and(eq(savesTable.userId, currentUserId), inArray(savesTable.postId, postIds)))
      : Promise.resolve([]),
    currentUserId
      ? db.select({ postId: likesTable.postId }).from(likesTable)
          .where(and(eq(likesTable.userId, currentUserId), inArray(likesTable.postId, postIds)))
      : Promise.resolve([]),
    currentUserId && authorIds.length > 0
      ? db.select({ followingId: followsTable.followingId }).from(followsTable)
          .where(and(eq(followsTable.followerId, currentUserId), inArray(followsTable.followingId, authorIds)))
      : Promise.resolve([]),
  ]);

  const likeCountMap = new Map(likeCounts.map(r => [r.postId, r.count]));
  const commentCountMap = new Map(commentCounts.map(r => [r.postId, r.count]));
  const savedSet = new Set((savedRows as any[]).map((r: any) => r.postId));
  const likedSet = new Set((likedRows as any[]).map((r: any) => r.postId));
  const followedSet = new Set((followRows as any[]).map((r: any) => r.followingId));

  return rows.map(({ post, author }) => ({
    id: post.id,
    authorId: post.authorId,
    author: buildUserSummary(author, followedSet.has(author.id)),
    caption: post.caption ?? null,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    thumbnailUrl: post.thumbnailUrl ?? null,
    hashtags: post.hashtags ?? [],
    likesCount: likeCountMap.get(post.id) ?? 0,
    commentsCount: commentCountMap.get(post.id) ?? 0,
    viewsCount: post.viewsCount,
    isLiked: likedSet.has(post.id),
    isSaved: savedSet.has(post.id),
    createdAt: post.createdAt.toISOString(),
  }));
}

export async function buildUserProfile(user: typeof usersTable.$inferSelect, currentUserId?: number) {
  const followersCountResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(followsTable)
    .where(eq(followsTable.followingId, user.id));

  const followingCountResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(followsTable)
    .where(eq(followsTable.followerId, user.id));

  const postsCountResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(postsTable)
    .where(eq(postsTable.authorId, user.id));

  let isFollowing = false;
  if (currentUserId && currentUserId !== user.id) {
    const [follow] = await db.select().from(followsTable).where(
      and(eq(followsTable.followerId, currentUserId), eq(followsTable.followingId, user.id))
    );
    isFollowing = !!follow;
  }

  return {
    id: user.id,
    clerkId: user.clerkId,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
    coverUrl: user.coverUrl ?? null,
    website: user.website ?? null,
    isVerified: user.isVerified,
    isFounder: user.isFounder,
    bannerOffsetY: (user as any).bannerOffsetY ?? 0,
    followersCount: followersCountResult[0]?.count ?? 0,
    followingCount: followingCountResult[0]?.count ?? 0,
    postsCount: postsCountResult[0]?.count ?? 0,
    isFollowing,
    createdAt: user.createdAt.toISOString(),
  };
}

export function buildUserSummary(user: typeof usersTable.$inferSelect, isFollowing = false) {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? null,
    isVerified: user.isVerified,
    isFounder: user.isFounder,
    isFollowing,
    bio: user.bio ?? null,
  };
}

export async function buildPostWithMeta(
  post: typeof postsTable.$inferSelect,
  author: typeof usersTable.$inferSelect,
  currentUserId?: number
) {
  const [likesResult, commentsResult, savedResult, likedResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(likesTable).where(eq(likesTable.postId, post.id)),
    db.select({ count: sql<number>`count(*)::int` }).from(commentsTable).where(eq(commentsTable.postId, post.id)),
    currentUserId
      ? db.select().from(savesTable).where(and(eq(savesTable.userId, currentUserId), eq(savesTable.postId, post.id)))
      : Promise.resolve([]),
    currentUserId
      ? db.select().from(likesTable).where(and(eq(likesTable.userId, currentUserId), eq(likesTable.postId, post.id)))
      : Promise.resolve([]),
  ]);

  const [followResult] = currentUserId && currentUserId !== author.id
    ? await db.select().from(followsTable).where(
        and(eq(followsTable.followerId, currentUserId), eq(followsTable.followingId, author.id))
      )
    : [undefined];

  return {
    id: post.id,
    authorId: post.authorId,
    author: buildUserSummary(author, !!followResult),
    caption: post.caption ?? null,
    mediaUrl: post.mediaUrl,
    mediaType: post.mediaType,
    thumbnailUrl: post.thumbnailUrl ?? null,
    hashtags: post.hashtags ?? [],
    likesCount: likesResult[0]?.count ?? 0,
    commentsCount: commentsResult[0]?.count ?? 0,
    viewsCount: post.viewsCount,
    isLiked: likedResult.length > 0,
    isSaved: (savedResult as unknown[]).length > 0,
    createdAt: post.createdAt.toISOString(),
  };
}
