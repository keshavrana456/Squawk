import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Heart, MessageCircle, CornerDownRight } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetPostComments } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";
import { Link } from "wouter";

interface CommentsSheetProps {
  postId: number;
  commentsCount: number;
  isOpen: boolean;
  onClose: () => void;
}

type LikeState = { isLiked: boolean; count: number };

function renderCommentText(content: string) {
  const parts = content.split(/(@\w+)/g);
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
}

export default function CommentsSheet({ postId, commentsCount, isOpen, onClose }: CommentsSheetProps) {
  const { data: commentsData, isLoading, refetch } = useGetPostComments(postId, {
    query: { enabled: isOpen && postId > 0 },
  });
  const rawComments: any[] = Array.isArray(commentsData) ? commentsData : [];

  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<{ username: string; commentId: number } | null>(null);
  const [likeStates, setLikeStates] = useState<Record<number, LikeState>>({});
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setText("");
      setReplyTo(null);
      setMentionQuery(null);
    }
  }, [isOpen]);

  const getLikeState = (comment: any): LikeState => {
    if (likeStates[comment.id] !== undefined) return likeStates[comment.id];
    return { isLiked: comment.isLiked ?? false, count: comment.likesCount ?? 0 };
  };

  const handleLike = useCallback(async (commentId: number, current: LikeState) => {
    const optimistic: LikeState = {
      isLiked: !current.isLiked,
      count: current.isLiked ? Math.max(0, current.count - 1) : current.count + 1,
    };
    setLikeStates(prev => ({ ...prev, [commentId]: optimistic }));
    try {
      const res = await fetch(`/api/comments/${commentId}/like`, {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setLikeStates(prev => ({ ...prev, [commentId]: { isLiked: data.isLiked, count: data.likesCount } }));
      } else {
        setLikeStates(prev => ({ ...prev, [commentId]: current }));
      }
    } catch {
      setLikeStates(prev => ({ ...prev, [commentId]: current }));
    }
  }, []);

  const handleTextChange = (val: string) => {
    setText(val);
    const match = val.match(/@(\w*)$/);
    setMentionQuery(match ? match[1] : null);
  };

  const insertMention = (username: string) => {
    const newText = text.replace(/@\w*$/, `@${username} `);
    setText(newText);
    setMentionQuery(null);
    inputRef.current?.focus();
  };

  const handleSubmit = async () => {
    if (!text.trim() || postId <= 0 || isSubmitting) return;
    setIsSubmitting(true);

    const content = replyTo ? `@${replyTo.username} ${text.trim()}` : text.trim();
    const parentCommentId = replyTo?.commentId ?? null;

    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content, parentCommentId }),
      });
      if (res.ok) {
        setText("");
        setReplyTo(null);
        setMentionQuery(null);
        refetch();
      }
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (n: string) => (n ? n.charAt(0).toUpperCase() : "?");
  const timeAgo = (d: string) => {
    try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ""; }
  };

  // Build commenter usernames for @mention suggestions
  const allUsernames = [...new Set(rawComments.map((c: any) => c.author?.username).filter(Boolean))];
  const mentionSuggestions = mentionQuery !== null
    ? allUsernames.filter(u => u.toLowerCase().startsWith(mentionQuery.toLowerCase())).slice(0, 5)
    : [];

  // Separate top-level and replies using parentCommentId (preferred) or text-matching fallback
  const topLevelComments = rawComments.filter((c: any) => !c.parentCommentId);
  const replyComments = rawComments.filter((c: any) => !!c.parentCommentId);

  // For legacy comments (no parentCommentId), also detect text-based replies
  const commenterUsernameSet = new Set(rawComments.map((c: any) => c.author?.username));
  const legacyReplies = rawComments.filter((c: any) =>
    !c.parentCommentId &&
    c.content.startsWith("@") &&
    commenterUsernameSet.has(c.content.split(" ")[0].slice(1))
  );
  const legacyTopLevel = rawComments.filter((c: any) =>
    !c.parentCommentId &&
    !(c.content.startsWith("@") && commenterUsernameSet.has(c.content.split(" ")[0].slice(1)))
  );

  // If all comments lack parentCommentId, use the legacy text-based approach
  const hasParentInfo = replyComments.length > 0 || topLevelComments.some((c: any) => c.parentCommentId !== undefined);
  const useParentIds = replyComments.length > 0;

  const finalTopLevel = useParentIds ? topLevelComments : legacyTopLevel;
  const getRepliesFor = useParentIds
    ? (commentId: number) => replyComments.filter((r: any) => r.parentCommentId === commentId)
    : (() => {
        // Legacy: text-based grouping but assign to the LAST comment by that author (not first)
        // to handle multi-comment same-author scenario correctly
        const usedReplyIds = new Set<number>();
        const commentsByAuthor: Record<string, any[]> = {};
        for (const c of rawComments) {
          const u = c.author?.username;
          if (u) {
            if (!commentsByAuthor[u]) commentsByAuthor[u] = [];
            commentsByAuthor[u].push(c);
          }
        }
        return (commentId: number) => {
          const comment = rawComments.find((c: any) => c.id === commentId);
          if (!comment) return [];
          // Use this comment's author username to find replies
          const authorUsername = comment.author?.username;
          if (!authorUsername) return [];
          // Find replies that @mention this author and are not yet used
          const matches = legacyReplies.filter(
            (r: any) =>
              r.content.startsWith(`@${authorUsername} `) &&
              !usedReplyIds.has(r.id) &&
              // Assign to the LAST comment by this author that is <= this reply's creation time
              commentsByAuthor[authorUsername]
                ?.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                ?.find((c: any) => new Date(c.createdAt) <= new Date(r.createdAt))?.id === commentId
          );
          matches.forEach(r => usedReplyIds.add(r.id));
          return matches;
        };
      })();

  const displayCount = rawComments.length > 0 ? rawComments.length : commentsCount;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 16 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="bg-card border border-border rounded-3xl flex flex-col overflow-hidden shadow-2xl w-full max-w-lg"
            style={{ maxHeight: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <span className="font-bold text-foreground text-base">
                  {displayCount > 0 ? `${displayCount} Comments` : "Comments"}
                </span>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 no-scrollbar">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : rawComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <MessageCircle className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm">No comments yet. Be the first!</p>
                </div>
              ) : (
                finalTopLevel.map((c: any) => {
                  const likeState = getLikeState(c);
                  const nestedReplies = getRepliesFor(c.id);
                  return (
                    <div key={c.id} className="space-y-1">
                      {/* Top-level comment */}
                      <div className="flex gap-3 items-start py-2">
                        <Avatar className="w-8 h-8 shrink-0 border border-border">
                          <AvatarImage src={c.author?.avatarUrl || ""} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                            {getInitials(c.author?.displayName || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2.5">
                            <Link href={`/profile/${c.author?.username}`} className="font-semibold text-foreground text-sm hover:underline">
                              {c.author?.username}
                            </Link>
                            <p className="text-foreground text-sm mt-0.5 break-words leading-relaxed">
                              {renderCommentText(c.content)}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 mt-1.5 pl-2">
                            <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                            <button
                              className="text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
                              onClick={() => {
                                setReplyTo({ username: c.author?.username, commentId: c.id });
                                setTimeout(() => inputRef.current?.focus(), 100);
                              }}
                            >
                              Reply
                            </button>
                            <button
                              className="flex items-center gap-1 text-xs transition-colors group"
                              onClick={() => handleLike(c.id, likeState)}
                            >
                              <Heart
                                className={`w-3 h-3 transition-all ${
                                  likeState.isLiked
                                    ? "fill-pink-500 text-pink-500 scale-110"
                                    : "text-muted-foreground group-hover:text-pink-400"
                                }`}
                              />
                              {likeState.count > 0 && (
                                <span className={likeState.isLiked ? "text-pink-500" : "text-muted-foreground group-hover:text-pink-400"}>
                                  {likeState.count}
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Nested replies — visually smaller and indented */}
                      {nestedReplies.map((reply: any) => {
                        const replyLikeState = getLikeState(reply);
                        return (
                          <div key={reply.id} className="flex gap-2 items-start ml-10 pb-1">
                            <CornerDownRight className="w-3 h-3 text-muted-foreground/40 mt-2 shrink-0" />
                            <Avatar className="w-6 h-6 shrink-0 border border-border">
                              <AvatarImage src={reply.author?.avatarUrl || ""} />
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                                {getInitials(reply.author?.displayName || "?")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="bg-muted/50 rounded-xl rounded-tl-sm px-2.5 py-2 border border-border/30">
                                <Link href={`/profile/${reply.author?.username}`} className="font-semibold text-foreground text-xs hover:underline">
                                  {reply.author?.username}
                                </Link>
                                {" "}
                                <span className="text-xs text-foreground/90 break-words leading-relaxed">
                                  {renderCommentText(reply.content)}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 pl-1">
                                <span className="text-[10px] text-muted-foreground">{timeAgo(reply.createdAt)}</span>
                                <button
                                  className="text-[10px] text-muted-foreground hover:text-foreground font-semibold transition-colors"
                                  onClick={() => {
                                    setReplyTo({ username: reply.author?.username, commentId: c.id });
                                    setTimeout(() => inputRef.current?.focus(), 100);
                                  }}
                                >
                                  Reply
                                </button>
                                <button
                                  className="flex items-center gap-1 text-[10px] transition-colors group"
                                  onClick={() => handleLike(reply.id, replyLikeState)}
                                >
                                  <Heart
                                    className={`w-2.5 h-2.5 transition-all ${
                                      replyLikeState.isLiked
                                        ? "fill-pink-500 text-pink-500 scale-110"
                                        : "text-muted-foreground group-hover:text-pink-400"
                                    }`}
                                  />
                                  {replyLikeState.count > 0 && (
                                    <span className={replyLikeState.isLiked ? "text-pink-500" : "text-muted-foreground group-hover:text-pink-400"}>
                                      {replyLikeState.count}
                                    </span>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })
              )}
            </div>

            {/* Input bar */}
            <div className="px-4 py-3 border-t border-border flex flex-col gap-2 shrink-0 bg-card relative">
              {/* @mention suggestions */}
              <AnimatePresence>
                {mentionSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    className="absolute bottom-full left-4 right-4 mb-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-10"
                  >
                    {mentionSuggestions.map(username => (
                      <button
                        key={username}
                        onMouseDown={(e) => { e.preventDefault(); insertMention(username); }}
                        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-sm text-left transition-colors"
                      >
                        <span className="text-primary font-semibold">@{username}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

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
                <input
                  ref={inputRef}
                  value={text}
                  onChange={(e) => handleTextChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  placeholder={replyTo ? `Reply to @${replyTo.username}…` : "Add a comment…"}
                  className="flex-1 bg-muted border border-border rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
                />
                <button
                  onClick={handleSubmit}
                  disabled={!text.trim() || isSubmitting}
                  className="p-2.5 rounded-full text-primary disabled:opacity-40 hover:bg-primary/10 transition-colors shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
