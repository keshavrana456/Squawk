import { Router, type IRouter } from "express";
import { eq, and, desc, gt, sql, inArray } from "drizzle-orm";
import { db, usersTable, storiesTable, storyViewsTable, followsTable } from "@workspace/db";
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
});

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
    expiresAt,
  }).returning();

  res.status(201).json({
    id: story.id,
    authorId: story.authorId,
    author: buildUserSummary(currentUser),
    mediaUrl: story.mediaUrl,
    mediaType: story.mediaType,
    caption: story.caption,
    objectFit: story.objectFit,
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

export default router;
