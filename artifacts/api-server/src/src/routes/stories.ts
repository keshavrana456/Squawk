import { Router, type IRouter } from "express";
import { eq, and, desc, gt, sql, inArray } from "drizzle-orm";
import { db, usersTable, storiesTable, storyViewsTable, followsTable, notificationsTable } from "@workspace/db";
import { emitToUser } from "../lib/socket";
import { sendPushToUser } from "../lib/push";
import { requireUser } from "../lib/auth";
import { buildUserSummary } from "../lib/userHelpers";
import { ViewStoryParams } from "@workspace/api-zod";
import { z } from "zod/v4";

const router: IRouter = Router();

// GET /stories
router.get("/stories", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;

  const now = new Date();

  // Get followed users
  const following = await db.select({ followingId: followsTable.followingId })
    .from(followsTable).where(eq(followsTable.followerId, currentUser.id));
  const followingIds = following.map(f => f.followingId);
  const allUserIds = [currentUser.id, ...followingIds];

  if (allUserIds.length === 0) {
    res.json([]);
    return;
  }

  // Get active stories
  const stories = await db.select({ story: storiesTable, author: usersTable })
    .from(storiesTable)
    .innerJoin(usersTable, eq(storiesTable.authorId, usersTable.id))
    .where(and(
      gt(storiesTable.expiresAt, now),
      inArray(storiesTable.authorId, allUserIds)
    ))
    .orderBy(desc(storiesTable.createdAt));

  // Get viewed story IDs
  const viewedRows = await db.select({ storyId: storyViewsTable.storyId })
    .from(storyViewsTable).where(eq(storyViewsTable.viewerId, currentUser.id));
  const viewedIds = new Set(viewedRows.map(v => v.storyId));

  // Group by user
  const groups = new Map<number, { user: any; stories: any[]; hasUnviewed: boolean }>();
  for (const { story, author } of stories) {
    if (!groups.has(author.id)) {
      groups.set(author.id, { user: buildUserSummary(author), stories: [], hasUnviewed: false });
    }
    const group = groups.get(author.id)!;
    const isViewed = viewedIds.has(story.id);
    if (!isViewed) group.hasUnviewed = true;
    group.stories.push({
      id: story.id,
      authorId: story.authorId,
      author: buildUserSummary(author),
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      viewsCount: story.viewsCount,
      createdAt: story.createdAt.toISOString(),
      expiresAt: story.expiresAt.toISOString(),
      isViewed,
      objectFit: story.objectFit ?? "cover",
      caption: story.caption ?? null,
      textLayers: story.textLayers ?? null,
    });
  }

  // Current user's story group goes first
  const result: any[] = [];
  const myGroup = groups.get(currentUser.id);
  if (myGroup) result.push(myGroup);

  for (const [userId, group] of groups) {
    if (userId !== currentUser.id) result.push(group);
  }

  res.json(result);
});

const CreateStoryBodyExtended = z.object({
  mediaUrl: z.string(),
  mediaType: z.enum(["image", "video"]),
  caption: z.string().optional().nullable(),
  objectFit: z.enum(["cover", "contain"]).optional().default("cover"),
  textLayers: z.string().optional().nullable(),
});

function extractMentions(text: string | null | undefined): string[] {
  if (!text) return [];
  const matches = text.match(/@(\w+)/g) ?? [];
  return [...new Set(matches.map(m => m.slice(1).toLowerCase()))];
}

