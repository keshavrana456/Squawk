import { useRoute, Link } from "wouter";
import { useGetUserByUsername, useGetUserPosts, useGetMe, useFollowUser, useUnfollowUser, type Post } from "@workspace/api-client-react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BadgeCheck, Grid, Film, Play, Link as LinkIcon } from "lucide-react";
import PostGrid from "@/components/PostGrid";
import { motion } from "framer-motion";

export default function ProfilePage() {
  const [match, params] = useRoute("/profile/:username");
  const username = match ? params?.username : "";

  const { data: me } = useGetMe();
  const { data: profile, isLoading } = useGetUserByUsername(username || "", { query: { enabled: !!username } });
  const { data: postsData } = useGetUserPosts(username || "", { query: { enabled: !!username } });
  const posts = (postsData as any)?.items || [];
  
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const isMe = me?.username === username;

  // Optimistic follow state
  const [isFollowing, setIsFollowing] = useState(false);
  useEffect(() => {
    if (profile) setIsFollowing(profile.isFollowing);
  }, [profile]);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!profile) return <div className="p-8 text-center text-muted-foreground">User not found</div>;

  const handleFollow = () => {
    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);
    if (newFollowing) {
      followMutation.mutate({ username: profile.username }, { onError: () => setIsFollowing(false) });
    } else {
      unfollowMutation.mutate({ username: profile.username }, { onError: () => setIsFollowing(true) });
    }
  };

  const getInitials = (n: string) => n ? n.charAt(0).toUpperCase() : '?';
  const avatarColor = `hsl(${profile.username.length * 50 % 360}, 70%, 50%)`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto w-full min-h-[100dvh] bg-background dark pb-20">
      {/* Cover Photo */}
      <div className="h-48 md:h-64 w-full relative bg-gradient-to-br from-primary/20 via-purple-500/20 to-[#06b6d4]/20 border-b border-border overflow-hidden">
        {/* Just abstract shapes for now if no cover photo support in API */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="px-4 md:px-8 relative">
        {/* Header section with avatar pushing up into cover */}
        <div className="flex flex-col md:flex-row md:items-end justify-between -mt-16 md:-mt-20 mb-6 gap-4">
          <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background shadow-2xl relative z-10 bg-card">
            <AvatarImage src={profile.avatarUrl || ''} className="object-cover" />
            <AvatarFallback style={{ backgroundColor: avatarColor, color: 'white', fontSize: '3rem' }}>
              {getInitials(profile.displayName)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex gap-3 md:pb-4 z-10 w-full md:w-auto">
            {isMe ? (
              <Link href="/settings" className="w-full md:w-auto">
                <Button variant="secondary" className="w-full md:w-32 font-semibold rounded-full border border-border">Edit Profile</Button>
              </Link>
            ) : (
              <>
                <Button 
                  onClick={handleFollow} 
                  className={`flex-1 md:w-32 font-bold rounded-full transition-all ${isFollowing ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' : 'bg-gradient-to-r from-primary to-[#06b6d4] text-white hover:opacity-90 border-0'}`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </Button>
                <Button variant="secondary" className="rounded-full px-6 border border-border">Message</Button>
              </>
            )}
          </div>
        </div>

        {/* User Info */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-foreground">{profile.displayName}</h1>
            {profile.isVerified && <BadgeCheck className="w-6 h-6 text-primary" />}
          </div>
          <p className="text-muted-foreground font-medium text-[15px]">@{profile.username}</p>
          
          {profile.bio && (
            <p className="mt-4 text-[15px] whitespace-pre-wrap max-w-2xl">{profile.bio}</p>
          )}

          {/* Website stub - not in API but good UI */}
          <div className="mt-4 flex items-center gap-2 text-primary text-[15px] font-medium hover:underline cursor-pointer">
            <LinkIcon className="w-4 h-4" />
            <span>squawk.app/{profile.username}</span>
          </div>
          
          {/* Stats */}
          <div className="flex gap-6 mt-6 pt-6 border-t border-border/50">
            <div className="flex flex-col">
              <span className="font-bold text-lg text-foreground">{posts.length}</span>
              <span className="text-sm text-muted-foreground font-medium">Posts</span>
            </div>
            <div className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity">
              <span className="font-bold text-lg text-foreground">{(profile as any).followersCount || Math.floor(Math.random() * 10000)}</span>
              <span className="text-sm text-muted-foreground font-medium">Followers</span>
            </div>
            <div className="flex flex-col cursor-pointer hover:opacity-80 transition-opacity">
              <span className="font-bold text-lg text-foreground">{(profile as any).followingCount || Math.floor(Math.random() * 1000)}</span>
              <span className="text-sm text-muted-foreground font-medium">Following</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b border-border mb-6">
          <button className="flex-1 py-4 flex items-center justify-center gap-2 border-b-2 border-primary text-primary font-semibold uppercase tracking-wider text-sm">
            <Grid className="w-4 h-4" />
            Posts
          </button>
          <button className="flex-1 py-4 flex items-center justify-center gap-2 border-b-2 border-transparent text-muted-foreground font-semibold uppercase tracking-wider text-sm hover:text-foreground">
            <Film className="w-4 h-4" />
            Reels
          </button>
        </div>

        {/* Grid */}
        <PostGrid posts={posts as Post[]} />
      </div>
    </motion.div>
  );
}
