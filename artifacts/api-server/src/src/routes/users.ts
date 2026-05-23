import { Router, type IRouter } from "express";
import { eq, and, notInArray, sql, desc } from "drizzle-orm";
import { db, usersTable, followsTable, postsTable, notificationsTable } from "@workspace/db";
import { requireAuth, requireUser, resolveUser } from "../lib/auth";
import { clerkClient } from "@clerk/express";
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

const FOUNDER_EMAILS = ["globalfreefire33@gmail.com"];
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

  // Auto-detect founder by Clerk email
  let isFounder = false;
  try {
    const clerkUser = await clerkClient.users.getUser(clerkId);
    const emails = clerkUser.emailAddresses.map(e => e.emailAddress.toLowerCase());
    isFounder = FOUNDER_EMAILS.some(fe => emails.includes(fe));
  } catch {}

  const [user] = await db.insert(usersTable).values({
    clerkId,
    username: parsed.data.username,
    displayName: parsed.data.displayName,
    bio: parsed.data.bio ?? null,
    avatarUrl: parsed.data.avatarUrl ?? null,
    isFounder,
  }).returning();

  const profile = await buildUserProfile(user, user.id);
  res.status(201).json(profile);
});

const USERNAME_COOLDOWN_DAYS = 14;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

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
  if (parsed.data.website !== undefined) updateData.website = parsed.data.website ?? null;
  if ((parsed.data as any).bannerOffsetY !== undefined) {
    (updateData as any).bannerOffsetY = Math.max(-45, Math.min(45, Number((parsed.data as any).bannerOffsetY) || 0));
  }

  // Handle username change
  if ((parsed.data as any).username !== undefined) {
    const newUsername: string = (parsed.data as any).username.trim();

    if (!USERNAME_REGEX.test(newUsername)) {
      res.status(400).json({ error: "Username must be 3-20 characters and can only contain letters, numbers, and underscores." });
      return;
    }

    if (newUsername !== currentUser.username) {
      // Check 14-day cooldown
      const lastChanged = (currentUser as any).usernameChangedAt as Date | null;
      if (lastChanged) {
        const daysSince = (Date.now() - new Date(lastChanged).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSince < USERNAME_COOLDOWN_DAYS) {
          const daysLeft = Math.ceil(USERNAME_COOLDOWN_DAYS - daysSince);
          res.status(429).json({ error: `You can change your username again in ${daysLeft} day${daysLeft === 1 ? "" : "s"}.` });
          return;
        }
      }

      // Check uniqueness
      const [taken] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.username, newUsername));
      if (taken) {
        res.status(400).json({ error: "That username is already taken." });
        return;
      }

      // Sync to Clerk
      try {
        await clerkClient.users.updateUser(currentUser.clerkId, { username: newUsername });
      } catch (err: any) {
        const msg = err?.errors?.[0]?.longMessage ?? err?.message ?? "Failed to update username in auth system.";
        res.status(400).json({ error: msg });
        return;
      }

      updateData.username = newUsername;
      (updateData as any).usernameChangedAt = new Date();
    }
  }

  const [updated] = await db.update(usersTable).set(updateData).where(eq(usersTable.id, currentUser.id)).returning();
  const profile = await buildUserProfile(updated, currentUser.id);
  res.json(profile);
});

// GET /users/suggested — must be before /users/:username to avoid route conflict
router.get("/users/suggested", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const queryParams = GetSuggestedUsersQueryParams.safeParse(req.query);
  const limit = queryParams.success ? (queryParams.data.limit ?? 10) : 10;

  const following = await db.select({ followingId: followsTable.followingId })
    .from(followsTable).where(eq(followsTable.followerId, currentUser.id));
  const followingIds = following.map(f => f.followingId);

  const excludeIds = [currentUser.id, ...followingIds];
  const suggested = await db.select().from(usersTable)
    .where(notInArray(usersTable.id, excludeIds))
    .limit(limit);

  res.json(suggested.map(u => buildUserSummary(u)));
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

// PUT /users/:username/set-founder — admin only (user with id=1)
router.put("/users/:username/set-founder", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;

  // Only the first registered user (the app founder/owner) can toggle this
  if (currentUser.id !== 1) {
    res.status(403).json({ error: "Only the app owner can assign founder status" });
    return;
  }

  const params = GetUserByUsernameParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [target] = await db.select().from(usersTable).where(eq(usersTable.username, params.data.username));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }

  const newValue = !target.isFounder;
  await db.update(usersTable).set({ isFounder: newValue }).where(eq(usersTable.id, target.id));

  res.json({ isFounder: newValue });
});

export default router;
