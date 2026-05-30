import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!_client) {
    if (!supabaseUrl || !supabaseServiceRoleKey) return null;
    _client = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return _client;
}

export interface SyncUser {
  id: number;
  clerkId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
  website: string | null;
  isVerified: boolean;
  isFounder: boolean;
  isFounderVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncPost {
  id: number;
  authorId: number;
  caption: string | null;
  mediaUrl: string;
  mediaType: string;
  thumbnailUrl: string | null;
  hashtags: string[];
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncChirp {
  id: number;
  authorId: number;
  content: string;
  hashtags: string[];
  mentions: string[];
  mediaUrl: string | null;
  mediaType: string | null;
  parentId: number | null;
  rechirpOfId: number | null;
  quoteOfId: number | null;
  viewCount: number;
  createdAt: Date;
}

export async function syncUserToSupabase(user: SyncUser): Promise<void> {
  const client = getClient();
  if (!client) return;
  try {
    await client.from("users").upsert(
      {
        id: user.id,
        clerk_id: user.clerkId,
        username: user.username,
        display_name: user.displayName,
        bio: user.bio,
        avatar_url: user.avatarUrl,
        cover_url: user.coverUrl,
        website: user.website,
        is_verified: user.isVerified,
        is_founder: user.isFounder,
        is_founder_verified: user.isFounderVerified,
        created_at: user.createdAt,
        updated_at: new Date(),
      },
      { onConflict: "id" },
    );
  } catch (err) {
    console.warn("[supabase] Failed to sync user:", err);
  }
}

export async function syncPostToSupabase(post: SyncPost): Promise<void> {
  const client = getClient();
  if (!client) return;
  try {
    await client.from("posts").upsert(
      {
        id: post.id,
        author_id: post.authorId,
        caption: post.caption,
        media_url: post.mediaUrl,
        media_type: post.mediaType,
        thumbnail_url: post.thumbnailUrl,
        hashtags: post.hashtags,
        views_count: post.viewsCount,
        created_at: post.createdAt,
        updated_at: new Date(),
      },
      { onConflict: "id" },
    );
  } catch (err) {
    console.warn("[supabase] Failed to sync post:", err);
  }
}

export async function syncChirpToSupabase(chirp: SyncChirp): Promise<void> {
  const client = getClient();
  if (!client) return;
  try {
    await client.from("chirps").upsert(
      {
        id: chirp.id,
        author_id: chirp.authorId,
        content: chirp.content,
        hashtags: chirp.hashtags,
        mentions: chirp.mentions,
        media_url: chirp.mediaUrl,
        media_type: chirp.mediaType,
        parent_id: chirp.parentId,
        rechirp_of_id: chirp.rechirpOfId,
        quote_of_id: chirp.quoteOfId,
        view_count: chirp.viewCount,
        created_at: chirp.createdAt,
      },
      { onConflict: "id" },
    );
  } catch (err) {
    console.warn("[supabase] Failed to sync chirp:", err);
  }
}
