import { useRoute, Link, useLocation } from "wouter";
import {
  useGetUserByUsername, useGetUserPosts, useGetMe,
  useFollowUser, useUnfollowUser, useUpdateMyProfile,
  useGetUserFollowers, useGetUserFollowing,
  type Post, type UserSummary,
} from "@workspace/api-client-react";
import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Grid, Film, X, ImagePlus, Crown } from "lucide-react";
import PostGrid from "@/components/PostGrid";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const { mediaUrl } = await res.json();
  return mediaUrl;
}

function UserListModal({
  title, username, type, onClose,
}: { title: string; username: string; type: "followers" | "following"; onClose: () => void }) {
  const followersQuery = useGetUserFollowers(username, { query: { enabled: type === "followers" } });
  const followingQuery = useGetUserFollowing(username, { query: { enabled: type === "following" } });
  const users: UserSummary[] = (type === "followers" ? followersQuery.data : followingQuery.data) || [];
  const isLoading = type === "followers" ? followersQuery.isLoading : followingQuery.isLoading;
  const getInitials = (n: string) => n ? n.charAt(0).toUpperCase() : "?";

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 320 }}
        className="bg-card border border-border rounded-3xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-bold text-lg text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-3 bg-muted rounded w-1/3" />
                </div>
              </div>
            ))
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No users yet</div>
          ) : (
            users.map(u => (
              <Link key={u.id} href={`/profile/${u.username}`} onClick={onClose}>
                <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-muted/60 transition-colors cursor-pointer">
                  <Avatar className="w-11 h-11 border border-border">
                    <AvatarImage src={u.avatarUrl || ""} />
                    <AvatarFallback className="bg-primary/20 text-primary font-bold">{getInitials(u.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-sm flex items-center gap-1">
                      {u.displayName}
                      {(u as any).isFounder && <BadgeCheck className="w-4 h-4 text-pink-500" title="Founder" />}
                      {u.isVerified && !((u as any).isFounder) && <BadgeCheck className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="text-muted-foreground text-xs">@{u.username}</div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ProfilePage() {
  const [match, params] = useRoute("/profile/:username");
  const username = match ? params?.username : "";

  const { data: me } = useGetMe();
  const { data: profile, isLoading, refetch: refetchProfile } = useGetUserByUsername(username || "", { query: { enabled: !!username, staleTime: 0 } });
  const { data: postsData } = useGetUserPosts(username || "", { query: { enabled: !!username } });
  const posts = postsData?.posts || [];

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const updateProfileMutation = useUpdateMyProfile();
  const queryClient = useQueryClient();

  const [, navigate] = useLocation();
  const isMe = me?.username === username;
  const [activeTab, setActiveTab] = useState<"posts" | "flow">("posts");

  const [isFollowing, setIsFollowing] = useState(false);
  useEffect(() => { if (profile) setIsFollowing(profile.isFollowing); }, [profile]);

  const [userListModal, setUserListModal] = useState<{ type: "followers" | "following"; title: string } | null>(null);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [founderToggling, setFounderToggling] = useState(false);

  const isAppOwner = (me as any)?.id === 1;

  const handleToggleFounder = async () => {
    if (!profile || founderToggling) return;
    setFounderToggling(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/users/${profile.username}/set-founder`, { method: "PUT", credentials: "include" });
      if (res.ok) {
        refetchProfile();
      }
    } catch (e) { console.error(e); }
    finally { setFounderToggling(false); }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    try {
      const url = await uploadFile(file);
      await updateProfileMutation.mutateAsync({
        data: {
          displayName: profile?.displayName ?? me?.displayName ?? "",
          bio: profile?.bio ?? me?.bio ?? null,
          avatarUrl: profile?.avatarUrl ?? me?.avatarUrl ?? null,
          coverUrl: url,
        },
      });
      refetchProfile();
    } catch (e) { console.error(e); }
    finally { setBannerUploading(false); }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!profile) return <div className="p-8 text-center text-muted-foreground">User not found</div>;

  const handleFollow = () => {
    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);
    if (newFollowing) followMutation.mutate({ username: profile.username }, { onError: () => setIsFollowing(false) });
    else unfollowMutation.mutate({ username: profile.username }, { onError: () => setIsFollowing(true) });
  };

  const getInitials = (n: string) => n ? n.charAt(0).toUpperCase() : "?";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto w-full min-h-[100dvh] bg-background pb-20">
      {/* Cover / Banner */}
      <div
        className="h-48 md:h-64 w-full relative border-b border-border overflow-hidden bg-gradient-to-br from-primary/20 via-pink-400/15 to-[#c084fc]/20"
        style={isMe ? { cursor: "pointer" } : {}}
        onClick={isMe ? () => bannerInputRef.current?.click() : undefined}
      >
        {profile.coverUrl && <img src={profile.coverUrl} alt="Banner" className="absolute inset-0 w-full h-full object-cover" />}
        {isMe && (
          <>
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
              <div className="flex flex-col items-center gap-2 text-white">
                {bannerUploading
                  ? <div className="w-7 h-7 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><ImagePlus className="w-7 h-7" /><span className="text-sm font-semibold">Change Banner</span></>
                }
              </div>
            </div>
            <div className="absolute bottom-3 right-3 btn-water text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5" onClick={e => { e.stopPropagation(); bannerInputRef.current?.click(); }}>
              <ImagePlus className="w-3.5 h-3.5" />
              Edit banner
            </div>
            <input ref={bannerInputRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          </>
        )}
      </div>

      <div className="px-4 md:px-8 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16 md:-mt-20 mb-6 gap-4">
          <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-2xl relative z-10 bg-card">
            <AvatarImage src={profile.avatarUrl || ""} className="object-cover" />
            <AvatarFallback style={{ backgroundColor: `hsl(${profile.username.length * 50 % 360}, 70%, 50%)`, color: "white", fontSize: "3rem" }}>
              {getInitials(profile.displayName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex gap-3 md:pb-4 z-10 w-full md:w-auto flex-wrap">
            {isMe ? (
              <Link href="/settings" className="w-full md:w-auto">
                <Button variant="secondary" className="w-full md:w-32 font-semibold rounded-full border border-border btn-water">Edit Profile</Button>
              </Link>
            ) : (
              <>
                <Button
                  onClick={handleFollow}
                  className={`flex-1 md:w-32 font-bold rounded-full transition-all btn-water ${isFollowing ? "bg-secondary/80 text-secondary-foreground border border-border" : "bg-gradient-to-r from-primary to-[#c084fc] text-white border-0"}`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </Button>
                <Button variant="secondary" className="rounded-full px-6 border border-border btn-water" onClick={() => navigate(`/messages?username=${profile.username}`)}>Message</Button>
              </>
            )}
            {isAppOwner && !isMe && (
              <Button
                onClick={handleToggleFounder}
                disabled={founderToggling}
                variant="outline"
                className={`rounded-full px-4 border font-semibold text-sm gap-1.5 transition-all ${(profile as any).isFounder ? "border-pink-500 text-pink-500 hover:bg-pink-500/10" : "border-border text-muted-foreground hover:border-pink-400 hover:text-pink-400"}`}
              >
                {founderToggling ? (
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Crown className="w-3.5 h-3.5" />
                )}
                {(profile as any).isFounder ? "Remove Founder" : "Mark as Founder"}
              </Button>
            )}
          </div>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">{profile.displayName}</h1>
            {(profile as any).isFounder && <BadgeCheck className="w-6 h-6 text-pink-500" title="Founder" />}
            {profile.isVerified && !((profile as any).isFounder) && <BadgeCheck className="w-6 h-6 text-primary" />}
          </div>
          <p className="text-muted-foreground font-medium text-[15px]">@{profile.username}</p>
          {profile.bio && <p className="mt-4 text-[15px] whitespace-pre-wrap max-w-2xl">{profile.bio}</p>}

          <div className="flex gap-6 mt-6 pt-6 border-t border-border/50">
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground">{posts.length}</span>
              <span className="text-sm text-muted-foreground font-medium">Posts</span>
            </div>
            <button
              className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity text-left"
              onClick={() => setUserListModal({ type: "followers", title: `Followers` })}
            >
              <span className="font-bold text-lg text-foreground">{profile.followersCount ?? 0}</span>
              <span className="text-sm text-muted-foreground font-medium hover:text-primary transition-colors">Followers</span>
            </button>
            <button
              className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity text-left"
              onClick={() => setUserListModal({ type: "following", title: `Following` })}
            >
              <span className="font-bold text-lg text-foreground">{profile.followingCount ?? 0}</span>
              <span className="text-sm text-muted-foreground font-medium hover:text-primary transition-colors">Following</span>
            </button>
          </div>
        </div>

        <div className="flex items-center border-b border-border mb-6">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-2 font-semibold uppercase tracking-wider text-sm transition-colors ${activeTab === "posts" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Grid className="w-4 h-4" />Posts
          </button>
          <button
            onClick={() => setActiveTab("flow")}
            className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-2 font-semibold uppercase tracking-wider text-sm transition-colors ${activeTab === "flow" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Film className="w-4 h-4" />Flow
          </button>
        </div>

        {activeTab === "posts" ? (
          <PostGrid posts={posts as Post[]} />
        ) : (
          (() => {
            const videoPosts = (posts as Post[]).filter(p => p.mediaType === "video");
            if (videoPosts.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                  <Film className="w-10 h-10 opacity-30" />
                  <p className="text-sm font-medium">No Flow videos yet</p>
                </div>
              );
            }
            return <PostGrid posts={videoPosts} />;
          })()
        )}
      </div>

      <AnimatePresence>
        {userListModal && (
          <UserListModal
            title={userListModal.title}
            username={username || ""}
            type={userListModal.type}
            onClose={() => setUserListModal(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
