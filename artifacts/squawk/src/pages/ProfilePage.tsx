import { useRoute, Link, useLocation } from "wouter";
import {
  useGetUserByUsername, useGetUserPosts, useGetMe,
  useFollowUser, useUnfollowUser, useUpdateMyProfile,
  useGetUserFollowers, useGetUserFollowing, useGetActiveStories,
  type Post, type UserSummary,
} from "@workspace/api-client-react";
import { useState, useEffect, useRef } from "react";
import StoryUploadModal from "@/components/StoryUploadModal";
import { StoryViewer } from "@/components/StoriesRow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  BadgeCheck, Grid, Film, X, ImagePlus, Crown, Settings,
  PlusCircle, Bookmark, BarChart2, TrendingUp, Users,
  Activity, ExternalLink, Camera, MessageSquare, MoreHorizontal, Trash2, Copy,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PostGrid from "@/components/PostGrid";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient, useQuery } from "@tanstack/react-query";

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
  const { data: storyGroups } = useGetActiveStories();
  const posts = postsData?.posts || [];

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const updateProfileMutation = useUpdateMyProfile();
  const queryClient = useQueryClient();

  const [, navigate] = useLocation();
  const isMe = me?.username === username;
  const [activeTab, setActiveTab] = useState<"posts" | "flow" | "chirps" | "saved">("posts");

  const [isFollowing, setIsFollowing] = useState(false);
  useEffect(() => { if (profile) setIsFollowing(profile.isFollowing); }, [profile]);

  const [userListModal, setUserListModal] = useState<{ type: "followers" | "following"; title: string } | null>(null);
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const [userChirps, setUserChirps] = useState<any[]>([]);
  const [isLoadingChirps, setIsLoadingChirps] = useState(false);

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [chirpToDelete, setChirpToDelete] = useState<number | null>(null);
  const [showStoryUpload, setShowStoryUpload] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [show10kStats, setShow10kStats] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);

  // Find this user's story group
  const profileStoryGroup = storyGroups?.find(g => g.user.username === username);
  const profileStoryGroupIndex = storyGroups?.findIndex(g => g.user.username === username) ?? -1;
  const hasActiveStory = !!profileStoryGroup;

  const { data: nftStats, isLoading: nftLoading } = useQuery<any>({
    queryKey: ["nftStats"],
    queryFn: async () => {
      const res = await fetch("/api/nft/stats");
      if (!res.ok) throw new Error("Failed to fetch NFT stats");
      return res.json();
    },
    enabled: show10kStats,
    staleTime: 60_000,
  });
  const [founderToggling, setFounderToggling] = useState(false);
  const isAppOwner = (me as any)?.id === 1;

  useEffect(() => {
    if (isMe && activeTab === "saved") {
      setIsLoadingSaved(true);
      fetch("/api/users/me/saved", { credentials: "include" })
        .then(r => r.ok ? r.json() : [])
        .then((data: any) => setSavedPosts(Array.isArray(data) ? data : []))
        .catch(() => setSavedPosts([]))
        .finally(() => setIsLoadingSaved(false));
    }
  }, [isMe, activeTab]);

  useEffect(() => {
    if (activeTab === "chirps" && username) {
      setIsLoadingChirps(true);
      fetch(`/api/chirps?username=${encodeURIComponent(username)}`)
        .then(r => r.ok ? r.json() : { items: [] })
        .then((data: any) => setUserChirps(Array.isArray(data?.items) ? data.items : []))
        .catch(() => setUserChirps([]))
        .finally(() => setIsLoadingChirps(false));
    }
  }, [activeTab, username]);

  const handleToggleFounder = async () => {
    if (!profile || founderToggling) return;
    setFounderToggling(true);
    try {
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${base}/api/users/${profile.username}/set-founder`, { method: "PUT", credentials: "include" });
      if (res.ok) refetchProfile();
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      const url = await uploadFile(file);
      await updateProfileMutation.mutateAsync({
        data: {
          displayName: profile?.displayName ?? me?.displayName ?? "",
          bio: profile?.bio ?? me?.bio ?? null,
          avatarUrl: url,
          coverUrl: profile?.coverUrl ?? me?.coverUrl ?? null,
        },
      });
      refetchProfile();
      queryClient.invalidateQueries({ queryKey: ["getMe"] });
    } catch (e) { console.error(e); }
    finally { setAvatarUploading(false); }
  };

  const handleAvatarClick = () => {
    if (!isMe) return;
    // Clicking own avatar opens story upload (not PFP upload)
    setShowStoryUpload(true);
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!profile) return <div className="p-8 text-center text-muted-foreground">User not found</div>;

  const handleFollow = () => {
    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);

    const invalidateFollowCaches = () => {
      // Refetch the profile so follower counts update and isFollowing is fresh
      refetchProfile();
      // Invalidate the followers/following lists
      queryClient.invalidateQueries({ queryKey: ["getUserFollowers", profile.username] });
      queryClient.invalidateQueries({ queryKey: ["getUserFollowing", (me as any)?.username] });
    };

    if (newFollowing) {
      followMutation.mutate({ username: profile.username }, {
        onSuccess: invalidateFollowCaches,
        onError: () => setIsFollowing(false),
      });
    } else {
      unfollowMutation.mutate({ username: profile.username }, {
        onSuccess: invalidateFollowCaches,
        onError: () => setIsFollowing(true),
      });
    }
  };

  const getInitials = (n: string) => n ? n.charAt(0).toUpperCase() : "?";

  // Pink glow style for buttons
  const pinkGlowStyle = {
    background: "linear-gradient(135deg, #ec4899, #c084fc)",
    boxShadow: "0 0 14px 3px rgba(236,72,153,0.45), 0 0 28px 6px rgba(192,132,252,0.25)",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto w-full min-h-[100dvh] bg-background pb-20">
      {/* Hidden inputs */}
      {isMe && (
        <>
          <input ref={bannerInputRef} id="profile-banner-upload" type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
          <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
        </>
      )}

      {/* Cover / Banner */}
      <div className="h-48 md:h-64 w-full relative border-b border-border overflow-hidden bg-gradient-to-br from-primary/20 via-pink-400/15 to-[#c084fc]/20">
        {profile.coverUrl && (
          <img
            src={profile.coverUrl}
            alt="Banner"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: `center ${50 + ((profile as any).bannerOffsetY ?? 0)}%` }}
          />
        )}
        {isMe && (
          <>
            <label htmlFor="profile-banner-upload" className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/0 hover:bg-black/30 transition-colors opacity-0 hover:opacity-100">
              <div className="flex flex-col items-center gap-2 text-white">
                {bannerUploading
                  ? <div className="w-7 h-7 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  : <><ImagePlus className="w-7 h-7" /><span className="text-sm font-semibold">Change Banner</span></>
                }
              </div>
            </label>
            <label htmlFor="profile-banner-upload" className="absolute bottom-3 right-3 btn-water cursor-pointer text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              {bannerUploading
                ? <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                : <ImagePlus className="w-3.5 h-3.5" />
              }
              {bannerUploading ? "Uploading..." : "Edit banner"}
            </label>
          </>
        )}
      </div>

      <div className="px-4 md:px-8 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16 md:-mt-20 mb-6 gap-4">

          {/* Avatar with Story ring */}
          <div className="relative w-fit">
            {/* Story ring — glows pink when active story exists */}
            <div
              className={`w-32 h-32 md:w-40 md:h-40 rounded-full p-[3px] border-4 border-background shadow-2xl transition-all ${
                hasActiveStory
                  ? "bg-gradient-to-tr from-primary to-[#c084fc] cursor-pointer"
                  : "bg-gradient-to-tr from-primary/30 to-[#c084fc]/30"
              }`}
              style={hasActiveStory ? {
                boxShadow: "0 0 0 3px hsl(var(--background)), 0 0 20px 4px rgba(236,72,153,0.6), 0 0 40px 8px rgba(192,132,252,0.3)",
              } : undefined}
              onClick={() => {
                if (hasActiveStory && storyGroups && profileStoryGroupIndex >= 0) {
                  setStoryViewerOpen(true);
                }
              }}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-card relative group">
                <Avatar className="w-full h-full">
                  <AvatarImage src={profile.avatarUrl || ""} className="object-cover" />
                  <AvatarFallback style={{ backgroundColor: `hsl(${profile.username.length * 50 % 360}, 70%, 50%)`, color: "white", fontSize: "3rem" }}>
                    {getInitials(profile.displayName)}
                  </AvatarFallback>
                </Avatar>

                {/* Hover overlay — opens Add Story for own profile */}
                {isMe && (
                  <div
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 cursor-pointer rounded-full"
                    onClick={e => { e.stopPropagation(); setShowStoryUpload(true); }}
                  >
                    <PlusCircle className="w-7 h-7 text-white" />
                    <span className="text-[10px] text-white font-semibold">Add Story</span>
                  </div>
                )}
              </div>
            </div>

            {/* Story add / view buttons for own profile */}
            {isMe && (
              <div className="absolute bottom-2 right-0 flex flex-col gap-1">
                <button
                  onClick={() => setShowStoryUpload(true)}
                  className="w-9 h-9 bg-primary rounded-full border-4 border-background flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-10"
                  title="Add to story"
                  style={{ boxShadow: "0 0 10px 2px rgba(236,72,153,0.5)" }}
                >
                  <PlusCircle className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 md:pb-4 z-10 w-full md:w-auto flex-wrap">
            {isMe ? (
              <div className="flex gap-2 w-full md:w-auto flex-wrap">
                <Link href="/edit-profile" className="flex-1 md:flex-initial">
                  <Button
                    className="w-full md:w-36 font-semibold rounded-full text-white border-0"
                    style={pinkGlowStyle}
                  >
                    Edit Profile
                  </Button>
                </Link>
                <Button
                  onClick={() => setShow10kStats(true)}
                  className="rounded-full border-0 px-4 flex items-center gap-2 font-semibold text-sm shrink-0 text-white"
                  style={pinkGlowStyle}
                >
                  <BarChart2 className="w-4 h-4" />
                  10K Squad
                </Button>
                <Link href="/settings">
                  <Button variant="ghost" size="icon" className="rounded-full border border-border btn-water shrink-0">
                    <Settings className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Button
                  onClick={handleFollow}
                  className={`flex-1 md:w-32 font-bold rounded-full transition-all ${
                    isFollowing
                      ? "bg-transparent text-pink-400 border-2 border-pink-400"
                      : "text-white border-0"
                  }`}
                  style={isFollowing
                    ? { boxShadow: "0 0 10px 2px rgba(236,72,153,0.45)", background: "transparent" }
                    : pinkGlowStyle
                  }
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
                {founderToggling ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Crown className="w-3.5 h-3.5" />}
                {(profile as any).isFounder ? "Remove Founder" : "Mark as Founder"}
              </Button>
            )}
          </div>
        </div>

        {/* Profile info */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">{profile.displayName}</h1>
            {(profile as any).isFounder && <BadgeCheck className="w-6 h-6 text-pink-500" title="Founder" />}
            {profile.isVerified && !((profile as any).isFounder) && <BadgeCheck className="w-6 h-6 text-primary" />}
          </div>
          <p className="text-muted-foreground font-medium text-[15px]">@{profile.username}</p>
          {profile.bio && (
            <p className="mt-4 text-[15px] whitespace-pre-wrap max-w-2xl">
              {profile.bio.split(/(https?:\/\/[^\s]+)/g).map((part, i) =>
                /^https?:\/\//.test(part)
                  ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">{part}</a>
                  : <span key={i}>{part}</span>
              )}
            </p>
          )}
          {(profile as any).website && (
            <a
              href={(profile as any).website.startsWith("http") ? (profile as any).website : `https://${(profile as any).website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-1.5 text-primary text-sm hover:underline w-fit"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              {(profile as any).website.replace(/^https?:\/\//, "")}
            </a>
          )}

          <div className="flex gap-6 mt-6 pt-6 border-t border-border/50">
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground">{posts.length}</span>
              <span className="text-sm text-muted-foreground font-medium">Posts</span>
            </div>
            <button className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity text-left" onClick={() => setUserListModal({ type: "followers", title: "Followers" })}>
              <span className="font-bold text-lg text-foreground">{profile.followersCount ?? 0}</span>
              <span className="text-sm text-muted-foreground font-medium hover:text-primary transition-colors">Followers</span>
            </button>
            <button className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity text-left" onClick={() => setUserListModal({ type: "following", title: "Following" })}>
              <span className="font-bold text-lg text-foreground">{profile.followingCount ?? 0}</span>
              <span className="text-sm text-muted-foreground font-medium hover:text-primary transition-colors">Following</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-border mb-6 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("posts")}
            className={`flex-1 min-w-[60px] py-4 flex items-center justify-center gap-2 border-b-2 font-semibold uppercase tracking-wider text-sm transition-colors ${activeTab === "posts" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Grid className="w-4 h-4" />Posts
          </button>
          <button
            onClick={() => setActiveTab("flow")}
            className={`flex-1 min-w-[60px] py-4 flex items-center justify-center gap-2 border-b-2 font-semibold uppercase tracking-wider text-sm transition-colors ${activeTab === "flow" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <Film className="w-4 h-4" />Flow
          </button>
          <button
            onClick={() => setActiveTab("chirps")}
            className={`flex-1 min-w-[60px] py-4 flex items-center justify-center gap-2 border-b-2 font-semibold uppercase tracking-wider text-sm transition-colors ${activeTab === "chirps" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <MessageSquare className="w-4 h-4" />Chirps
          </button>
          {isMe && (
            <button
              onClick={() => setActiveTab("saved")}
              className={`flex-1 min-w-[60px] py-4 flex items-center justify-center gap-2 border-b-2 font-semibold uppercase tracking-wider text-sm transition-colors ${activeTab === "saved" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              <Bookmark className="w-4 h-4" />Saved
            </button>
          )}
        </div>

        {activeTab === "posts" && <PostGrid posts={posts as Post[]} />}

        {activeTab === "flow" && (() => {
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
        })()}

        {activeTab === "chirps" && (
          isLoadingChirps ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : userChirps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <MessageSquare className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">No chirps yet</p>
            </div>
          ) : (
            <div className="space-y-0 border border-border rounded-2xl overflow-hidden">
              {userChirps.map((chirp: any) => (
                <div key={chirp.id} className="p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-foreground text-[15px] leading-relaxed break-words flex-1">{chirp.content}</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors shrink-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        {isMe && (
                          <>
                            <DropdownMenuItem
                              onClick={() => setChirpToDelete(chirp.id)}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete chirp
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuItem
                          onClick={() => navigator.clipboard.writeText(`${window.location.origin}/chirps/${chirp.id}`).catch(() => {})}
                          className="cursor-pointer"
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy link
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {chirp.mediaUrl && (
                    chirp.mediaType === "video" ? (
                      <video
                        src={chirp.mediaUrl}
                        className="mt-3 rounded-xl max-h-72 w-full object-cover"
                        controls
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img src={chirp.mediaUrl} alt="" className="mt-3 rounded-xl max-h-72 w-full object-cover" />
                    )
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{new Date(chirp.createdAt).toLocaleDateString()}</span>
                    <span>{chirp.likesCount ?? 0} likes</span>
                    <span>{chirp.commentsCount ?? 0} replies</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === "saved" && isMe && (
          isLoadingSaved ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
              <Bookmark className="w-10 h-10 opacity-30" />
              <p className="text-sm font-medium">No saved posts yet</p>
            </div>
          ) : (
            <PostGrid posts={savedPosts} />
          )
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {userListModal && (
          <UserListModal title={userListModal.title} username={username || ""} type={userListModal.type} onClose={() => setUserListModal(null)} />
        )}
      </AnimatePresence>

      <StoryUploadModal
        open={showStoryUpload}
        onClose={() => setShowStoryUpload(false)}
        onSuccess={() => setShowStoryUpload(false)}
      />

      <AlertDialog open={chirpToDelete !== null} onOpenChange={open => { if (!open) setChirpToDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chirp?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your chirp. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (chirpToDelete === null) return;
                try {
                  await fetch(`/api/chirps/${chirpToDelete}`, { method: "DELETE", credentials: "include" });
                  setUserChirps(prev => prev.filter((c: any) => c.id !== chirpToDelete));
                } catch { /* silent */ }
                setChirpToDelete(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Story viewer for this user's stories */}
      <AnimatePresence>
        {storyViewerOpen && storyGroups && profileStoryGroupIndex >= 0 && (
          <StoryViewer
            groups={storyGroups}
            startIndex={profileStoryGroupIndex}
            onClose={() => setStoryViewerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* 10K Squad Stats Modal */}
      <AnimatePresence>
        {show10kStats && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4"
            onClick={() => setShow10kStats(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full md:max-w-md bg-card border border-border rounded-t-3xl md:rounded-3xl overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-[#c084fc] flex items-center justify-center shadow-lg">
                    <BarChart2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-foreground text-base">10K Squad Stats</h2>
                    <p className="text-xs text-muted-foreground">Live NFT data · Monad</p>
                  </div>
                </div>
                <button onClick={() => setShow10kStats(false)} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <div className="p-5">
                {nftLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground">Fetching on-chain data…</p>
                  </div>
                ) : nftStats ? (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Floor Price */}
                    <div className="bg-gradient-to-br from-primary/15 to-[#c084fc]/10 border border-primary/20 rounded-2xl p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <TrendingUp className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">Floor Price</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {nftStats.floorPrice != null ? Number(nftStats.floorPrice).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{nftStats.floorPriceSymbol ?? "MON"}</p>
                    </div>

                    {/* Holders */}
                    <div className="bg-muted/40 border border-border rounded-2xl p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">Holders</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {nftStats.numOwners != null ? nftStats.numOwners.toLocaleString() : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">unique wallets</p>
                    </div>

                    {/* Total Supply */}
                    <div className="bg-muted/40 border border-border rounded-2xl p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Activity className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-medium text-muted-foreground">Total Supply</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">{nftStats.totalSupply?.toLocaleString() ?? "3,333"}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">NFTs minted</p>
                    </div>

                    {/* Total Sales */}
                    <div className="bg-muted/40 border border-border rounded-2xl p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <BarChart2 className="w-3.5 h-3.5 text-pink-500" />
                        <span className="text-xs font-medium text-muted-foreground">Total Sales</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {nftStats.totalSales != null ? nftStats.totalSales.toLocaleString() : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">all-time</p>
                    </div>

                    {/* 24h Volume */}
                    <div className="bg-muted/40 border border-border rounded-2xl p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-xs font-medium text-muted-foreground">24h Volume</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {nftStats.volume24h != null ? Number(nftStats.volume24h).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">MON</p>
                    </div>

                    {/* 7d Volume */}
                    <div className="bg-muted/40 border border-border rounded-2xl p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                        <span className="text-xs font-medium text-muted-foreground">7d Volume</span>
                      </div>
                      <p className="text-2xl font-bold text-foreground">
                        {nftStats.volume7d != null ? Number(nftStats.volume7d).toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">MON</p>
                    </div>

                    {/* Total Volume — full width */}
                    {nftStats.totalVolume != null && (
                      <div className="col-span-2 bg-gradient-to-r from-primary/10 to-[#c084fc]/10 border border-primary/20 rounded-2xl p-4">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Activity className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-medium text-muted-foreground">Total Volume</span>
                        </div>
                        <p className="text-3xl font-bold text-foreground">
                          {Number(nftStats.totalVolume).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">MON all-time</p>
                      </div>
                    )}

                    {/* OpenSea link */}
                    <div className="col-span-2">
                      <a
                        href="https://opensea.io/collection/the-10k-squad"
                        target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 text-primary text-sm font-semibold hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" /> View on OpenSea
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8 text-sm">No NFT data available</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
