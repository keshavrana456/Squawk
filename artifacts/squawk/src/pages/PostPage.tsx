import { useRoute, Link, useLocation } from "wouter";
import { useState, useCallback } from "react";
import {
  useGetPostComments,
  useCreateComment,
  useGetPost,
  useLikePost,
  useSavePost,
  useDeletePost,
  useGetMe,
  getGetFeedQueryKey,
  getGetUserPostsQueryKey,
  getListPostsQueryKey,
  type Comment,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ArrowLeft, BadgeCheck, CornerDownRight, X, Trash2, Copy } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { ShareSheet } from "@/components/ShareSheet";

type CommentLikeState = { isLiked: boolean; count: number };

export default function PostPage() {
  const [match, params] = useRoute("/post/:id");
  const [, navigate] = useLocation();
  const postId = match ? parseInt(params?.id || "0", 10) : 0;
  const queryClient = useQueryClient();

  const { data: post, isLoading: isLoadingPost } = useGetPost(postId, { query: { enabled: !!postId, staleTime: 30_000 } });
  const { data: commentsData, isLoading: isLoadingComments, refetch: refetchComments } = useGetPostComments(postId, { query: { enabled: !!postId } });
  const { data: me } = useGetMe();
  const comments: any[] = Array.isArray(commentsData) ? commentsData : [];

  const likeMutation = useLikePost();
  const saveMutation = useSavePost();
  const deleteMutation = useDeletePost();
  const createCommentMutation = useCreateComment();

  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ username: string; commentId: number } | null>(null);
  const [localLiked, setLocalLiked] = useState<boolean | null>(null);
  const [localLikes, setLocalLikes] = useState<number | null>(null);
  const [localSaved, setLocalSaved] = useState<boolean | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [commentLikeStates, setCommentLikeStates] = useState<Record<number, CommentLikeState>>({});

  const isLiked = localLiked ?? (post?.isLiked ?? false);
  const likesCount = localLikes ?? (post?.likesCount ?? 0);
  const isSaved = localSaved ?? (post?.isSaved ?? false);

  const getCommentLikeState = (c: any): CommentLikeState => {
    if (commentLikeStates[c.id] !== undefined) return commentLikeStates[c.id];
    return { isLiked: c.isLiked ?? false, count: c.likesCount ?? 0 };
  };

  const handleCommentLike = useCallback(async (commentId: number, current: CommentLikeState) => {
    const optimistic: CommentLikeState = {
      isLiked: !current.isLiked,
      count: current.isLiked ? Math.max(0, current.count - 1) : current.count + 1,
    };
    setCommentLikeStates(prev => ({ ...prev, [commentId]: optimistic }));
    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCommentLikeStates(prev => ({ ...prev, [commentId]: { isLiked: data.isLiked, count: data.likesCount } }));
      } else {
        setCommentLikeStates(prev => ({ ...prev, [commentId]: current }));
      }
    } catch {
      setCommentLikeStates(prev => ({ ...prev, [commentId]: current }));
    }
  }, []);

  if (isLoadingPost) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!post) return <div className="p-8 text-center text-muted-foreground">Post not found</div>;

  const isOwner = (me as any)?.id === (post.author as any)?.id ||
    (me as any)?.username === post.author?.username;

  const handleDelete = () => {
    deleteMutation.mutate({ id: postId }, {
      onSuccess: () => {
        // Invalidate all feed/post caches so the deleted post disappears everywhere
        queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetUserPostsQueryKey(post.author.username) });
        navigate("/home");
      },
    });
  };

  const handleLike = () => {
    if (likeMutation.isPending) return;
    const newLiked = !isLiked;
    setLocalLiked(newLiked);
    setLocalLikes(likesCount + (newLiked ? 1 : -1));
    likeMutation.mutate({ id: postId }, {
      onSuccess: (data) => {
        setLocalLiked(data.isLiked);
        setLocalLikes(data.likesCount);
      },
      onError: () => {
        setLocalLiked(!newLiked);
        setLocalLikes(likesCount + (!newLiked ? 1 : -1));
      },
    });
  };

  const handleSave = () => {
    const newSaved = !isSaved;
    setLocalSaved(newSaved);
    saveMutation.mutate({ id: postId }, {
      onError: () => setLocalSaved(!newSaved),
    });
  };

  const handleComment = () => {
    const content = replyTo
      ? `@${replyTo.username} ${commentText.trim()}`
      : commentText.trim();
    if (!content || postId <= 0) return;
    createCommentMutation.mutate(
      { id: postId, data: { content } },
      {
        onSuccess: () => {
          setCommentText("");
          setReplyTo(null);
          refetchComments();
        },
      }
    );
  };

  const getInitials = (n: string) => n ? n.charAt(0).toUpperCase() : "?";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto min-h-[100dvh] flex flex-col bg-background pt-4 md:py-8 md:px-4">

      {/* Mobile Back */}
      <div className="md:hidden flex items-center p-4 border-b border-border">
        <button onClick={() => window.history.back()} className="mr-4 text-foreground">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-bold text-lg">Post</h1>
      </div>

      <div className="flex flex-col md:flex-row bg-card border-x border-b md:border border-border md:rounded-xl overflow-hidden shadow-2xl md:max-h-[85vh]">

        {/* Left: Media */}
        <div className="w-full md:w-[60%] bg-black flex items-center justify-center min-h-[400px] max-h-[600px] md:max-h-full">
          {post.mediaType === "video" ? (
            <video
              src={post.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay controls loop playsInline
            />
          ) : (
            <img
              src={post.mediaUrl}
              alt={post.caption || "Post media"}
              className="w-full h-full object-contain"
            />
          )}
        </div>

        {/* Right: Details & Comments */}
        <div className="w-full md:w-[40%] flex flex-col bg-card h-full max-h-[500px] md:max-h-none">

          {/* Header */}
          <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
            <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3 group">
              <Avatar className="w-10 h-10 border border-border">
                <AvatarImage src={post.author.avatarUrl || ""} />
                <AvatarFallback className="bg-primary">{getInitials(post.author.displayName)}</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1 font-semibold group-hover:text-primary transition-colors">
                {post.author.username}
                {(post.author as any).isFounder && <BadgeCheck className="w-4 h-4 text-pink-500" title="Founder" />}
                {post.author.isVerified && !((post.author as any).isFounder) && <BadgeCheck className="w-4 h-4 text-primary" />}
              </div>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreHorizontal className="w-5 h-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => navigator.clipboard.writeText(window.location.href)}
                  className="gap-2 cursor-pointer"
                >
                  <Copy className="w-4 h-4" /> Copy link
                </DropdownMenuItem>
                {isOwner && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteConfirm(true)}
                      className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" /> Delete post
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Scrollable comments */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {/* Caption */}
            {post.caption && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={post.author.avatarUrl || ""} />
                  <AvatarFallback>{getInitials(post.author.displayName)}</AvatarFallback>
                </Avatar>
                <div className="text-[15px]">
                  <span className="font-semibold mr-2">{post.author.username}</span>
                  {post.caption.split(/(#\w+)/g).map((part, i) =>
                    /^#\w+/.test(part)
                      ? <Link key={i} href={`/explore/hashtags/${part.slice(1)}`} className="text-primary hover:underline font-medium">{part}</Link>
                      : part
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {post.hashtags.filter((tag: string) => !post.caption.includes(`#${tag}`))
                      .map((tag: string) => (
                        <Link key={tag} href={`/explore/hashtags/${tag}`} className="text-primary hover:underline text-sm font-medium">#{tag}</Link>
                      ))}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(post.createdAt))} ago
                  </div>
                </div>
              </div>
            )}

            {/* Comments */}
            {isLoadingComments ? (
              <div className="flex justify-center p-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">No comments yet. Be the first!</div>
            ) : (
              comments.map((comment: any) => {
                const cls = getCommentLikeState(comment);
                return (
                  <div key={comment.id} className="flex gap-3 items-start">
                    <Link href={`/profile/${comment.author?.username}`}>
                      <Avatar className="w-8 h-8 shrink-0 border border-border">
                        <AvatarImage src={comment.author?.avatarUrl || ""} />
                        <AvatarFallback>{getInitials(comment.author?.displayName || "?")}</AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="text-[15px] flex-1 min-w-0">
                      <span className="font-semibold mr-2">{comment.author?.username}</span>
                      {comment.content}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 font-medium">
                        <span>{formatDistanceToNow(new Date(comment.createdAt))}</span>
                        <button
                          className="font-semibold hover:text-foreground transition-colors"
                          onClick={() => {
                            setReplyTo({ username: comment.author?.username, commentId: comment.id });
                            setTimeout(() => document.getElementById("post-comment-input")?.focus(), 100);
                          }}
                        >
                          Reply
                        </button>
                        {cls.count > 0 && (
                          <span className={cls.isLiked ? "text-pink-500" : ""}>{cls.count}</span>
                        )}
                      </div>
                    </div>
                    <button
                      className="pt-1 px-2 h-fit transition-colors group"
                      onClick={() => handleCommentLike(comment.id, cls)}
                    >
                      <Heart
                        className={`w-3 h-3 transition-all ${
                          cls.isLiked
                            ? "fill-pink-500 text-pink-500 scale-110"
                            : "text-muted-foreground group-hover:text-pink-400"
                        }`}
                      />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Action Bar */}
          <div className="border-t border-border p-4 shrink-0 bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                  className={`transition-all hover:opacity-70 active:scale-90 ${isLiked ? "text-pink-500" : "text-foreground"}`}
                >
                  <Heart className={`w-7 h-7 ${isLiked ? "fill-pink-500" : ""}`} />
                </button>
                <button
                  className="text-foreground hover:opacity-70"
                  onClick={() => document.getElementById("post-comment-input")?.focus()}
                >
                  <MessageCircle className="w-7 h-7" />
                </button>
                <button
                  className="text-foreground hover:opacity-70"
                  onClick={() => setShareOpen(true)}
                >
                  <Send className="w-7 h-7" />
                </button>
              </div>
              <button
                onClick={handleSave}
                className={`transition-colors hover:opacity-70 ${isSaved ? "text-primary" : "text-foreground"}`}
              >
                <Bookmark className={`w-7 h-7 ${isSaved ? "fill-primary" : ""}`} />
              </button>
            </div>
            <div className="font-semibold text-sm mb-1">{likesCount.toLocaleString()} likes</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide mt-2 font-medium">
              {formatDistanceToNow(new Date(post.createdAt))} ago
            </div>
          </div>

          {/* Comment Input */}
          <div className="p-3 border-t border-border flex flex-col gap-2 shrink-0 bg-card">
            {replyTo && (
              <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 rounded-full px-3 py-1.5 w-fit">
                <CornerDownRight className="w-3 h-3" />
                <span>Replying to @{replyTo.username}</span>
                <button onClick={() => setReplyTo(null)} className="ml-1.5 hover:opacity-70">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8 shrink-0 border border-border">
                <AvatarImage src={(me as any)?.avatarUrl || ""} />
                <AvatarFallback className="bg-primary/20">{getInitials((me as any)?.displayName || "U")}</AvatarFallback>
              </Avatar>
              <Input
                id="post-comment-input"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleComment()}
                placeholder={replyTo ? `Reply to @${replyTo.username}…` : "Add a comment..."}
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto py-2 text-[15px]"
              />
              <Button
                variant="ghost"
                className="text-primary font-semibold hover:bg-transparent hover:text-primary/80 px-2 shrink-0"
                onClick={handleComment}
                disabled={!commentText.trim() || createCommentMutation.isPending}
              >
                {createCommentMutation.isPending ? "…" : "Post"}
              </Button>
            </div>
          </div>

        </div>
      </div>

      <ShareSheet open={shareOpen} onOpenChange={setShareOpen} postId={post.id} caption={post.caption} />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the post. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
