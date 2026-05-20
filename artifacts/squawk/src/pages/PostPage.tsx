import { useRoute, Link, useLocation } from "wouter";
import { useState } from "react";
import {
  useGetPostComments,
  useCreateComment,
  useGetPost,
  useLikePost,
  useSavePost,
  type Comment,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, ArrowLeft, BadgeCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

export default function PostPage() {
  const [match, params] = useRoute("/post/:id");
  const postId = match ? parseInt(params?.id || "0", 10) : 0;

  const { data: post, isLoading: isLoadingPost } = useGetPost(postId, { query: { enabled: !!postId } });
  const { data: commentsData, isLoading: isLoadingComments, refetch: refetchComments } = useGetPostComments(postId, { query: { enabled: !!postId } });
  const comments = (commentsData as any) || [];

  const likeMutation = useLikePost();
  const saveMutation = useSavePost();
  const createCommentMutation = useCreateComment();

  const [commentText, setCommentText] = useState("");
  const [localLiked, setLocalLiked] = useState<boolean | null>(null);
  const [localLikes, setLocalLikes] = useState<number | null>(null);
  const [localSaved, setLocalSaved] = useState<boolean | null>(null);

  const isLiked = localLiked ?? (post?.isLiked ?? false);
  const likesCount = localLikes ?? (post?.likesCount ?? 0);
  const isSaved = localSaved ?? (post?.isSaved ?? false);

  if (isLoadingPost) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!post) return <div className="p-8 text-center text-muted-foreground">Post not found</div>;

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
    if (!commentText.trim()) return;
    createCommentMutation.mutate({
      postId,
      data: { content: commentText.trim() },
    }, {
      onSuccess: () => {
        setCommentText("");
        refetchComments();
      },
    });
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
            <Button variant="ghost" size="icon"><MoreHorizontal className="w-5 h-5" /></Button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
            {post.caption && (
              <div className="flex gap-3">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={post.author.avatarUrl || ""} />
                  <AvatarFallback>{getInitials(post.author.displayName)}</AvatarFallback>
                </Avatar>
                <div className="text-[15px]">
                  <span className="font-semibold mr-2">{post.author.username}</span>
                  {post.caption}
                  <div className="mt-1 flex flex-wrap gap-1 text-primary">
                    {post.hashtags.map((tag: string) => <span key={tag}>#{tag}</span>)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    {formatDistanceToNow(new Date(post.createdAt))} ago
                  </div>
                </div>
              </div>
            )}

            {isLoadingComments ? (
              <div className="flex justify-center p-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 text-sm">No comments yet. Be the first!</div>
            ) : (
              comments.map((comment: Comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Link href={`/profile/${comment.author.username}`}>
                    <Avatar className="w-8 h-8 shrink-0 border border-border">
                      <AvatarImage src={comment.author.avatarUrl || ""} />
                      <AvatarFallback>{getInitials(comment.author.displayName)}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="text-[15px] flex-1">
                    <span className="font-semibold mr-2">{comment.author.username}</span>
                    {comment.content}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1 font-medium">
                      <span>{formatDistanceToNow(new Date(comment.createdAt))}</span>
                      <button className="font-semibold hover:text-foreground">Reply</button>
                    </div>
                  </div>
                  <button className="pt-1 px-2 text-muted-foreground hover:text-primary transition-colors h-fit">
                    <Heart className="w-3 h-3" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Action Bar */}
          <div className="border-t border-border p-4 shrink-0 bg-card">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  disabled={likeMutation.isPending}
                  className={`transition-all hover:opacity-70 active:scale-90 ${isLiked ? "text-primary" : "text-foreground"}`}
                >
                  <Heart className={`w-7 h-7 ${isLiked ? "fill-primary" : ""}`} />
                </button>
                <button className="text-foreground hover:opacity-70">
                  <MessageCircle className="w-7 h-7" />
                </button>
                <button className="text-foreground hover:opacity-70">
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
          <div className="p-4 border-t border-border flex items-center gap-3 shrink-0 bg-card">
            <Avatar className="w-8 h-8 shrink-0 border border-border">
              <AvatarFallback className="bg-primary/20">U</AvatarFallback>
            </Avatar>
            <Input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleComment()}
              placeholder="Add a comment..."
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-auto py-2 text-[15px]"
            />
            <Button
              variant="ghost"
              className="text-primary font-semibold hover:bg-transparent hover:text-primary/80 px-2"
              onClick={handleComment}
              disabled={!commentText.trim() || createCommentMutation.isPending}
            >
              {createCommentMutation.isPending ? "..." : "Post"}
            </Button>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
