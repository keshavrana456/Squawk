import { useState, useRef, useCallback } from "react";
import { Link } from "wouter";
import { useGetFeed, useGetFeedStats, type Post } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import StoriesRow from "@/components/StoriesRow";
import PostCard from "@/components/PostCard";
import { Users, Heart, Image as ImageIcon, ArrowUp } from "lucide-react";

const POLL_INTERVAL = 30 * 1000;

export default function HomePage() {
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);
  const latestPostIdRef = useRef<number | null>(null);

  const { data: feedData, isLoading, refetch } = useGetFeed(undefined, {
    query: {
      queryKey: ["feed"],
      refetchInterval: POLL_INTERVAL,
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

  const { data: stats } = useGetFeedStats();

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

      <div className="hidden xl:block w-[320px] shrink-0 py-8 px-6">
        <div className="sticky top-24 bg-card border border-border rounded-2xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">Network Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground"><Users className="w-4 h-4" /> Followers</div>
              <span className="font-semibold text-primary">{stats?.totalFollowers || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground"><ImageIcon className="w-4 h-4" /> Posts</div>
              <span className="font-semibold text-primary">{stats?.totalPosts || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground"><Heart className="w-4 h-4" /> Likes</div>
              <span className="font-semibold text-primary">{stats?.totalLikes || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
