import { useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { useGetFeed, useGetFeedStats, useGetSuggestedUsers, useFollowUser, type Post, type UserSummary } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import StoriesRow from "@/components/StoriesRow";
import PostCard from "@/components/PostCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Users, Heart, Image as ImageIcon, ArrowUp, BadgeCheck, Eye } from "lucide-react";

const POLL_INTERVAL = 30 * 1000;

function SuggestedUserCard({ user }: { user: UserSummary }) {
  const [followed, setFollowed] = useState(user.isFollowing);
  const followMutation = useFollowUser();
  const avatarColor = `hsl(${user.username.length * 50 % 360}, 70%, 50%)`;

  const handleFollow = () => {
    if (followed) return;
    setFollowed(true);
    followMutation.mutate({ username: user.username }, { onError: () => setFollowed(false) });
  };

  return (
    <div className="flex items-center gap-3">
      <Link href={`/profile/${user.username}`}>
        <Avatar className="w-9 h-9 shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage src={user.avatarUrl || ''} className="object-cover" />
          <AvatarFallback style={{ backgroundColor: avatarColor, color: 'white', fontSize: '0.8rem' }}>
            {user.displayName?.charAt(0)?.toUpperCase() ?? '?'}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 min-w-0">
        <Link href={`/profile/${user.username}`}>
          <div className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity">
            <p className="text-sm font-semibold text-foreground truncate">{user.displayName}</p>
            {user.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
        </Link>
      </div>
      <Button
        size="sm"
        variant={followed ? "secondary" : "default"}
        className={`shrink-0 h-7 px-3 rounded-full text-xs font-semibold ${followed ? '' : 'bg-gradient-to-r from-primary to-[#c084fc] border-0 text-white hover:opacity-90'}`}
        onClick={handleFollow}
        disabled={followed}
      >
        {followed ? 'Following' : 'Follow'}
      </Button>
    </div>
  );
}

export default function HomePage() {
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const latestPostIdRef = useRef<number | null>(null);

  const { data: feedData, isLoading, refetch } = useGetFeed(undefined, {
    query: {
      queryKey: ["feed"],
      refetchInterval: POLL_INTERVAL,
      refetchOnWindowFocus: true,
      select: (data) => {
        const firstId = data?.posts?.[0]?.id ?? null;
        if (latestPostIdRef.current === null) {
          latestPostIdRef.current = firstId;
        } else if (firstId !== null && firstId > latestPostIdRef.current) {
          setNewPostsAvailable(true);
        }
        return data;
      },
    },
  });

  const { data: stats } = useGetFeedStats({
    query: {
      refetchInterval: POLL_INTERVAL,
      refetchOnWindowFocus: true,
    },
  });

  const { data: suggestedUsers } = useGetSuggestedUsers({ limit: 5 });

  const posts = feedData?.posts || [];

  const handleRefreshFeed = useCallback(() => {
    latestPostIdRef.current = null;
    setNewPostsAvailable(false);
    refetch();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [refetch]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center max-w-6xl mx-auto w-full dark">
      <div className="flex-1 w-full max-w-2xl py-4 md:py-8 space-y-6">

        <AnimatePresence>
          {newPostsAvailable && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-50"
            >
              <button
                onClick={handleRefreshFeed}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-full shadow-lg font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <ArrowUp className="w-4 h-4" />
                New posts available
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <StoriesRow />

        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-6 px-4 md:px-0">
              {[1, 2].map(i => (
                <div key={i} className="bg-card border-y md:border rounded-none md:rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="w-full aspect-[4/5] rounded-xl" />
                </div>
              ))}
            </div>
          ) : posts.length > 0 ? (
            posts.map((post: Post) => <PostCard key={post.id} post={post} />)
          ) : (
            <div className="text-center p-12 bg-card rounded-2xl border border-border mx-4 md:mx-0">
              <h3 className="text-xl font-bold mb-2">Welcome to Squawk</h3>
              <p className="text-muted-foreground mb-6">Follow some creators to fill your feed</p>
              <Link href="/explore">
                <span className="bg-gradient-to-r from-primary to-[#c084fc] text-white px-6 py-2 rounded-full font-medium cursor-pointer">Find creators</span>
              </Link>
            </div>
          )}

          <div className="h-10 pb-8" />
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="hidden xl:block w-[320px] shrink-0 py-8 px-6 space-y-4">

        {/* Network Stats */}
        <div className="sticky top-24 space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-base mb-4">Network Stats</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><Users className="w-4 h-4" /> Followers</div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={stats?.totalFollowers}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-bold text-primary tabular-nums"
                  >
                    {stats?.totalFollowers?.toLocaleString() ?? '—'}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><ImageIcon className="w-4 h-4" /> Posts</div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={stats?.totalPosts}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-bold text-primary tabular-nums"
                  >
                    {stats?.totalPosts?.toLocaleString() ?? '—'}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><Heart className="w-4 h-4" /> Likes</div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={stats?.totalLikes}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-bold text-primary tabular-nums"
                  >
                    {stats?.totalLikes?.toLocaleString() ?? '—'}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-sm"><Eye className="w-4 h-4" /> Views</div>
                <AnimatePresence mode="wait">
                  <motion.span
                    key={stats?.totalViews}
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-bold text-primary tabular-nums"
                  >
                    {stats?.totalViews?.toLocaleString() ?? '—'}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Suggested Users */}
          {suggestedUsers && suggestedUsers.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base">Suggested for you</h3>
                <Link href="/explore">
                  <span className="text-xs text-primary hover:underline cursor-pointer font-medium">See all</span>
                </Link>
              </div>
              <div className="space-y-4">
                {suggestedUsers.map((user: UserSummary) => (
                  <SuggestedUserCard key={user.id} user={user} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
