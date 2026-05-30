import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearch, useParams } from "wouter";
import { useMentions } from "@/hooks/useMentions";
import MentionSuggestions from "@/components/MentionSuggestions";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Heart, MessageCircle, Repeat2, Bookmark, Share2, MoreHorizontal,
  Hash, TrendingUp, BadgeCheck, Image as ImageIcon, Smile, X, Send,
  Trash2, Copy, ArrowLeft,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@clerk/react";
import { useGetMe } from "@workspace/api-client-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

type OriginalChirp = {
  id: number;
  author: { id: number; username: string; displayName: string; avatarUrl: string | null; isVerified: boolean; isFounder: boolean };
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  hashtags: string[];
  createdAt: string;
};

type ChirpData = {
  id: number;
  authorId: number;
  author: {
    id: number; username: string; displayName: string;
    avatarUrl: string | null; isVerified: boolean; isFounder: boolean;
  };
  content: string;
  hashtags: string[];
  mentions: string[];
  mediaUrl: string | null;
  mediaType: string | null;
  parentId: number | null;
  rechirpOfId: number | null;
  quoteOfId: number | null;
  originalChirp: OriginalChirp | null;
  viewCount: number;
  likesCount: number;
  commentsCount: number;
  rechirpsCount: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
  replies?: ChirpData[];
};

async function apiFetch(url: string, opts?: RequestInit) {
  const res = await fetch(url, { credentials: "include", ...opts });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function useChirpsFeed() {
  return useQuery<{ items: ChirpData[]; hasMore: boolean; nextCursor: number | null }>({
    queryKey: ["chirps"],
    queryFn: () => apiFetch("/api/chirps"),
    staleTime: 30_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

function useTrending() {
  return useQuery<{ trending: { hashtag: string; count: number }[] }>({
    queryKey: ["chirps-trending"],
    queryFn: () => apiFetch("/api/chirps/trending"),
    staleTime: 60_000,
  });
}

function useCreateChirp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ChirpData> & { content: string }) =>
      apiFetch("/api/chirps", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chirps"] }),
  });
}

function useLikeChirp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/chirps/${id}/like`, { method: "POST" }),
    onSuccess: (data: any, id: number) => {
      qc.setQueryData<{ items: ChirpData[]; hasMore: boolean; nextCursor: number | null }>(
        ["chirps"],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((c) =>
              c.id === id
                ? { ...c, isLiked: data.isLiked, likesCount: data.likesCount }
                : c
            ),
          };
        }
      );
    },
  });
}

function useSaveChirp() {
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/chirps/${id}/save`, { method: "POST" }),
  });
}

function useRechirp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/chirps/${id}/rechirp`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chirps"] }),
  });
}

function useDeleteChirp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isAdmin }: { id: number; isAdmin?: boolean }) =>
      apiFetch(isAdmin ? `/api/admin/chirps/${id}` : `/api/chirps/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chirps"] }),
  });
}

function getInitials(n: string) { return n ? n.charAt(0).toUpperCase() : "?"; }
function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }

function renderContent(content: string) {
  const parts = content.split(/(\s)/);
  return parts.map((word, i) => {
    if (word.startsWith("#")) return <span key={i} className="text-primary font-semibold cursor-pointer hover:underline">{word}</span>;
    if (word.startsWith("@")) {
      const username = word.slice(1).replace(/[^a-zA-Z0-9_]/g, "");
      const trailing = word.slice(1 + username.length);
      return (
        <span key={i}>
          <Link href={`/profile/${username}`} onClick={e => e.stopPropagation()} className="text-primary font-semibold hover:underline">@{username}</Link>{trailing}
        </span>
      );
    }
    return <span key={i}>{word}</span>;
  });
}

