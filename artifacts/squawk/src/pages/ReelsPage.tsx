import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPosts, useLikePost, useSavePost, useDeletePost, useGetMe,
  getListPostsQueryKey, getGetFeedQueryKey, getGetUserPostsQueryKey,
  type Post,
} from "@workspace/api-client-react";
import {
  Heart, Bookmark, Volume2, VolumeX, MoreHorizontal, PlusCircle,
  Trash2, Copy, Flag, EyeOff, Share2,
} from "lucide-react";
import { ShareSheet } from "@/components/ShareSheet";
import CommentsSheet from "@/components/CommentsSheet";
import StoryUploadModal from "@/components/StoryUploadModal";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MessageCircle } from "lucide-react";

export default function ReelsPage() {
  const { data: postsData, isLoading } = useListPosts();
  const rawPosts = (postsData as any)?.posts || [];
  const reels = rawPosts.filter((p: Post) => p.mediaType === "video");
  const [muted, setMuted] = useState(true);

  // Parse startId from URL query param (?id=POST_ID)
  const startId = parseInt(new URLSearchParams(window.location.search).get("id") || "0", 10);

  // Scroll to the target reel once data loads
  useEffect(() => {
    if (!startId || !reels.length) return;
    const idx = reels.findIndex((r: any) => r.id === startId);
    if (idx < 0) return;
    // Short delay to allow DOM to paint
    setTimeout(() => {
      const el = document.querySelector(`[data-reel-id="${startId}"]`);
      if (el) el.scrollIntoView({ behavior: "instant", block: "start" });
    }, 80);
  }, [startId, reels.length]);

  if (isLoading) return (
    <div className="flex items-center justify-center h-full min-h-screen bg-black">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!reels.length) return (
    <div className="flex flex-col items-center justify-center h-full min-h-screen bg-black gap-6 p-8 text-center">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-white/20">
        <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
        <line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <line x1="2" y1="7" x2="7" y2="7" /><line x1="2" y1="17" x2="7" y2="17" />
        <line x1="17" y1="17" x2="22" y2="17" /><line x1="17" y1="7" x2="22" y2="7" />
      </svg>
      <div>
        <p className="text-lg font-bold text-white/60 mb-1">No Flow videos yet</p>
        <p className="text-sm text-white/30 max-w-xs">Be the first to post a video</p>
      </div>
      <Link href="/upload">
        <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-[#c084fc] text-white font-semibold text-sm hover:opacity-90 transition-opacity">
          <PlusCircle className="w-5 h-5" />
          Upload a Video
        </button>
      </Link>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[100dvh] w-full bg-black snap-y snap-mandatory overflow-y-auto no-scrollbar relative">
      {reels.map((post: any) => (
        <Reel key={post.id} post={post} muted={muted} setMuted={setMuted} />
      ))}

      {/* Floating upload button */}
      <Link href="/upload">
        <button
          className="fixed bottom-24 right-4 md:bottom-6 md:right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-primary to-[#c084fc] text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-opacity"
          title="Upload a video"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="hidden md:inline">Upload</span>
        </button>
      </Link>
    </motion.div>
  );
}

function Reel({ post, muted, setMuted }: { post: any; muted: boolean; setMuted: (m: boolean) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const likeMutation = useLikePost();
  const saveMutation = useSavePost();
  const deleteMutation = useDeletePost();
  const { data: me } = useGetMe();

  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const [showComments, setShowComments] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const isOwner = me && (me as any).id === post.author?.id;

  // Sync like state if cache updates externally (e.g. liked from feed)
  useEffect(() => {
    setIsLiked(post.isLiked);
    setLikesCount(post.likesCount);
  }, [post.isLiked, post.likesCount]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
        } else {
          videoRef.current?.pause();
          setShowComments(false);
        }
      },
      { threshold: 0.5 }
    );
    const container = containerRef.current;
    if (container) observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const patchCache = (isLikedVal: boolean, likesCountVal: number) => {
    const patch = (posts: any[]) =>
      posts.map((p: any) => p.id === post.id ? { ...p, isLiked: isLikedVal, likesCount: likesCountVal } : p);
    queryClient.setQueriesData({ queryKey: getListPostsQueryKey() }, (old: any) =>
      old?.items ? { ...old, items: patch(old.items) } : old
    );
    queryClient.setQueriesData({ queryKey: getGetFeedQueryKey() }, (old: any) =>
      old?.posts ? { ...old, posts: patch(old.posts) } : old
    );
    queryClient.setQueriesData({ queryKey: ["feed"] }, (old: any) =>
      old?.posts ? { ...old, posts: patch(old.posts) } : old
    );
  };

  const handleLike = () => {
    if (post.id < 0) { setIsLiked(!isLiked); setLikesCount((p: number) => isLiked ? p - 1 : p + 1); return; }
    const newLiked = !isLiked;
    const newCount = likesCount + (newLiked ? 1 : -1);
    setIsLiked(newLiked);
    setLikesCount(newCount);
    patchCache(newLiked, newCount);
    likeMutation.mutate({ id: post.id }, {
      onSuccess: (data) => {
        setIsLiked(data.isLiked);
        setLikesCount(data.likesCount);
        patchCache(data.isLiked, data.likesCount);
      },
      onError: () => {
        setIsLiked(!newLiked);
        setLikesCount(likesCount);
        patchCache(!newLiked, likesCount);
      },
    });
  };

  const handleDoubleTap = () => {
    if (!isLiked) handleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 900);
  };

  const handleSave = () => {
    if (post.id < 0) { setIsSaved(!isSaved); return; }
    setIsSaved(!isSaved);
    saveMutation.mutate({ id: post.id }, {
      onError: () => setIsSaved(isSaved),
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: post.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["feed"] });
      },
    });
    setShowDeleteConfirm(false);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`).catch(() => {});
  };

  const getInitials = (n: string) => n ? n.charAt(0).toUpperCase() : "?";
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <>
      <div
        ref={containerRef}
        data-reel-id={post.id}
        className="h-[100dvh] w-full snap-start relative flex items-center justify-center bg-black"
        onDoubleClick={handleDoubleTap}
      >
        {/* 9:16 constrained frame */}
        <div className="relative h-full w-full md:h-full md:aspect-[9/16] md:max-w-[calc(100vh*9/16)] overflow-hidden">
          {post.mediaType === "video" ? (
            <video
              ref={videoRef}
              src={post.mediaUrl}
              className="w-full h-full object-contain"
              loop
              muted={muted}
              playsInline
              preload="auto"
              onClick={() => videoRef.current?.paused ? videoRef.current.play().catch(() => {}) : videoRef.current?.pause()}
            />
          ) : (
            <img src={post.mediaUrl} className="w-full h-full object-cover" alt="" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

          {/* Double-tap heart */}
          <AnimatePresence>
            {showHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
              >
                <Heart className="w-28 h-28 text-primary fill-primary drop-shadow-[0_0_24px_rgba(124,58,237,0.6)]" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Controls overlay */}
          <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 pb-20 md:pb-6">
            {/* Top row: mute + three-dot menu */}
            <div className="flex justify-between items-start pointer-events-auto mt-4 md:mt-0">
              <div />
              <div className="flex items-center gap-2">
                {/* Three-dot menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-3 btn-water rounded-full text-white">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {isOwner ? (
                      <>
                        <DropdownMenuItem
                          onClick={() => setShowDeleteConfirm(true)}
                          className="text-destructive focus:text-destructive cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete video
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                          <Copy className="w-4 h-4 mr-2" />
                          Copy link
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem className="cursor-pointer">
                          <Flag className="w-4 h-4 mr-2" />
                          Report
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                          <EyeOff className="w-4 h-4 mr-2" />
                          Not interested
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                          <Copy className="w-4 h-4 mr-2" />
                          Copy link
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <button onClick={() => setMuted(!muted)} className="p-3 btn-water rounded-full text-white">
                  {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Bottom: author info + action buttons */}
            <div className="flex items-end justify-between pointer-events-auto">
              {/* Author & caption */}
              <div className="flex-1 pr-4 text-white drop-shadow-lg">
                <Link href={post.id > 0 ? `/profile/${post.author.username}` : "#"} className="flex items-center gap-3 mb-4 w-fit">
                  <Avatar className="w-12 h-12 border-2 border-white/30">
                    <AvatarImage src={post.author.avatarUrl || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                      {getInitials(post.author.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-bold text-base">{post.author.username}</div>
                    {post.author.isVerified && !post.author.isFounder && <span className="text-[11px] text-primary font-semibold">✓ Verified</span>}
                    {post.author.isFounder && <span className="text-[11px] text-pink-400 font-semibold">✓ Founder</span>}
                  </div>
                </Link>
                <p className="text-[15px] line-clamp-2 leading-snug">{post.caption}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {post.hashtags?.map((tag: string) => (
                    <span key={tag} className="text-sm text-primary font-semibold">#{tag}</span>
                  ))}
                </div>
              </div>

              {/* Side actions */}
              <div className="flex flex-col items-center gap-5 pb-4">
                <button onClick={handleLike} className="flex flex-col items-center gap-1">
                  <div className="p-3.5 btn-water rounded-full">
                    <Heart className={`w-7 h-7 transition-all ${isLiked ? "fill-primary text-primary scale-110" : "text-white"}`} />
                  </div>
                  <span className="text-white text-xs font-bold">{fmt(likesCount)}</span>
                </button>

                <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
                  <div className="p-3.5 btn-water rounded-full">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-white text-xs font-bold">{fmt(post.commentsCount)}</span>
                </button>

                <button onClick={handleSave} className="flex flex-col items-center gap-1">
                  <div className="p-3.5 btn-water rounded-full">
                    <Bookmark className={`w-7 h-7 ${isSaved ? "fill-white text-white" : "text-white"}`} />
                  </div>
                </button>

                <button onClick={() => setShowShare(true)} className="flex flex-col items-center gap-1">
                  <div className="p-3.5 btn-water rounded-full">
                    <Share2 className="w-7 h-7 text-white" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Slide-up comments sheet */}
      <CommentsSheet
        postId={post.id}
        commentsCount={post.commentsCount}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />

      {/* Share sheet */}
      <ShareSheet
        open={showShare}
        onOpenChange={setShowShare}
        postId={post.id}
        caption={post.caption}
      />

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this video?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove your video and all its interactions. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
