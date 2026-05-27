import { useRoute, Link, useLocation } from "wouter";
import { toast } from "sonner";
import {
  useGetUserByUsername, useGetUserPosts, useGetMe,
  useFollowUser, useUnfollowUser, useUpdateMyProfile,
  useGetUserFollowers, useGetUserFollowing, useGetActiveStories,
  getGetMeQueryKey, getGetUserByUsernameQueryKey,
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
  Activity, ExternalLink, Camera, MessageSquare, MoreHorizontal, Trash2, Copy, Repeat2,
  ShieldAlert, ShieldOff, ShieldCheck, UserX, DollarSign,
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
                      {(u as any).isFounder && <BadgeCheck className="w-4 h-4 text-pink-500" />}
                      {(u as any).isFounderVerified && <BadgeCheck className="w-4 h-4 text-purple-500" />}
                      {u.isVerified && !((u as any).isFounder) && !((u as any).isFounderVerified) && <BadgeCheck className="w-4 h-4 text-primary" />}
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
  // Local override for immediate preview after upload (before server cache refreshes)
  const [localBannerUrl, setLocalBannerUrl] = useState<string | null>(null);
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null);
  const [show10kStats, setShow10kStats] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);

  const [showEarnModal, setShowEarnModal] = useState(false);
  const [earnNoClicked, setEarnNoClicked] = useState(false);
  const [showMobileYesMsg, setShowMobileYesMsg] = useState(false);
  const [yesOffset, setYesOffset] = useState({ x: 0, y: 0 });
  const yesBtnRef = useRef<HTMLButtonElement>(null);
  const earnModalRef = useRef<HTMLDivElement>(null);

  const handleYesMouseMove = (e: React.MouseEvent) => {
    const btn = yesBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 90) {
      const angle = Math.atan2(dy, dx);
      const flee = 130;
      setYesOffset(prev => ({
        x: prev.x - Math.cos(angle) * flee,
        y: prev.y - Math.sin(angle) * flee,
      }));
    }
  };

  // Find this user's story group
  const profileStoryGroup = storyGroups?.find((g: any) => g.user.username === username);
  const profileStoryGroupIndex = storyGroups?.findIndex((g: any) => g.user.username === username) ?? -1;
  const hasActiveStory = !!profileStoryGroup;

  const [statsTab, setStatsTab] = useState<"stats" | "sales" | "holders">("stats");

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

  const { data: nftSales, isLoading: salesLoading } = useQuery<any[]>({
    queryKey: ["nftSales"],
    queryFn: async () => {
      const res = await fetch("/api/nft/sales");
      if (!res.ok) throw new Error("Failed to fetch NFT sales");
      return res.json();
    },
    enabled: show10kStats && statsTab === "sales",
    staleTime: 30_000,
    refetchInterval: show10kStats && statsTab === "sales" ? 30_000 : false,
  });

  const { data: holdersData, isLoading: holdersLoading } = useQuery<any>({
    queryKey: ["nftHolders25"],
    queryFn: async () => {
      const res = await fetch("/api/nft/holders?limit=25");
      if (!res.ok) throw new Error("Failed to fetch holders");
      return res.json();
    },
    enabled: show10kStats && statsTab === "holders",
    staleTime: 60_000,
    refetchInterval: show10kStats && statsTab === "holders" ? 60_000 : false,
  });

  const [founderToggling, setFounderToggling] = useState(false);
  const isAppOwner = (me as any)?.id === 1;
  const isFounder = (me as any)?.isFounder;

  const [isBlocking, setIsBlocking] = useState(false);
  const [isBlockingToggling, setIsBlockingToggling] = useState(false);
  useEffect(() => { if (profile) setIsBlocking(!!(profile as any).isBlocked); }, [profile]);

  const [isBanned, setIsBanned] = useState(false);
  useEffect(() => { if (profile) setIsBanned(!!(profile as any).isBanned); }, [profile]);

  const [isFounderVerifiedToggling, setIsFounderVerifiedToggling] = useState(false);
  const [isBanToggling, setIsBanToggling] = useState(false);

  const handleBlock = async () => {
    if (!profile || isBlockingToggling) return;
    setIsBlockingToggling(true);
    try {
      const method = isBlocking ? "DELETE" : "POST";
      const res = await fetch(`/api/blocks/${profile.username}`, { method, credentials: "include" });
      if (res.ok) {
        setIsBlocking(!isBlocking);
        refetchProfile();
      }
    } catch (e) { console.error(e); }
    finally { setIsBlockingToggling(false); }
  };

  const handleShareProfile = () => {
    if (!profile) return;
    const url = `${window.location.origin}/profile/${profile.username}`;
    if (navigator.share) {
      navigator.share({ title: profile.displayName || profile.username, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        toast.success("Profile link copied!");
      }).catch(() => {
        toast.error("Could not copy link");
      });
    }
  };

  const handleToggleFounderVerified = async () => {
    if (!profile || isFounderVerifiedToggling) return;
    setIsFounderVerifiedToggling(true);
    try {
      const res = await fetch(`/api/users/${profile.username}/set-founder-verified`, { method: "PUT", credentials: "include" });
      if (res.ok) refetchProfile();
    } catch (e) { console.error(e); }
    finally { setIsFounderVerifiedToggling(false); }
  };

  const handleToggleBan = async () => {
    if (!profile || isBanToggling) return;
    setIsBanToggling(true);
    try {
      const res = await fetch(`/api/users/${profile.username}/ban`, { method: "PUT", credentials: "include" });
      if (res.ok) { setIsBanned(!isBanned); refetchProfile(); }
    } catch (e) { console.error(e); }
    finally { setIsBanToggling(false); }
  };

  const handleAdminDeletePost = async (postId: number) => {
    try {
      await fetch(`/api/admin/posts/${postId}`, { method: "DELETE", credentials: "include" });
      queryClient.invalidateQueries({ queryKey: ["getUserPosts", username] });
    } catch (e) { console.error(e); }
  };

  const handleAdminDeleteChirp = async (chirpId: number) => {
    try {
      await fetch(`/api/admin/chirps/${chirpId}`, { method: "DELETE", credentials: "include" });
      setUserChirps(prev => prev.filter((c: any) => c.id !== chirpId));
    } catch (e) { console.error(e); }
  };

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
    // Reset input so same file can be re-selected
    e.target.value = "";
    setBannerUploading(true);
    // Immediately show a local preview
    const objectUrl = URL.createObjectURL(file);
    setLocalBannerUrl(objectUrl);
    try {
      const url = await uploadFile(file);
      // Update local preview to the real persistent URL (cache-busted)
      setLocalBannerUrl(url + "?t=" + Date.now());
      await updateProfileMutation.mutateAsync({
        data: {
          displayName: profile?.displayName ?? me?.displayName ?? "",
          bio: profile?.bio ?? me?.bio ?? null,
          avatarUrl: profile?.avatarUrl ?? me?.avatarUrl ?? null,
          coverUrl: url,
        },
      });
      // Invalidate all relevant caches so the new banner persists after reload
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetUserByUsernameQueryKey(username || "") }),
        refetchProfile(),
      ]);
    } catch (err) {
      console.error(err);
      // Revert local preview on failure
      setLocalBannerUrl(null);
    } finally {
      setBannerUploading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setAvatarUploading(true);
    const objectUrl = URL.createObjectURL(file);
    setLocalAvatarUrl(objectUrl);
    try {
      const url = await uploadFile(file);
      setLocalAvatarUrl(url + "?t=" + Date.now());
      await updateProfileMutation.mutateAsync({
        data: {
          displayName: profile?.displayName ?? me?.displayName ?? "",
          bio: profile?.bio ?? me?.bio ?? null,
          avatarUrl: url,
          coverUrl: profile?.coverUrl ?? me?.coverUrl ?? null,
        },
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }),
        queryClient.invalidateQueries({ queryKey: getGetUserByUsernameQueryKey(username || "") }),
        refetchProfile(),
      ]);
    } catch (err) {
      console.error(err);
      setLocalAvatarUrl(null);
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleAvatarClick = () => {
    if (!isMe) return;
    // Own PFP click → open story viewer if active story exists, else open story upload
    if (hasActiveStory && storyGroups && profileStoryGroupIndex >= 0) {
      setStoryViewerOpen(true);
    } else {
      setShowStoryUpload(true);
    }
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
        {/* Show localBannerUrl first (immediate preview), then profile.coverUrl */}
        {(localBannerUrl || profile.coverUrl) && (
          <motion.img
            key={localBannerUrl || profile.coverUrl}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            src={localBannerUrl || profile.coverUrl!}
            alt="Banner"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: `center ${50 + ((profile as any).bannerOffsetY ?? 0)}%` }}
          />
        )}
        {/* Loading overlay while uploading */}
        {bannerUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
            <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}
        {/* Hover-to-change overlay (no permanent button) */}
        {isMe && !bannerUploading && (
          <label htmlFor="profile-banner-upload" className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/0 hover:bg-black/30 transition-colors opacity-0 hover:opacity-100 group">
            <div className="flex flex-col items-center gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity">
              <ImagePlus className="w-7 h-7 drop-shadow" />
              <span className="text-sm font-semibold drop-shadow">Change Banner</span>
            </div>
          </label>
        )}
        {/* Three-dot options menu — only visible when viewing another user's profile */}
        {!isMe && (
          <div className="absolute top-3 right-3 z-20">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-9 h-9 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white hover:bg-black/60 transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={handleBlock}
                  disabled={isBlockingToggling}
                  className={isBlocking ? "text-red-400 focus:text-red-400" : ""}
                >
                  {isBlockingToggling
                    ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    : <UserX className="w-4 h-4 mr-2" />
                  }
                  {isBlocking ? "Unblock" : "Block"}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleShareProfile}>
                  <Copy className="w-4 h-4 mr-2" />
                  Share Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="px-4 md:px-8 relative">
        <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16 md:-mt-20 mb-6 gap-4">

          {/* Avatar with Story ring */}
          <div className="relative w-fit">
            {/* Story ring — glows pink when active story exists */}
            <div
              className={`w-32 h-32 md:w-40 md:h-40 rounded-full p-[3px] border-4 border-background shadow-2xl transition-all ${
                hasActiveStory || isMe
                  ? "bg-gradient-to-tr from-primary to-[#c084fc] cursor-pointer"
                  : "bg-gradient-to-tr from-primary/30 to-[#c084fc]/30"
              }`}
              style={hasActiveStory ? {
                boxShadow: "0 0 0 3px hsl(var(--background)), 0 0 20px 4px rgba(236,72,153,0.6), 0 0 40px 8px rgba(192,132,252,0.3)",
              } : undefined}
              onClick={handleAvatarClick}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-card relative">
                <Avatar className="w-full h-full">
                  <AvatarImage src={localAvatarUrl || profile.avatarUrl || ""} className="object-cover" />
                  <AvatarFallback style={{ backgroundColor: `hsl(${profile.username.length * 50 % 360}, 70%, 50%)`, color: "white", fontSize: "3rem" }}>
                    {getInitials(profile.displayName)}
                  </AvatarFallback>
                </Avatar>
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Plus button for own profile — always shows to add story */}
            {isMe && (
              <button
                onClick={e => { e.stopPropagation(); setShowStoryUpload(true); }}
                className="absolute bottom-2 right-0 w-9 h-9 bg-primary rounded-full border-4 border-background flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors z-10"
                title="Add to story"
                style={{ boxShadow: "0 0 10px 2px rgba(236,72,153,0.5)" }}
              >
                <PlusCircle className="w-5 h-5 text-white" />
              </button>
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
                <Button
                  onClick={() => { setShowEarnModal(true); setEarnNoClicked(false); setYesOffset({ x: 0, y: 0 }); setShowMobileYesMsg(false); }}
                  variant="ghost"
                  size="icon"
                  className="rounded-full border border-emerald-500/50 btn-water shrink-0 text-emerald-400 hover:text-emerald-300 hover:border-emerald-400"
                  title="Earn Money"
                >
                  <DollarSign className="w-4 h-4" />
                </Button>
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
            {isFounder && !isMe && (
              <Button
                onClick={handleToggleFounderVerified}
                disabled={isFounderVerifiedToggling}
                variant="outline"
                className={`rounded-full px-4 border font-semibold text-sm gap-1.5 transition-all ${(profile as any).isFounderVerified ? "border-purple-500 text-purple-500 hover:bg-purple-500/10" : "border-border text-muted-foreground hover:border-purple-400 hover:text-purple-400"}`}
              >
                {isFounderVerifiedToggling ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                {(profile as any).isFounderVerified ? "Remove Purple Badge" : "Grant Purple Badge"}
              </Button>
            )}
            {(isFounder || isAppOwner) && !isMe && (
              <Button
                onClick={handleToggleBan}
                disabled={isBanToggling}
                variant="outline"
                className={`rounded-full px-4 border font-semibold text-sm gap-1.5 transition-all ${isBanned ? "border-orange-500 text-orange-500 hover:bg-orange-500/10" : "border-border text-muted-foreground hover:border-orange-400 hover:text-orange-400"}`}
              >
                {isBanToggling ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                {isBanned ? "Unban User" : "Ban User"}
              </Button>
            )}
          </div>
        </div>

        {/* Profile info */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">{profile.displayName}</h1>
            {(profile as any).isFounder && <BadgeCheck className="w-6 h-6 text-pink-500" title="Founder" />}
            {(profile as any).isFounderVerified && <BadgeCheck className="w-6 h-6 text-purple-500" title="Verified by Founder" />}
            {profile.isVerified && !((profile as any).isFounder) && !((profile as any).isFounderVerified) && <BadgeCheck className="w-6 h-6 text-primary" title="Verified" />}
          </div>
          <p className="text-muted-foreground font-medium text-[15px]">@{profile.username}</p>
          {profile.bio && (
            <p className="mt-4 text-[15px] whitespace-pre-wrap max-w-2xl">
              {profile.bio.split(/(https?:\/\/[^\s]+)/g).map((part: string, i: number) =>
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
                <Link key={chirp.id} href={`/chirps?id=${chirp.id}`} className="block">
                <div className="p-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors cursor-pointer">
                  {chirp.rechirpOfId && chirp.originalChirp && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                      <Repeat2 className="w-3.5 h-3.5" />
                      <span>Rechirped</span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {chirp.rechirpOfId && chirp.originalChirp ? (
                        <div className="border border-border rounded-xl p-3 bg-muted/20">
                          <p className="text-xs text-muted-foreground font-medium mb-1">@{chirp.originalChirp.author?.username}</p>
                          <p className="text-foreground text-[15px] leading-relaxed break-words">{chirp.originalChirp.content}</p>
                        </div>
                      ) : (
                        <p className="text-foreground text-[15px] leading-relaxed break-words">{chirp.content}</p>
                      )}
                    </div>
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
                        {!isMe && (isFounder || isAppOwner) && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleAdminDeleteChirp(chirp.id)}
                              className="text-destructive focus:text-destructive cursor-pointer"
                            >
                              <ShieldAlert className="w-4 h-4 mr-2" />
                              Delete (mod)
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
                </Link>
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

              {/* Tab switcher */}
              <div className="flex gap-1 px-5 pt-4 pb-0">
                <button
                  onClick={() => setStatsTab("stats")}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${statsTab === "stats" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setStatsTab("sales")}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${statsTab === "sales" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Live Sales
                </button>
                <button
                  onClick={() => setStatsTab("holders")}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${statsTab === "holders" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Crown className="w-3 h-3" />
                  Holders
                </button>
              </div>

              <div className="p-5">
                {statsTab === "stats" ? (
                  nftLoading ? (
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
                )
                ) : statsTab === "sales" ? (
                  /* ── Live Sales Tab ── */
                  salesLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground">Loading recent sales…</p>
                    </div>
                  ) : nftSales && nftSales.length > 0 ? (
                    <div className="flex flex-col gap-0 max-h-[60vh] overflow-y-auto -mx-1 px-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-xs text-green-400 font-semibold uppercase tracking-widest">Live · refreshes every 30s</span>
                      </div>
                      {nftSales.map((sale: any, i: number) => {
                        const mins = Math.floor((Date.now() - sale.timestamp) / 60000);
                        const timeAgo = mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins/60)}h ago` : `${Math.floor(mins/1440)}d ago`;
                        return (
                          <motion.a
                            key={sale.id}
                            href={sale.openseaUrl ?? "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center gap-3 py-2.5 border-b border-border last:border-0 hover:bg-muted/40 rounded-xl px-2 -mx-2 transition-colors group"
                          >
                            {/* NFT thumbnail */}
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted shrink-0">
                              {sale.imageUrl ? (
                                <img src={sale.imageUrl} alt={sale.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg">🦜</div>
                              )}
                            </div>
                            {/* Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-foreground truncate">{sale.name}</span>
                                <span className="text-sm font-bold text-primary shrink-0">{sale.priceFormatted} <span className="text-xs font-normal text-muted-foreground">{sale.symbol}</span></span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[11px] text-muted-foreground truncate max-w-[70px]">{sale.seller}</span>
                                <TrendingUp className="w-2.5 h-2.5 text-muted-foreground/50 shrink-0" />
                                <span className="text-[11px] text-muted-foreground truncate max-w-[70px]">{sale.buyer}</span>
                                <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{timeAgo}</span>
                              </div>
                            </div>
                          </motion.a>
                        );
                      })}
                      <a
                        href="https://opensea.io/collection/the-10k-squad"
                        target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-2 text-primary text-sm font-semibold hover:underline mt-4"
                      >
                        <ExternalLink className="w-4 h-4" /> View all on OpenSea
                      </a>
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8 text-sm">No recent sales found</p>
                  )
                ) : (
                  /* ── Top Holders Tab ── */
                  holdersLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground">Scanning on-chain data…</p>
                    </div>
                  ) : holdersData?.data && holdersData.data.length > 0 ? (
                    <div className="flex flex-col gap-0 max-h-[60vh] overflow-y-auto -mx-1 px-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Crown className="w-3.5 h-3.5 text-yellow-400" />
                          <span className="text-xs font-semibold text-yellow-400 uppercase tracking-widest">Top {holdersData.data.length} Wallets</span>
                        </div>
                        {holdersData.totalHolders && (
                          <span className="text-xs text-muted-foreground">{holdersData.totalHolders.toLocaleString()} total holders</span>
                        )}
                      </div>
                      {holdersData.data.map((h: any, i: number) => {
                        const maxCount = holdersData.data[0]?.count ?? 1;
                        const pct = Math.round((h.count / maxCount) * 100);
                        const isTop3 = i < 3;
                        const medalColor = i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : "text-amber-600";
                        return (
                          <motion.div
                            key={h.address}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-center gap-3 py-2.5 border-b border-border last:border-0"
                          >
                            {/* Rank */}
                            <div className="w-7 text-center shrink-0">
                              {isTop3
                                ? <span className={`text-base font-black ${medalColor}`}>{["🥇","🥈","🥉"][i]}</span>
                                : <span className="text-xs text-muted-foreground font-bold">#{i + 1}</span>
                              }
                            </div>
                            {/* Address */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="text-xs font-mono text-foreground truncate">
                                  {h.address.slice(0, 6)}…{h.address.slice(-4)}
                                </span>
                                <span className="text-xs font-bold text-primary shrink-0">{h.count} NFT{h.count !== 1 ? "s" : ""}</span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full bg-gradient-to-r from-primary to-[#c084fc]"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ delay: i * 0.03 + 0.1, duration: 0.5 }}
                                />
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                      {holdersData.scannedAt && (
                        <p className="text-center text-[10px] text-muted-foreground mt-3">
                          Scanned {Math.round((Date.now() - holdersData.scannedAt) / 60000)}m ago · multicall3 on Monad
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8 text-sm">
                      {holdersData?.status === "scanning" ? "Still scanning all 3,333 tokens…" : "No holder data available"}
                    </p>
                  )
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Earn Money Modal ── */}
      <AnimatePresence>
        {showEarnModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
            onMouseMove={handleYesMouseMove}
          >
            {/* Mobile full-screen YES message */}
            <AnimatePresence>
              {showMobileYesMsg && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black text-center px-8"
                  onClick={() => setShowMobileYesMsg(false)}
                >
                  <div className="text-6xl mb-6">🏳️‍🌈</div>
                  <p className="text-white text-2xl font-black uppercase leading-tight mb-4">
                    YOU'RE NOT ELIGIBLE FOR THIS
                  </p>
                  <p className="text-pink-400 text-xl font-bold uppercase">
                    COZ YOU'RE A GAY.
                  </p>
                  <p className="text-white/60 text-lg mt-3 font-semibold uppercase">
                    THANK YOU.
                  </p>
                  <p className="text-white/30 text-xs mt-10">tap anywhere to close</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              ref={earnModalRef}
              initial={{ y: 40, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 22, stiffness: 280 }}
              className="relative bg-card border border-border rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 border-b border-border">
                <button
                  onClick={() => setShowEarnModal(false)}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-foreground">Earn on Squawk</h2>
                    <p className="text-xs text-muted-foreground">Turn your content into cash 💸</p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-5 space-y-4 max-h-[55vh] overflow-y-auto">
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-1">
                  <p className="text-sm font-bold text-emerald-400 flex items-center gap-2">📸 Post Flows</p>
                  <p className="text-sm text-muted-foreground">Every post you share earns flow points based on engagement — likes, comments, and reshares all count. Top creators get a monthly cash payout from the community pool.</p>
                </div>
                <div className="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-4 space-y-1">
                  <p className="text-sm font-bold text-pink-400 flex items-center gap-2">🎬 Reels Bonus</p>
                  <p className="text-sm text-muted-foreground">Short-form video creators earn 3× the flow points of standard posts. Upload daily reels and watch your earnings multiply every week.</p>
                </div>
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4 space-y-1">
                  <p className="text-sm font-bold text-purple-400 flex items-center gap-2">⚡ Chirp Rewards</p>
                  <p className="text-sm text-muted-foreground">Hot chirps (trending short posts) earn tip drops from other community members. The more viral your chirp, the bigger the tip pool.</p>
                </div>
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-1">
                  <p className="text-sm font-bold text-amber-400 flex items-center gap-2">🏆 10K Squad NFT Holders</p>
                  <p className="text-sm text-muted-foreground">Holding a 10K Squad NFT unlocks the Founder tier — giving you a 2× earnings multiplier, exclusive drops, and early access to all future monetisation features.</p>
                </div>
                <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 space-y-1">
                  <p className="text-sm font-bold text-cyan-400 flex items-center gap-2">🤝 Referral Program</p>
                  <p className="text-sm text-muted-foreground">Invite friends using your unique link. Earn 10% of their flow points for 90 days — automatically, with zero extra effort required from you.</p>
                </div>

                {!earnNoClicked && (
                  <div className="pt-2">
                    <p className="text-center text-sm font-bold text-foreground mb-4">Ready to start earning? 🚀</p>
                    <div className="relative flex items-center justify-between gap-4 min-h-[52px]" onMouseMove={handleYesMouseMove}>
                      {/* No button */}
                      <button
                        onClick={() => { setEarnNoClicked(true); toast("BEST DECISION OF LIFE", { icon: "🏆", duration: 5000 }); }}
                        className="flex-1 py-3 rounded-full font-black text-sm border-2 border-red-500/60 text-red-400 hover:bg-red-500/10 transition-all"
                      >
                        No
                      </button>
                      {/* Yes button — flees from cursor */}
                      <button
                        ref={yesBtnRef}
                        onClick={() => setShowMobileYesMsg(true)}
                        className="flex-1 py-3 rounded-full font-black text-sm text-white transition-none select-none"
                        style={{
                          background: "linear-gradient(135deg,#10b981,#059669)",
                          transform: `translate(${yesOffset.x}px, ${yesOffset.y}px)`,
                          transition: "transform 0.15s ease-out",
                          boxShadow: "0 0 16px 4px rgba(16,185,129,0.35)",
                        }}
                        onMouseEnter={() => {
                          const flee = 160;
                          const angle = Math.random() * Math.PI * 2;
                          setYesOffset(prev => ({
                            x: prev.x + Math.cos(angle) * flee,
                            y: prev.y + Math.sin(angle) * flee,
                          }));
                        }}
                      >
                        Yes
                      </button>
                    </div>
                  </div>
                )}

                {earnNoClicked && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-6"
                  >
                    <div className="text-5xl mb-3">🏆</div>
                    <p className="text-2xl font-black text-foreground uppercase tracking-wide">BEST DECISION</p>
                    <p className="text-2xl font-black text-emerald-400 uppercase tracking-wide">OF LIFE</p>
                    <p className="text-muted-foreground text-sm mt-2">You're already winning. 😎</p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
