import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Heart, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useGetPostComments, useCreateComment } from "@workspace/api-client-react";
import { formatDistanceToNow } from "date-fns";

interface CommentsSheetProps {
  postId: number;
  commentsCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function CommentsSheet({ postId, commentsCount, isOpen, onClose }: CommentsSheetProps) {
  const { data: commentsData, isLoading, refetch } = useGetPostComments(postId, {
    query: { enabled: isOpen && postId > 0 },
  });
  const comments: any[] = Array.isArray(commentsData) ? commentsData : [];
  const createMutation = useCreateComment();
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!text.trim() || postId <= 0) return;
    createMutation.mutate(
      { id: postId, data: { content: text.trim() } },
      {
        onSuccess: () => {
          setText("");
          setReplyTo(null);
          refetch();
        },
      }
    );
  };

  const getInitials = (n: string) => (n ? n.charAt(0).toUpperCase() : "?");
  const timeAgo = (d: string) => {
    try { return formatDistanceToNow(new Date(d), { addSuffix: true }); } catch { return ""; }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col justify-end"
          style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 340 }}
            className="bg-card border-t border-border rounded-t-3xl flex flex-col overflow-hidden shadow-2xl"
            style={{ maxHeight: "78vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-0 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-muted-foreground" />
                <span className="font-bold text-foreground text-base">
                  {commentsCount > 0 ? `${commentsCount} Comments` : "Comments"}
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
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 no-scrollbar">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <MessageCircle className="w-10 h-10 text-muted-foreground/30" />
                  <p className="text-muted-foreground text-sm">No comments yet. Be the first!</p>
                </div>
              ) : (
                comments.map((c: any) => (
                  <div key={c.id} className="flex gap-3 items-start">
                    <Avatar className="w-8 h-8 shrink-0 border border-border">
                      <AvatarImage src={c.author?.avatarUrl || ""} />
                      <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                        {getInitials(c.author?.displayName || "?")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2.5">
                        <span className="font-semibold text-foreground text-sm">{c.author?.username}</span>
                        <p className="text-foreground text-sm mt-0.5 break-words leading-relaxed">{c.content}</p>
                      </div>
                      <div className="flex items-center gap-4 mt-1.5 pl-2">
                        <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
                        <button
                          className="text-xs text-muted-foreground hover:text-foreground font-semibold transition-colors"
                          onClick={() => setReplyTo(c.author?.username)}
                        >
                          Reply
                        </button>
                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                          <Heart className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input bar */}
            <div className="px-4 py-3 border-t border-border flex items-center gap-3 shrink-0 bg-card">
              {replyTo && (
                <div className="absolute bottom-full left-4 mb-1 flex items-center gap-1 text-xs text-primary bg-primary/10 rounded-full px-3 py-1">
                  <span>Replying to @{replyTo}</span>
                  <button onClick={() => setReplyTo(null)} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder={replyTo ? `Reply to @${replyTo}…` : "Add a comment…"}
                className="flex-1 bg-muted border border-border rounded-full px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || createMutation.isPending}
                className="p-2.5 rounded-full text-primary disabled:opacity-40 hover:bg-primary/10 transition-colors shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
