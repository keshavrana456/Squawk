import { Router, type IRouter } from "express";
import { eq, desc, sql, ilike, or } from "drizzle-orm";
import { db, usersTable, postsTable, likesTable } from "@workspace/db";
import { buildUserSummary, buildPostWithMeta } from "../lib/userHelpers";
import { resolveUser } from "../lib/auth";
import { SearchQueryParams, GetHashtagPostsParams } from "@workspace/api-zod";

const router: IRouter = Router();

// GET /explore/search
router.get("/explore/search", async (req, res): Promise<void> => {
  const qp = SearchQueryParams.safeParse(req.query);
  if (!qp.success) { res.status(400).json({ error: qp.error.message }); return; }

  const q = qp.data.q;
  const type = qp.data.type ?? "all";

  const clerkId = (req as any).clerkUserId as string | undefined;
  let currentUserId: number | undefined;
  if (clerkId) {
    const cur = await resolveUser(clerkId);
    currentUserId = cur?.id;
  }

  let users: any[] = [];
  let posts: any[] = [];

  if (type === "users" || type === "all") {
    const userRows = await db.select().from(usersTable).where(
      or(
        ilike(usersTable.username, `%${q}%`),
        ilike(usersTable.displayName, `%${q}%`)
      )
    ).limit(10);
    users = userRows.map(u => buildUserSummary(u));
  }

  if (type === "posts" || type === "all") {
    const postRows = await db.select({ post: postsTable, author: usersTable })
      .from(postsTable)
      .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
      .where(ilike(postsTable.caption, `%${q}%`))
      .orderBy(desc(postsTable.createdAt))
      .limit(12);
    posts = await Promise.all(postRows.map(r => buildPostWithMeta(r.post, r.author, currentUserId)));
  }

  res.json({ users, posts });
});

// GET /explore/hashtags/:tag
router.get("/explore/hashtags/:tag", async (req, res): Promise<void> => {
  const params = GetHashtagPostsParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const clerkId = (req as any).clerkUserId as string | undefined;
  let currentUserId: number | undefined;
  if (clerkId) {
    const cur = await resolveUser(clerkId);
    currentUserId = cur?.id;
  }

  const rows = await db.select({ post: postsTable, author: usersTable })
    .from(postsTable)
    .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
    .where(sql`${params.data.tag} = ANY(${postsTable.hashtags})`)
    .orderBy(desc(postsTable.createdAt))
    .limit(20);

  const postsWithMeta = await Promise.all(rows.map(r => buildPostWithMeta(r.post, r.author, currentUserId)));
  res.json({ posts: postsWithMeta, hasMore: false, nextCursor: null });
});

// GET /explore/trending-hashtags
router.get("/explore/trending-hashtags", async (req, res): Promise<void> => {
  const rows = await db.execute(sql`
    SELECT unnest(hashtags) as tag, count(*) as post_count
    FROM posts
    WHERE created_at > now() - interval '7 days'
    GROUP BY tag
    ORDER BY post_count DESC
    LIMIT 20
  `);

  res.json(rows.rows.map((r: any) => ({ tag: r.tag, postCount: parseInt(r.post_count) })));
});

export default router;
