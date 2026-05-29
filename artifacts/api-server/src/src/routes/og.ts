import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, postsTable, usersTable, chirpsTable } from "@workspace/db";

const router: IRouter = Router();

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildOgHtml({
  title,
  description,
  imageUrl,
  redirectUrl,
  siteName = "Squawk",
}: {
  title: string;
  description: string;
  imageUrl: string | null;
  redirectUrl: string;
  siteName?: string;
}) {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImage = imageUrl ? escapeHtml(imageUrl) : "";
  const safeUrl = escapeHtml(redirectUrl);

  return `<!DOCTYPE html>
<html prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0;url=${safeUrl}" />
  <title>${safeTitle}</title>

  <!-- Open Graph -->
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="${escapeHtml(siteName)}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:url" content="${safeUrl}" />
  ${safeImage ? `<meta property="og:image" content="${safeImage}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />` : ""}

  <!-- Twitter / X card -->
  <meta name="twitter:card" content="${safeImage ? "summary_large_image" : "summary"}" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  ${safeImage ? `<meta name="twitter:image" content="${safeImage}" />` : ""}

  <!-- WhatsApp / general -->
  <meta name="description" content="${safeDesc}" />
  ${safeImage ? `<link rel="image_src" href="${safeImage}" />` : ""}
</head>
<body>
  <p>Redirecting to <a href="${safeUrl}">${safeTitle}</a>…</p>
  <script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
</body>
</html>`;
}

function appUrl(req: Request): string {
  const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
  const host = req.headers["x-forwarded-host"] || req.get("host") || "";
  return `${proto}://${host}`;
}

// GET /api/og/post/:id
router.get("/og/post/:id", async (req: Request, res: Response) => {
  const postId = parseInt(req.params.id, 10);
  if (!postId || isNaN(postId)) {
    res.status(400).send("Invalid post ID");
    return;
  }

  try {
    const [row] = await db
      .select({ post: postsTable, author: usersTable })
      .from(postsTable)
      .innerJoin(usersTable, eq(postsTable.authorId, usersTable.id))
      .where(eq(postsTable.id, postId))
      .limit(1);

    if (!row) {
      res.status(404).send("Post not found");
      return;
    }

    const { post, author } = row;
    const base = appUrl(req);
    const redirectUrl = `${base}/post/${postId}`;
    const title = post.caption
      ? `${author.username}: "${post.caption.slice(0, 80)}${post.caption.length > 80 ? "…" : ""}"`
      : `${author.username} on Squawk`;
    const description = post.caption || `Check out this post by @${author.username} on Squawk`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(
      buildOgHtml({
        title,
        description,
        imageUrl: post.mediaType === "image" ? post.mediaUrl : null,
        redirectUrl,
      })
    );
  } catch (err) {
    console.error("OG post error:", err);
    res.status(500).send("Error");
  }
});

// GET /api/og/chirp/:id
router.get("/og/chirp/:id", async (req: Request, res: Response) => {
  const chirpId = parseInt(req.params.id, 10);
  if (!chirpId || isNaN(chirpId)) {
    res.status(400).send("Invalid chirp ID");
    return;
  }

  try {
    const [row] = await db
      .select({ chirp: chirpsTable, author: usersTable })
      .from(chirpsTable)
      .innerJoin(usersTable, eq(chirpsTable.authorId, usersTable.id))
      .where(eq(chirpsTable.id, chirpId))
      .limit(1);

    if (!row) {
      res.status(404).send("Chirp not found");
      return;
    }

    const { chirp, author } = row;
    const base = appUrl(req);
    const redirectUrl = `${base}/chirps?id=${chirpId}`;
    const title = `${author.username} on Squawk: "${chirp.content.slice(0, 80)}${chirp.content.length > 80 ? "…" : ""}"`;
    const description = chirp.content;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.send(
      buildOgHtml({
        title,
        description,
        imageUrl: (chirp as any).mediaUrl || null,
        redirectUrl,
      })
    );
  } catch (err) {
    console.error("OG chirp error:", err);
    res.status(500).send("Error");
  }
});

export default router;
