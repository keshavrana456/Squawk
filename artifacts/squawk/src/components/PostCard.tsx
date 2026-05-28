import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  Heart, MessageCircle, Send, Bookmark, MoreHorizontal,
  BadgeCheck, Volume2, VolumeX, PlaySquare, Trash2,
  Link2, Flag, EyeOff, Copy,
} from "lucide-react";
import { ShareSheet } from "@/components/ShareSheet";
import CommentsSheet from "@/components/CommentsSheet";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  useLikePost,
  useSavePost,
  useDeletePost,
  useGetMe,
  getGetFeedQueryKey,
  getGetUserPostsQueryKey,
  getListPostsQueryKey,
  getGetPostQueryKey,
  type Post,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onSave?: () => void;
  onComment?: () => void;
}

export default function PostCard({ post, onLike, onSave, onComment }: PostCardProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const likeMutation = useLikePost();
  const saveMutation = useSavePost();
  const deleteMutation = useDeletePost();
  const { data: me } = useGetMe();

  const [showHeart, setShowHeart] = useState(false);
  const [isLiked, setIsLiked] = useState(!!post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? 0);
  const [isSaved, setIsSaved] = useState(!!post.isSaved);
  const [isMuted, setIsMuted] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const [videoAspectRatio, setVideoAspectRatio] = useState<string>("16/9");

  // Auto-pause video when scrolled out of view
  useEffect(() => {
    if (post.mediaType !== "video" || !videoRef.current || !mediaContainerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const v = videoRef.current;
        if (!v) return;
        if (entry.isIntersecting) {
          v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(mediaContainerRef.current);
    return () => observer.disconnect();
  }, [post.mediaType]);

  // Sync from server whenever the post prop updates (e.g. React Query refetch)
  // Skip sync while a like mutation is in-flight to avoid reverting optimistic updates
  useEffect(() => {
    if (likeMutation.isPending) return;
    setIsLiked(!!post.isLiked);
    setLikesCount(post.likesCount ?? 0);
    setIsSaved(!!post.isSaved);
  }, [post.isLiked, post.likesCount, post.isSaved, likeMutation.isPending]);

  const isOwner = me && (me as any).id === post.author.id;
  const isFounderAdmin = me && ((me as any).isFounder || (me as any).id === 1);

  const handleAdminDelete = () => {
    fetch(`/api/admin/posts/${post.id}`, { method: "DELETE", credentials: "include" }).then(() => {
      queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
      queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetUserPostsQueryKey(post.author.username) });
    });
    setShowDeleteConfirm(false);
  };
  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : "?";
  const avatarColor = `hsl(${post.author.username.length * 50 % 360}, 70%, 50%)`;

  // Patch ALL query caches that may contain this post — ensures like state is consistent everywhere
  const patchCache = (isLikedVal: boolean, likesCountVal: number) => {
    const patchPosts = (posts: any[]) =>
      posts.map((p: any) =>
        p.id === post.id ? { ...p, isLiked: isLikedVal, likesCount: likesCountVal } : p
      );

    // Patch feed queries (any key that contains "feed")
    queryClient.setQueriesData({ queryKey: getGetFeedQueryKey() }, (old: any) =>
      old?.posts ? { ...old, posts: patchPosts(old.posts) } : old
    );
    // Patch user posts query
    queryClient.setQueriesData({ queryKey: getGetUserPostsQueryKey(post.author.username) }, (old: any) =>
      Array.isArray(old) ? patchPosts(old) :
      old?.posts ? { ...old, posts: patchPosts(old.posts) } : old
    );
    // Patch generic list
    queryClient.setQueriesData({ queryKey: getListPostsQueryKey() }, (old: any) =>
      old?.posts ? { ...old, posts: patchPosts(old.posts) } : old
    );
    // Patch individual post cache (PostPage uses this)
    queryClient.setQueryData(getGetPostQueryKey(post.id), (old: any) =>
      old ? { ...old, isLiked: isLikedVal, likesCount: likesCountVal } : old
    );
    // Also patch any query that is an array and contains this post id
    queryClient.setQueriesData({ predicate: (query) => {
      const data = queryClient.getQueryData(query.queryKey);
      if (Array.isArray(data)) return (data as any[]).some((p: any) => p?.id === post.id);
      if ((data as any)?.posts) return (data as any).posts.some((p: any) => p?.id === post.id);
      return false;
    }}, (old: any) => {
      if (Array.isArray(old)) return patchPosts(old);
      if (old?.posts) return { ...old, posts: patchPosts(old.posts) };
      return old;
    });
  };

  const handleLike = () => {
    if (likeMutation.isPending) return;
    const newLiked = !isLiked;
    const newCount = likesCount + (newLiked ? 1 : -1);
    setIsLiked(newLiked);
    setLikesCount(newCount);
    patchCache(newLiked, newCount);

    likeMutation.mutate({ id: post.id }, {
      onSuccess: (data: any) => {
        setIsLiked(data.isLiked);
        setLikesCount(data.likesCount);
        patchCache(data.isLiked, data.likesCount);
        queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUserPostsQueryKey(post.author.username) });
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
      },
      onError: () => {
        setIsLiked(!newLiked);
        setLikesCount(likesCount);
        patchCache(!newLiked, likesCount);
      },
    });

    if (onLike) onLike();
  };

  const handleSave = () => {
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    saveMutation.mutate({ id: post.id }, {
      onError: () => setIsSaved(!newSaved),
    });
    if (onSave) onSave();
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: post.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUserPostsQueryKey(post.author.username) });
      },
    });
    setShowDeleteConfirm(false);
  };

  const handleDoubleTap = () => {
    if (!isLiked) handleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted((m) => {
      if (videoRef.current) videoRef.current.muted = !m;
      return !m;
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`).catch(() => {});
  };

  const renderTextWithMentions = (text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (/^@\w+$/.test(part)) {
        return (
          <Link key={i} href={`/profile/${part.slice(1)}`} className="text-primary font-semibold hover:underline">
            {part}
          </Link>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const renderCaption = (text: string | null, hashtags: string[]) => {
    if (!text) return null;
    return (
      <div className="text-sm mt-2">
        <span className="font-semibold mr-2">{post.author.username}</span>
        {renderTextWithMentions(text)}
        {hashtags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {hashtags.map((tag) => (
              <Link key={tag} href={`/explore/hashtags/${tag}`} className="text-primary hover:underline">
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-card border-b border-border md:border md:rounded-2xl md:mb-6 overflow-hidden w-full" data-testid={`post-card-${post.id}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3 group" data-testid={`link-author-${post.author.username}`}>
            <Avatar className="w-10 h-10 border border-border group-hover:border-primary transition-colors">
              <AvatarImage src={post.author.avatarUrl || ""} />
              <AvatarFallback style={{ backgroundColor: avatarColor, color: "white" }}>
                {getInitials(post.author.displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{post.author.username}</span>
                {(post.author as any).isFounder && <BadgeCheck className="w-4 h-4 text-pink-500" />}
                {post.author.isVerified && !((post.author as any).isFounder) && <BadgeCheck className="w-4 h-4 text-primary" />}
              </div>
              <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt))} ago</span>
            </div>
          </Link>

          {/* Three-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isOwner ? (
                <>
                  <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive focus:text-destructive cursor-pointer">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete post
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
                    <Copy className="w-4 h-4 mr-2" />
                    Copy link
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  {isFounderAdmin && (
                    <>
                      <DropdownMenuItem onClick={() => setShowDeleteConfirm(true)} className="text-destructive focus:text-destructive cursor-pointer">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete post
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
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
        </div>

        {/* Media */}
        <div
          ref={mediaContainerRef}
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: post.mediaType === "video" ? videoAspectRatio : undefined,
            maxHeight: post.mediaType === "video" ? "80vh" : "600px",
            backgroundColor: post.mediaType === "video" ? "#000" : undefined,
          }}
          onDoubleClick={handleDoubleTap}
          data-testid="post-media"
        >
          {post.mediaType === "video" ? (
            <div
              className="absolute inset-0 cursor-pointer"
              onClick={() => setLocation(`/reels?id=${post.id}`)}
            >
              <video
                ref={videoRef}
                src={post.mediaUrl}
                className="w-full h-full object-contain"
                autoPlay
                muted={isMuted}
                loop
                playsInline
                onLoadedMetadata={(e) => {
                  const v = e.currentTarget;
                  if (v.videoWidth && v.videoHeight) {
                    setVideoAspectRatio(`${v.videoWidth}/${v.videoHeight}`);
                  }
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/40 pointer-events-none" />
              <button
                onClick={handleMuteToggle}
                className="absolute bottom-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/55 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1.5 rounded-full pointer-events-none z-10">
                <PlaySquare className="w-3.5 h-3.5" />
                Tap to open in Flow
              </div>
            </div>
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.caption || "Post media"}
              className="w-full object-cover cursor-pointer"
              style={{ maxHeight: "600px", objectFit: "cover", display: "block" }}
              loading="lazy"
            />
          )}

          <AnimatePresence>
            {showHeart && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
              >
                <Heart className="w-32 h-32 text-primary fill-primary drop-shadow-[0_0_20px_rgba(124,58,237,0.5)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`transition-colors hover:opacity-70 ${isLiked ? "text-primary" : "text-foreground"}`}
                data-testid="button-like"
              >
                <Heart className={`w-7 h-7 ${isLiked ? "fill-primary" : ""}`} />
              </button>
              <button
                onClick={() => {
                  if (onComment) onComment();
                  else setShowComments(true);
                }}
                className="text-foreground transition-colors hover:opacity-70"
                data-testid="button-comment"
              >
                <MessageCircle className="w-7 h-7" />
              </button>
              <button
                onClick={() => setShareOpen(true)}
                className="text-foreground transition-colors hover:opacity-70"
                data-testid="button-share"
              >
                <Send className="w-7 h-7" />
              </button>
            </div>
            <button
              onClick={handleSave}
              className={`transition-colors hover:opacity-70 ${isSaved ? "text-primary" : "text-foreground"}`}
              data-testid="button-save"
            >
              <Bookmark className={`w-7 h-7 ${isSaved ? "fill-primary" : ""}`} />
            </button>
          </div>

          <div className="font-semibold text-sm mb-1">{likesCount.toLocaleString()} likes</div>

          {/* Caption in its own block, separated from comments */}
          {renderCaption(post.caption, post.hashtags)}

          {post.commentsCount > 0 && (
            <button
              onClick={() => setShowComments(true)}
              className="text-sm text-muted-foreground mt-2 inline-block hover:underline"
              data-testid="link-comments"
            >
              View all {post.commentsCount} comments
            </button>
          )}
        </div>
      </div>

      {/* Slide-up comments modal */}
      <CommentsSheet
        postId={post.id}
        commentsCount={post.commentsCount}
        isOpen={showComments}
        onClose={() => setShowComments(false)}
      />

      {/* Share sheet */}
      <ShareSheet open={shareOpen} onOpenChange={setShareOpen} postId={post.id} caption={post.caption} />

      {/* Delete confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your post and all its likes and comments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={isOwner ? handleDelete : handleAdminDelete}
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
