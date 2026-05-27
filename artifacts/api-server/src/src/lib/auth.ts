import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  (req as any).clerkUserId = userId;
  next();
}

export async function resolveUser(clerkId: string) {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
    return user ?? null;
  } catch (err) {
    console.error("resolveUser DB error:", err);
    throw err;
  }
}

export async function optionalUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (clerkId) {
    try {
      const user = await resolveUser(clerkId);
      if (user) (req as any).currentUser = user;
    } catch {
      // treat as unauthenticated — don't block the request
    }
  }
  next();
}

export async function requireUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  const auth = getAuth(req);
  const clerkId = auth?.userId;
  if (!clerkId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const user = await resolveUser(clerkId);
    if (!user) {
      res.status(404).json({ error: "User not found — complete onboarding first" });
      return;
    }
    if ((user as any).isBanned) {
      res.status(403).json({ error: "banned" });
      return;
    }
    (req as any).currentUser = user;
    next();
  } catch (err) {
    console.error("requireUser error:", err);
    res.status(503).json({ error: "Service temporarily unavailable — please retry" });
  }
}
