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
