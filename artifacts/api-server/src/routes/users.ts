import { Router, type IRouter } from "express";
import { eq, and, notInArray, sql, desc } from "drizzle-orm";
import { db, usersTable, followsTable, postsTable, notificationsTable } from "@workspace/db";
import { requireAuth, requireUser, resolveUser } from "../lib/auth";
import { buildUserProfile, buildUserSummary, buildPostWithMeta } from "../lib/userHelpers";
import {
  OnboardUserBody,
  UpdateMyProfileBody,
  GetUserByUsernameParams,
  GetUserPostsParams,
  GetUserFollowersParams,
  GetUserFollowingParams,
  GetSuggestedUsersQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /me
router.get("/users/me", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).clerkUserId as string;
  const user = await resolveUser(clerkId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const profile = await buildUserProfile(user, user.id);
  res.json(profile);
});

// POST /users/me/onboard
router.post("/users/me/onboard", requireAuth, async (req, res): Promise<void> => {
  const clerkId = (req as any).clerkUserId as string;

  // Check if already onboarded
  const existing = await resolveUser(clerkId);
  if (existing) {
    const profile = await buildUserProfile(existing, existing.id);
    res.status(200).json(profile);
    return;
  }

  const parsed = OnboardUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Check username taken
  const [taken] = await db.select().from(usersTable).where(eq(usersTable.username, parsed.data.username));
  if (taken) {
    res.status(400).json({ error: "Username already taken" });
    return;
  }

  const [user] = await db.insert(usersTable).values({
    clerkId,
    username: parsed.data.username,
    displayName: parsed.data.displayName,
    bio: parsed.data.bio ?? null,
    avatarUrl: parsed.data.avatarUrl ?? null,
  }).returning();

  const profile = await buildUserProfile(user, user.id);
  res.status(201).json(profile);
});

// PUT /users/me/profile
router.put("/users/me/profile", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const parsed = UpdateMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updateData: Partial<typeof usersTable.$inferSelect> = {};
  if (parsed.data.displayName !== undefined) updateData.displayName = parsed.data.displayName;
  if (parsed.data.bio !== undefined) updateData.bio = parsed.data.bio;
  if (parsed.data.avatarUrl !== undefined) updateData.avatarUrl = parsed.data.avatarUrl;
  if (parsed.data.coverUrl !== undefined) updateData.coverUrl = parsed.data.coverUrl;
  if (parsed.data.website !== undefined) updateData.website = parsed.data.website;

  const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, currentUser.id)).returning();
  const profile = await buildUserProfile(updated, currentUser.id);
  res.json(profile);
});

// GET /users/:username
router.get("/users/:username", async (req, res): Promise<void> => {
  const params = GetUserByUsernameParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, params.data.username));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const clerkId = (req as any).clerkUserId as string | undefined;
  let currentUserId: number | undefined;
  if (clerkId) {
    const cur = await resolveUser(clerkId);
    currentUserId = cur?.id;
  }
  const profile = await buildUserProfile(user, currentUserId);
  res.json(profile);
});

// GET /users/:username/posts
router.get("/users/:username/posts", async (req, res): Promise<void> => {
  const params = GetUserPostsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, params.data.username));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const clerkId = (req as any).clerkUserId as string | undefined;
  let currentUserId: number | undefined;
  if (clerkId) {
    const cur = await resolveUser(clerkId);
    currentUserId = cur?.id;
  }

  const posts = await db.select().from(postsTable).where(eq(postsTable.authorId, user.id)).orderBy(desc(postsTable.createdAt)).limit(24);
  const postsWithMeta = await Promise.all(posts.map(p => buildPostWithMeta(p, user, currentUserId)));
  res.json({ posts: postsWithMeta, hasMore: false, nextCursor: null });
});

// GET /users/:username/followers
router.get("/users/:username/followers", async (req, res): Promise<void> => {
  const params = GetUserFollowersParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, params.data.username));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const followers = await db.select({ user: usersTable }).from(followsTable)
    .innerJoin(usersTable, eq(followsTable.followerId, usersTable.id))
    .where(eq(followsTable.followingId, user.id));

  res.json(followers.map(f => buildUserSummary(f.user)));
});

// GET /users/:username/following
router.get("/users/:username/following", async (req, res): Promise<void> => {
  const params = GetUserFollowingParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, params.data.username));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const following = await db.select({ user: usersTable }).from(followsTable)
    .innerJoin(usersTable, eq(followsTable.followingId, usersTable.id))
    .where(eq(followsTable.followerId, user.id));

  res.json(following.map(f => buildUserSummary(f.user)));
});

// GET /users/suggested
router.get("/users/suggested", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const queryParams = GetSuggestedUsersQueryParams.safeParse(req.query);
  const limit = queryParams.success ? (queryParams.data.limit ?? 10) : 10;

  // Get users the current user already follows
  const following = await db.select({ followingId: followsTable.followingId })
    .from(followsTable).where(eq(followsTable.followerId, currentUser.id));
  const followingIds = following.map(f => f.followingId);

  const excludeIds = [currentUser.id, ...followingIds];
  const suggested = await db.select().from(usersTable)
    .where(notInArray(usersTable.id, excludeIds))
    .limit(limit);

  res.json(suggested.map(u => buildUserSummary(u)));
});

// POST /follows/:username
router.post("/follows/:username", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;

  const [target] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }
  if (target.id === currentUser.id) { res.status(400).json({ error: "Cannot follow yourself" }); return; }

  const [existing] = await db.select().from(followsTable).where(
    and(eq(followsTable.followerId, currentUser.id), eq(followsTable.followingId, target.id))
  );
  if (!existing) {
    await db.insert(followsTable).values({ followerId: currentUser.id, followingId: target.id });
    // Create notification
    await db.insert(notificationsTable).values({
      recipientId: target.id,
      actorId: currentUser.id,
      type: "follow",
    }).onConflictDoNothing();
  }

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
    .from(followsTable).where(eq(followsTable.followingId, target.id));

  res.status(201).json({ isFollowing: true, followersCount: countResult?.count ?? 0 });
});

// DELETE /follows/:username
router.delete("/follows/:username", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const username = Array.isArray(req.params.username) ? req.params.username[0] : req.params.username;

  const [target] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }

  await db.delete(followsTable).where(
    and(eq(followsTable.followerId, currentUser.id), eq(followsTable.followingId, target.id))
  );

  const [countResult] = await db.select({ count: sql<number>`count(*)::int` })
    .from(followsTable).where(eq(followsTable.followingId, target.id));

  res.json({ isFollowing: false, followersCount: countResult?.count ?? 0 });
});

export default router;