function ChirpCard({
  chirp, onReply, isNested = false, onOpen, onCommentClick,
}: {
  chirp: ChirpData;
  onReply?: (chirp: ChirpData) => void;
  isNested?: boolean;
  onOpen?: (chirp: ChirpData) => void;
  onCommentClick?: (chirp: ChirpData) => void;
}) {
  const [localLiked, setLocalLiked] = useState(chirp.isLiked);
  const [localLikes, setLocalLikes] = useState(chirp.likesCount);
  const [localSaved, setLocalSaved] = useState(chirp.isSaved);
  const [localRechirped, setLocalRechirped] = useState(!!(chirp as any).isRechirped);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const likeMut = useLikeChirp();
  const saveMut = useSaveChirp();
  const rechirpMut = useRechirp();
  const deleteMut = useDeleteChirp();
  const { data: me } = useGetMe();
  const requireAuth = useRequireAuth();
  const isOwner = me && (me as any).id === chirp.authorId;
  const isFounderOrAdmin = me && ((me as any).isFounder || (me as any).id === 1);
  const canDelete = isOwner || isFounderOrAdmin;

  const serverLikeRef = useRef({ liked: chirp.isLiked, count: chirp.likesCount });

  useEffect(() => {
    if (
      chirp.isLiked !== serverLikeRef.current.liked ||
      chirp.likesCount !== serverLikeRef.current.count
    ) {
      serverLikeRef.current = { liked: chirp.isLiked, count: chirp.likesCount };
      setLocalLiked(chirp.isLiked);
      setLocalLikes(chirp.likesCount);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chirp.isLiked, chirp.likesCount]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(() => {
      const newLiked = !localLiked;
      setLocalLiked(newLiked);
      setLocalLikes(l => l + (newLiked ? 1 : -1));
      likeMut.mutate(chirp.id, {
        onSuccess: (d: any) => {
          serverLikeRef.current = { liked: d.isLiked, count: d.likesCount };
          setLocalLiked(d.isLiked);
          setLocalLikes(d.likesCount);
        },
        onError: () => { setLocalLiked(!newLiked); setLocalLikes(l => l + (!newLiked ? 1 : -1)); },
      });
    });
  };

  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(() => {
      setLocalSaved(s => !s);
      saveMut.mutate(chirp.id, { onError: () => setLocalSaved(s => !s) });
    });
  };

  const handleRechirp = (e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(() => {
      const newVal = !localRechirped;
      setLocalRechirped(newVal);
      rechirpMut.mutate(chirp.id, {
        onSuccess: (d: any) => setLocalRechirped(d.rechirped ?? newVal),
        onError: () => setLocalRechirped(!newVal),
      });
    });
  };

  const handleReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    requireAuth(() => onReply?.(chirp));
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/chirps/${chirp.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `@${chirp.author.username} on Squawk`, text: chirp.content, url });
      } catch {
        // Share cancelled or failed — silently ignore
      }
    } else {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/chirps/${chirp.id}`).catch(() => {});
  };

  const handleDeleteConfirmed = () => {
    deleteMut.mutate({ id: chirp.id, isAdmin: !isOwner && !!isFounderOrAdmin });
    setShowDeleteConfirm(false);
  };

  const handleCardClick = () => {
    if (onOpen) onOpen(chirp);
    else if (onCommentClick) onCommentClick(chirp);
  };

  const ChirpMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="ml-auto text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors"
          onClick={e => e.stopPropagation()}
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44" onClick={e => e.stopPropagation()}>
        {canDelete && (
          <>
            <DropdownMenuItem
              onClick={e => { e.stopPropagation(); setShowDeleteConfirm(true); }}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete chirp
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          <Copy className="w-4 h-4 mr-2" />
          Copy link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(chirp.createdAt), { addSuffix: true }); } catch { return ""; }
  })();

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleCardClick}
      className={`border-b border-border transition-colors ${(onOpen || onCommentClick) ? "cursor-pointer" : ""} ${isNested ? "bg-muted/20 hover:bg-muted/30" : "hover:bg-muted/30"}`}
    >
      {(chirp.rechirpOfId !== null || localRechirped) && (
        <div className="flex items-center gap-2 px-4 pt-3 text-xs font-semibold text-green-500">
          <Repeat2 className="w-3.5 h-3.5" />
          <span>{chirp.rechirpOfId !== null ? `${chirp.author.displayName || chirp.author.username} reposted` : "You reposted"}</span>
        </div>
      )}
      <div className="flex gap-3 px-4 py-4">
        {chirp.originalChirp ? (
          <Link href={`/profile/${chirp.originalChirp.author.username}`} onClick={e => e.stopPropagation()}>
            <Avatar className="w-11 h-11 border border-border hover:border-primary transition-colors shrink-0">
              <AvatarImage src={chirp.originalChirp.author.avatarUrl || ""} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                {getInitials(chirp.originalChirp.author.displayName)}
              </AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Link href={`/profile/${chirp.author.username}`} onClick={e => e.stopPropagation()}>
            <Avatar className="w-11 h-11 border border-border hover:border-primary transition-colors shrink-0">
              <AvatarImage src={chirp.author.avatarUrl || ""} />
              <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                {getInitials(chirp.author.displayName)}
              </AvatarFallback>
            </Avatar>
          </Link>
        )}

        <div className="flex-1 min-w-0">
          {chirp.originalChirp ? (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/profile/${chirp.originalChirp.author.username}`} onClick={e => e.stopPropagation()}>
                  <span className="font-bold text-foreground hover:underline">{chirp.originalChirp.author.displayName || chirp.originalChirp.author.username}</span>
                </Link>
                {chirp.originalChirp.author.isFounder && <BadgeCheck className="w-4 h-4 text-pink-500 shrink-0" />}
                {chirp.originalChirp.author.isVerified && !chirp.originalChirp.author.isFounder && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                <span className="text-muted-foreground text-sm">@{chirp.originalChirp.author.username}</span>
                <ChirpMenu />
              </div>
              {chirp.originalChirp.content && (
                <p className="mt-1 text-[15px] leading-relaxed break-words">{renderContent(chirp.originalChirp.content)}</p>
              )}
              {chirp.originalChirp.mediaUrl && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-border">
                  {chirp.originalChirp.mediaType === "video" ? (
                    <video src={chirp.originalChirp.mediaUrl} controls className="w-full max-h-80 object-cover" playsInline />
                  ) : (
                    <img src={chirp.originalChirp.mediaUrl} alt="chirp media" className="w-full max-h-80 object-cover" />
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <Link href={`/profile/${chirp.author.username}`} onClick={e => e.stopPropagation()}>
                  <span className="font-bold text-foreground hover:underline">{chirp.author.displayName || chirp.author.username}</span>
                </Link>
                {chirp.author.isFounder && <BadgeCheck className="w-4 h-4 text-pink-500 shrink-0" />}
                {chirp.author.isVerified && !chirp.author.isFounder && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
                <span className="text-muted-foreground text-sm">@{chirp.author.username}</span>
                <span className="text-muted-foreground text-sm">·</span>
                <span className="text-muted-foreground text-sm">{timeAgo}</span>
                <ChirpMenu />
              </div>
              {chirp.content && (
                <p className="mt-1 text-[15px] leading-relaxed break-words">{renderContent(chirp.content)}</p>
              )}
              {chirp.mediaUrl && (
                <div className="mt-3 rounded-2xl overflow-hidden border border-border" onClick={e => e.stopPropagation()}>
                  {chirp.mediaType === "video" ? (
                    <video src={chirp.mediaUrl} controls className="w-full max-h-80 object-cover" playsInline />
                  ) : (
                    <img src={chirp.mediaUrl} alt="chirp media" className="w-full max-h-80 object-cover" />
                  )}
                </div>
              )}
            </>
          )}

          <div className="flex items-center gap-1 mt-3 -ml-2">
            <button
              onClick={handleReply}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors group text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{fmt(chirp.commentsCount)}</span>
            </button>

            <button
              onClick={handleRechirp}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors text-sm ${localRechirped ? "text-green-400" : "text-muted-foreground hover:text-green-400 hover:bg-green-400/10"}`}
            >
              <Repeat2 className="w-4 h-4" />
              <span className="text-xs">{fmt(chirp.rechirpsCount + (localRechirped ? 1 : 0))}</span>
            </button>

            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors text-sm ${localLiked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10"}`}
            >
              <Heart className={`w-4 h-4 ${localLiked ? "fill-pink-500" : ""}`} />
              <span className="text-xs">{fmt(localLikes)}</span>
            </button>

            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors text-sm ${localSaved ? "text-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/10"}`}
            >
              <Bookmark className={`w-4 h-4 ${localSaved ? "fill-primary" : ""}`} />
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors text-sm"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
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
              onClick={handleDeleteConfirmed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.article>
  );
}

function ChirpComposer({ me, replyTo, onClose, onPosted }: {
  me: any; replyTo?: ChirpData | null; onClose?: () => void; onPosted?: () => void;
}) {
  const [content, setContent] = useState(replyTo ? `@${replyTo.author.username} ` : "");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const createMut = useCreateChirp();
  const { suggestions: mentionSuggestions, loading: mentionsLoading, isOpen: mentionsOpen, handleChange: handleMentionChange, insertMention } = useMentions(content, setContent, textareaRef);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  useEffect(() => {
    if (!showEmojiPicker) return;
    const handler = (e: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showEmojiPicker]);

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? content.length;
    const end = el.selectionEnd ?? content.length;
    const newContent = content.slice(0, start) + text + content.slice(end);
    setContent(newContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ["image/jpeg","image/png","image/gif","image/webp","video/mp4","video/quicktime","video/webm","video/x-msvideo","video/x-matroska"];
    if (!allowed.includes(file.type)) {
      alert("Unsupported file type. Please use JPG, PNG, GIF, WEBP, MP4, MOV, or WEBM.");
      return;
    }
    if (file.size > 100 * 1024 * 1024) {
      alert("File too large. Maximum size is 100MB.");
      return;
    }

    const preview = URL.createObjectURL(file);
    setMediaPreview(preview);
    setMediaType(file.type.startsWith("video/") ? "video" : "image");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/storage/upload", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const { mediaUrl: url } = await res.json();
      setMediaUrl(url);
    } catch {
      alert("Upload failed. Please try again.");
      setMediaPreview(null);
      setMediaType(null);
    } finally {
      setUploading(false);
    }

    e.target.value = "";
  };

  const removeMedia = () => {
    setMediaUrl(null);
    setMediaType(null);
    setMediaPreview(null);
  };

  const handlePost = () => {
    if (!content.trim() && !mediaUrl) return;
    if (uploading) return;
    const hashtags = [...content.matchAll(/#(\w+)/g)].map(m => m[1]);
    const mentions = [...content.matchAll(/@(\w+)/g)].map(m => m[1]);
    createMut.mutate({
      content: content.trim(),
      hashtags,
      mentions,
      parentId: replyTo?.id ?? undefined,
      mediaUrl: mediaUrl ?? undefined,
      mediaType: mediaType ?? undefined,
    } as any, {
      onSuccess: () => {
        setContent("");
        setMediaUrl(null);
        setMediaType(null);
        setMediaPreview(null);
        onPosted?.();
        onClose?.();
      },
    });
  };

  const charCount = content.length;
  const maxChars = 500;
  const remaining = maxChars - charCount;

  return (
    <div className="flex gap-3 p-4">
      <Avatar className="w-10 h-10 border border-border shrink-0">
        <AvatarImage src={me?.avatarUrl || ""} />
        <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
          {getInitials(me?.displayName || "?")}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        {replyTo && (
          <div className="text-sm text-muted-foreground mb-2">
            Replying to <span className="text-primary">@{replyTo.author.username}</span>
          </div>
        )}
        <div className="relative">
          <MentionSuggestions
            suggestions={mentionSuggestions}
            loading={mentionsLoading}
            isOpen={mentionsOpen}
            onSelect={insertMention}
            className="absolute bottom-full left-0 right-0 mb-1 max-h-52 overflow-y-auto"
          />
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={e => handleMentionChange(e.target.value)}
            placeholder={replyTo ? "Post your reply..." : "What's chirping?"}
            className="bg-transparent border-0 shadow-none focus-visible:ring-0 p-0 text-lg resize-none min-h-[80px] placeholder:text-muted-foreground/60"
            onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost(); }}
          />
        </div>

        {mediaPreview && (
          <div className="relative mt-2 rounded-2xl overflow-hidden border border-border w-full max-h-72">
            {mediaType === "video" ? (
              <video src={mediaPreview} className="w-full max-h-72 object-cover" controls playsInline />
            ) : (
              <img src={mediaPreview} alt="attachment" className="w-full max-h-72 object-cover" />
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-7 h-7 border-3 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-white text-xs font-medium">Uploading…</span>
                </div>
              </div>
            )}
            {!uploading && (
              <button
                onClick={removeMedia}
                className="absolute top-2 right-2 w-7 h-7 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pt-3 border-t border-border">
          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!!mediaPreview}
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors disabled:opacity-40"
              title="Attach image or video"
            >
              <ImageIcon className="w-5 h-5" />
            </button>
            <div className="relative" ref={emojiPickerRef}>
              <button
                className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
                onClick={() => setShowEmojiPicker(v => !v)}
                type="button"
                title="Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-10 left-0 z-50 bg-card border border-border rounded-2xl shadow-xl p-3 w-72">
                  <div className="grid grid-cols-8 gap-1">
                    {[
                      "😂","😍","🔥","💯","👀","🥳","😭","✨",
                      "🚀","💀","🫡","🤣","😎","🫶","❤️","💜",
                      "🤩","😤","🥲","😮","🤔","🫠","💅","👏",
                      "🙌","👊","💪","🎉","🎯","⚡","🌊","🌙",
                      "🦋","🐉","🦄","🌸","💎","🏆","👑","🎭",
                      "😈","👾","🤖","🫣","😅","🥹","😇","🤯",
                    ].map(emoji => (
                      <button
                        key={emoji}
                        className="text-xl hover:bg-muted rounded-lg p-1 transition-colors leading-none"
                        onClick={() => { insertAtCursor(emoji); setShowEmojiPicker(false); }}
                        type="button"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors"
              onClick={() => insertAtCursor("#")}
              type="button"
              title="Add hashtag"
            >
              <Hash className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            {charCount > 0 && (
              <span className={`text-sm font-medium ${remaining < 20 ? "text-destructive" : remaining < 50 ? "text-yellow-500" : "text-muted-foreground"}`}>
                {remaining}
              </span>
            )}
            <Button
              size="sm"
              onClick={handlePost}
              disabled={(!content.trim() && !mediaUrl) || charCount > maxChars || createMut.isPending || uploading}
              className="rounded-full px-5 font-bold bg-gradient-to-r from-primary to-[#c084fc] border-0 text-white hover:opacity-90"
            >
              {createMut.isPending ? "Posting…" : uploading ? "Uploading…" : replyTo ? "Reply" : "Chirp"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThinChirpComposer({ me, replyTo, onPosted }: { me: any; replyTo: ChirpData; onPosted: () => void }) {
  const [content, setContent] = useState("");
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createMut = useCreateChirp();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setMediaPreview(preview);
    setMediaType(file.type.startsWith("video/") ? "video" : "image");
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/storage/upload", { method: "POST", body: formData, credentials: "include" });
      if (!res.ok) throw new Error("Upload failed");
      const { mediaUrl: url } = await res.json();
      setMediaUrl(url);
    } catch {
      alert("Upload failed. Please try again.");
      setMediaPreview(null);
      setMediaType(null);
    } finally {
      setUploading(false);
    }
    e.target.value = "";
  };

  const handlePost = () => {
    if ((!content.trim() && !mediaUrl) || uploading) return;
    const hashtags = [...content.matchAll(/#(\w+)/g)].map(m => m[1]);
    const mentions = [...content.matchAll(/@(\w+)/g)].map(m => m[1]);
    createMut.mutate({
      content: content.trim(),
      hashtags,
      mentions,
      parentId: replyTo.id,
      mediaUrl: mediaUrl ?? undefined,
      mediaType: mediaType ?? undefined,
    } as any, {
      onSuccess: () => {
        setContent("");
        setMediaUrl(null);
        setMediaType(null);
        setMediaPreview(null);
        onPosted();
      },
    });
  };

  return (
    <div className="border-t border-border bg-background shrink-0">
      {mediaPreview && (
        <div className="relative mx-3 mt-2 rounded-xl overflow-hidden border border-border max-h-40">
          {mediaType === "video" ? (
            <video src={mediaPreview} className="w-full max-h-40 object-cover" controls playsInline />
          ) : (
            <img src={mediaPreview} alt="attachment" className="w-full max-h-40 object-cover" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!uploading && (
            <button
              onClick={() => { setMediaUrl(null); setMediaType(null); setMediaPreview(null); }}
              className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center text-white hover:bg-black/90"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <Avatar className="w-8 h-8 border border-border shrink-0">
          <AvatarImage src={me?.avatarUrl || ""} />
          <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
            {getInitials(me?.displayName || "?")}
          </AvatarFallback>
        </Avatar>
        <input
          className="flex-1 bg-muted/40 rounded-full px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 min-w-0"
          placeholder={`Reply to @${replyTo.author.username}…`}
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handlePost(); } }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={handleFileSelect}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={!!mediaPreview}
          className="p-2 text-muted-foreground hover:text-primary transition-colors shrink-0 disabled:opacity-40"
          title="Attach media"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          onClick={handlePost}
          disabled={(!content.trim() && !mediaUrl) || uploading || createMut.isPending}
          className="p-2 text-primary hover:text-primary/80 disabled:opacity-40 transition-colors shrink-0"
          title="Send reply"
        >
          {createMut.isPending || uploading ? (
            <div className="w-4 h-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function TrendingSidebar({ trending }: { trending: { hashtag: string; count: number }[] }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          What's Chirping
        </h2>
      </div>
      {trending.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">No trending topics yet</div>
      ) : (
        trending.map((t, i) => (
          <Link key={t.hashtag} href={`/explore/hashtags/${t.hashtag}`}>
            <div className="px-4 py-3 hover:bg-muted/50 transition-colors cursor-pointer border-b border-border/50 last:border-0">
              <div className="text-xs text-muted-foreground">{i + 1} · Trending</div>
              <div className="font-bold text-foreground">#{t.hashtag}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t.count.toLocaleString()} Chirps</div>
            </div>
          </Link>
        ))
      )}
    </div>
  );
}

function useChirpDetail(id: number | null) {
  return useQuery<ChirpData & { replies: ChirpData[] }>({
    queryKey: ["chirp-detail", id],
    queryFn: () => apiFetch(`/api/chirps/${id}`),
    enabled: id !== null && id > 0,
    staleTime: 10_000,
  });
}

function CommentDetailSheet({ parentChirp, comment, me, onClose, onPosted }: {
  parentChirp: ChirpData;
  comment: ChirpData;
  me: any;
  onClose: () => void;
  onPosted: () => void;
}) {
  const qc = useQueryClient();
  const { data: detail, isLoading } = useChirpDetail(comment.id);

  const handlePosted = () => {
    qc.invalidateQueries({ queryKey: ["chirp-detail", comment.id] });
    qc.invalidateQueries({ queryKey: ["chirp-detail", parentChirp.id] });
    qc.invalidateQueries({ queryKey: ["chirps"] });
    onPosted();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[60] bg-background dark flex flex-col"
    >
      <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
        <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors mr-3">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-lg">Comment</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="border-b border-border opacity-70">
          <ChirpCard chirp={parentChirp} isNested />
        </div>

        <div className="border-b-2 border-primary/30">
          <ChirpCard chirp={comment} isNested />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (detail?.replies ?? []).length === 0 ? (
          <div className="flex flex-col items-center py-10 text-muted-foreground text-sm gap-2">
            <MessageCircle className="w-8 h-8 opacity-30" />
            <p>No replies yet. Be the first!</p>
          </div>
        ) : (
          (detail?.replies ?? []).map(reply => (
            <ChirpCard key={reply.id} chirp={reply} isNested />
          ))
        )}
      </div>

      {me && (
        <ThinChirpComposer me={me} replyTo={comment} onPosted={handlePosted} />
      )}
    </motion.div>
  );
}

function ChirpDetailSheet({ chirp, me, onClose, onPosted }: {
  chirp: ChirpData; me: any; onClose: () => void; onPosted: () => void;
}) {
  const qc = useQueryClient();
  const { data: detail, isLoading } = useChirpDetail(chirp.id);
  const [selectedComment, setSelectedComment] = useState<ChirpData | null>(null);

  const handlePosted = () => {
    qc.invalidateQueries({ queryKey: ["chirp-detail", chirp.id] });
    qc.invalidateQueries({ queryKey: ["chirps"] });
    onPosted();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: "100%" }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed inset-0 z-50 bg-background dark flex flex-col"
      >
        <div className="flex items-center px-4 py-3 border-b border-border shrink-0">
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors mr-3">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-lg">Chirp</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="border-b-2 border-primary/30">
            <ChirpCard chirp={chirp} isNested />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (detail?.replies ?? []).length === 0 ? (
            <div className="flex flex-col items-center py-10 text-muted-foreground text-sm gap-2">
              <MessageCircle className="w-8 h-8 opacity-30" />
              <p>No replies yet. Be the first!</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {(detail?.replies ?? []).map(reply => (
                <ChirpCard
                  key={reply.id}
                  chirp={reply}
                  isNested
                  onCommentClick={c => setSelectedComment(c)}
                  onReply={c => setSelectedComment(c)}
                />
              ))}
            </div>
          )}
        </div>

        {me && (
          <ThinChirpComposer me={me} replyTo={chirp} onPosted={handlePosted} />
        )}
      </motion.div>

      <AnimatePresence>
        {selectedComment && (
          <CommentDetailSheet
            parentChirp={chirp}
            comment={selectedComment}
            me={me}
            onClose={() => setSelectedComment(null)}
            onPosted={handlePosted}
          />
        )}
      </AnimatePresence>
    </>
  );
}

export default function ChirpsPage() {
  const { user } = useUser();
  const { data: me } = useGetMe({ query: { enabled: !!user } });
  const { data: feedData, isLoading, refetch } = useChirpsFeed();
  const { data: trendingData } = useTrending();
  const [openChirp, setOpenChirp] = useState<ChirpData | null>(null);
  const routeSearch = useSearch();
  const routeParams = useParams<{ id?: string }>();

  const items = feedData?.items ?? [];
  const trending = trendingData?.trending ?? [];

  useEffect(() => {
    const params = new URLSearchParams(routeSearch);
    const idStr = params.get("id") ?? routeParams.id ?? null;
    if (!idStr) return;
    const id = parseInt(idStr, 10);
    if (isNaN(id)) return;
    const found = items.find(c => c.id === id);
    if (found) { setOpenChirp(found); return; }
    apiFetch(`/api/chirps/${id}`)
      .then((data: any) => { if (data?.id) setOpenChirp(data); })
      .catch(() => {});
  }, [routeSearch, routeParams.id, items.length]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto flex gap-0 min-h-screen">

      <div className="flex-1 min-w-0 border-x border-border">

        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <h1 className="font-bold text-xl">Chirps</h1>
        </div>

        {me && (
          <div className="border-b border-border">
            <ChirpComposer me={me} onPosted={() => refetch()} />
          </div>
        )}

        {isLoading ? (
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-4 py-4 border-b border-border animate-pulse flex gap-3">
                <div className="w-11 h-11 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center px-8">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-bold text-xl">Nothing chirping yet</h3>
            <p className="text-muted-foreground">Be the first to post a Chirp!</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {items.map(chirp => (
              <ChirpCard
                key={chirp.id}
                chirp={chirp}
                onReply={c => setOpenChirp(c)}
                onOpen={c => setOpenChirp(c)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>

      <div className="hidden xl:block w-80 p-4 space-y-4 shrink-0">
        <TrendingSidebar trending={trending} />
      </div>

      <AnimatePresence>
        {openChirp && (
          <ChirpDetailSheet
            chirp={openChirp}
            me={me}
            onClose={() => setOpenChirp(null)}
            onPosted={() => refetch()}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