// POST /stories
router.post("/stories", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const parsed = CreateStoryBodyExtended.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const [story] = await db.insert(storiesTable).values({
    authorId: currentUser.id,
    mediaUrl: parsed.data.mediaUrl,
    mediaType: parsed.data.mediaType,
    caption: parsed.data.caption ?? null,
    objectFit: parsed.data.objectFit ?? "cover",
    textLayers: parsed.data.textLayers ?? null,
    expiresAt,
  }).returning();

  // Notify all followers about the new story (fire-and-forget, don't block response)
  db.select({ followerId: followsTable.followerId })
    .from(followsTable)
    .where(eq(followsTable.followingId, currentUser.id))
    .then(async (followers) => {
      if (followers.length === 0) return;
      const notifs = followers.map(f => ({
        recipientId: f.followerId,
        actorId: currentUser.id,
        type: "story" as const,
        message: parsed.data.caption?.slice(0, 100) ?? null,
      }));
      for (let i = 0; i < notifs.length; i += 50) {
        await db.insert(notificationsTable).values(notifs.slice(i, i + 50)).onConflictDoNothing();
      }
    })
    .catch(() => {});

  // Notify mentioned users (fire-and-forget)
  ;(async () => {
    const mentionedUsernames = [
      ...extractMentions(parsed.data.caption),
      ...(() => {
        try {
          const layers = JSON.parse(parsed.data.textLayers ?? "[]") as any[];
          return layers.flatMap(l => extractMentions(l.text));
        } catch { return []; }
      })(),
    ];
    const uniqueUsernames = [...new Set(mentionedUsernames)];
    if (uniqueUsernames.length === 0) return;
    const mentionedUsers = await db.select().from(usersTable)
      .where(inArray(usersTable.username, uniqueUsernames));
    for (const mentioned of mentionedUsers) {
      if (mentioned.id === currentUser.id) continue;
      await db.insert(notificationsTable).values({
        recipientId: mentioned.id,
        actorId: currentUser.id,
        type: "mention" as const,
        message: parsed.data.caption?.slice(0, 100) ?? "mentioned you in a story",
      }).onConflictDoNothing();
      emitToUser(mentioned.id, "notification", {
        type: "mention",
        actorUsername: currentUser.username,
        actorDisplayName: currentUser.displayName,
        actorAvatarUrl: currentUser.avatarUrl,
        message: `${currentUser.displayName} mentioned you in a story`,
        createdAt: new Date().toISOString(),
      });
      sendPushToUser(mentioned.id, `${currentUser.displayName} mentioned you`, "You were mentioned in a story", "/notifications");
    }
  })().catch(() => {});

  res.status(201).json({
    id: story.id,
    authorId: story.authorId,
    author: buildUserSummary(currentUser),
    mediaUrl: story.mediaUrl,
    mediaType: story.mediaType,
    caption: story.caption,
    objectFit: story.objectFit,
    textLayers: story.textLayers ?? null,
    viewsCount: story.viewsCount,
    createdAt: story.createdAt.toISOString(),
    expiresAt: story.expiresAt.toISOString(),
    isViewed: false,
  });
});

// POST /stories/:id/view
router.post("/stories/:id/view", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const params = ViewStoryParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [existing] = await db.select().from(storyViewsTable).where(
    and(eq(storyViewsTable.storyId, params.data.id), eq(storyViewsTable.viewerId, currentUser.id))
  );

  if (!existing) {
    await db.insert(storyViewsTable).values({ storyId: params.data.id, viewerId: currentUser.id });
    await db.update(storiesTable).set({ viewsCount: sql`${storiesTable.viewsCount} + 1` })
      .where(eq(storiesTable.id, params.data.id));
  }

  res.json({ success: true });
});

// DELETE /stories/:id — owner deletes their own story
router.delete("/stories/:id", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const storyId = parseInt(String(req.params.id), 10);
  if (isNaN(storyId)) { res.status(400).json({ error: "Invalid story ID" }); return; }

  const [story] = await db.select().from(storiesTable).where(eq(storiesTable.id, storyId));
  if (!story) { res.status(404).json({ error: "Story not found" }); return; }
  if (story.authorId !== currentUser.id) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(storyViewsTable).where(eq(storyViewsTable.storyId, storyId));
  await db.delete(storiesTable).where(eq(storiesTable.id, storyId));

  res.json({ success: true });
});

// GET /stories/:id/views — returns list of viewers (for story owner)
router.get("/stories/:id/views", requireUser, async (req, res): Promise<void> => {
  const currentUser = (req as any).currentUser as typeof usersTable.$inferSelect;
  const storyId = parseInt(String(req.params.id), 10);
  if (isNaN(storyId)) { res.status(400).json({ error: "Invalid story ID" }); return; }

  // Only the story owner can see views
  const [story] = await db.select().from(storiesTable).where(eq(storiesTable.id, storyId));
  if (!story) { res.status(404).json({ error: "Story not found" }); return; }
  if (story.authorId !== currentUser.id) { res.status(403).json({ error: "Forbidden" }); return; }

  const views = await db.select({ viewer: usersTable, createdAt: storyViewsTable.createdAt })
    .from(storyViewsTable)
    .innerJoin(usersTable, eq(storyViewsTable.viewerId, usersTable.id))
    .where(eq(storyViewsTable.storyId, storyId))
    .orderBy(desc(storyViewsTable.createdAt));

  res.json(views.map(v => ({
    user: buildUserSummary(v.viewer),
    viewedAt: v.createdAt?.toISOString() ?? null,
  })));
});

export default router;
