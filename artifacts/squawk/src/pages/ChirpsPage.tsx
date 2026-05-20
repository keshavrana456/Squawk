import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Heart, MessageCircle, Repeat2, Bookmark, Share2, MoreHorizontal,
  Hash, TrendingUp, BadgeCheck, Image as ImageIcon, Smile, X, Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@clerk/react";
import { useGetMe } from "@workspace/api-client-react";

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
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/api/chirps/${id}/like`, { method: "POST" }),
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

function getInitials(n: string) { return n ? n.charAt(0).toUpperCase() : "?"; }
function fmt(n: number) { return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }

function renderContent(content: string) {
  const parts = content.split(/(\s)/);
  return parts.map((word, i) => {
    if (word.startsWith("#")) return <span key={i} className="text-primary font-semibold cursor-pointer hover:underline">{word}</span>;
    if (word.startsWith("@")) return <span key={i} className="text-primary font-semibold cursor-pointer hover:underline">{word}</span>;
    return <span key={i}>{word}</span>;
  });
}

function ChirpCard({ chirp, onReply }: { chirp: ChirpData; onReply?: (chirp: ChirpData) => void }) {
  const [localLiked, setLocalLiked] = useState(chirp.isLiked);
  const [localLikes, setLocalLikes] = useState(chirp.likesCount);
  const [localSaved, setLocalSaved] = useState(chirp.isSaved);
  const [localRechirped, setLocalRechirped] = useState(false);
  const likeMut = useLikeChirp();
  const saveMut = useSaveChirp();
  const rechirpMut = useRechirp();

  const handleLike = () => {
    const newLiked = !localLiked;
    setLocalLiked(newLiked);
    setLocalLikes(l => l + (newLiked ? 1 : -1));
    likeMut.mutate(chirp.id, {
      onSuccess: (d: any) => { setLocalLiked(d.isLiked); setLocalLikes(d.likesCount); },
      onError: () => { setLocalLiked(!newLiked); setLocalLikes(l => l + (!newLiked ? 1 : -1)); },
    });
  };

  const handleSave = () => {
    setLocalSaved(s => !s);
    saveMut.mutate(chirp.id, { onError: () => setLocalSaved(s => !s) });
  };

  const handleRechirp = () => {
    setLocalRechirped(r => !r);
    rechirpMut.mutate(chirp.id);
  };

  const handleShare = async () => {
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

  const timeAgo = (() => {
    try { return formatDistanceToNow(new Date(chirp.createdAt), { addSuffix: true }); } catch { return ""; }
  })();

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer"
      onClick={() => { }}
    >
      {/* Repost label */}
      {(chirp.rechirpOfId !== null || localRechirped) && (
        <div className="flex items-center gap-2 px-4 pt-3 text-xs font-semibold text-green-500">
          <Repeat2 className="w-3.5 h-3.5" />
          {localRechirped ? "You reposted" : "Reposted"}
        </div>
      )}
      <div className="flex gap-3 px-4 py-4">
        <Link href={`/profile/${chirp.author.username}`} onClick={e => e.stopPropagation()}>
          <Avatar className="w-11 h-11 border border-border hover:border-primary transition-colors shrink-0">
            <AvatarImage src={chirp.author.avatarUrl || ""} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
              {getInitials(chirp.author.displayName)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link href={`/profile/${chirp.author.username}`} onClick={e => e.stopPropagation()}>
              <span className="font-bold text-foreground hover:underline">{chirp.author.displayName || chirp.author.username}</span>
            </Link>
            {chirp.author.isFounder && <BadgeCheck className="w-4 h-4 text-pink-500 shrink-0" />}
            {chirp.author.isVerified && !chirp.author.isFounder && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
            <span className="text-muted-foreground text-sm">@{chirp.author.username}</span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-muted-foreground text-sm">{timeAgo}</span>
            <button className="ml-auto text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted transition-colors" onClick={e => e.stopPropagation()}>
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {chirp.content && (
            <p className="mt-1 text-[15px] leading-relaxed break-words">{renderContent(chirp.content)}</p>
          )}

          {chirp.mediaUrl && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-border">
              {chirp.mediaType === "video" ? (
                <video src={chirp.mediaUrl} controls className="w-full max-h-80 object-cover" playsInline />
              ) : (
                <img src={chirp.mediaUrl} alt="chirp media" className="w-full max-h-80 object-cover" />
              )}
            </div>
          )}

          <div className="flex items-center gap-1 mt-3 -ml-2">
            <button
              onClick={e => { e.stopPropagation(); onReply?.(chirp); }}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors group text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="text-xs">{fmt(chirp.commentsCount)}</span>
            </button>

            <button
              onClick={e => { e.stopPropagation(); handleRechirp(); }}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors text-sm ${localRechirped ? "text-green-400" : "text-muted-foreground hover:text-green-400 hover:bg-green-400/10"}`}
            >
              <Repeat2 className="w-4 h-4" />
              <span className="text-xs">{fmt(chirp.rechirpsCount + (localRechirped ? 1 : 0))}</span>
            </button>

            <button
              onClick={e => { e.stopPropagation(); handleLike(); }}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors text-sm ${localLiked ? "text-pink-500" : "text-muted-foreground hover:text-pink-500 hover:bg-pink-500/10"}`}
            >
              <Heart className={`w-4 h-4 ${localLiked ? "fill-pink-500" : ""}`} />
              <span className="text-xs">{fmt(localLikes)}</span>
            </button>

            <button
              onClick={e => { e.stopPropagation(); handleSave(); }}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors text-sm ${localSaved ? "text-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/10"}`}
            >
              <Bookmark className={`w-4 h-4 ${localSaved ? "fill-primary" : ""}`} />
            </button>

            <button
              onClick={e => { e.stopPropagation(); handleShare(); }}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors text-sm"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createMut = useCreateChirp();

  useEffect(() => { textareaRef.current?.focus(); }, []);

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

    // Show local preview immediately
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

    // Reset file input so same file can be reselected
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
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={replyTo ? "Post your reply..." : "What's chirping?"}
          className="bg-transparent border-0 shadow-none focus-visible:ring-0 p-0 text-lg resize-none min-h-[80px] placeholder:text-muted-foreground/60"
          onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost(); }}
        />

        {/* Media preview */}
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
            {/* Hidden file input */}
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
            <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            <button className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
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

export default function ChirpsPage() {
  const { user } = useUser();
  const { data: me } = useGetMe({ query: { enabled: !!user } });
  const { data: feedData, isLoading, refetch } = useChirpsFeed();
  const { data: trendingData } = useTrending();
  const [replyTo, setReplyTo] = useState<ChirpData | null>(null);

  const items = feedData?.items ?? [];
  const trending = trendingData?.trending ?? [];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto flex gap-0 min-h-screen">

      {/* Main Feed Column */}
      <div className="flex-1 min-w-0 border-x border-border">

        {/* Header */}
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3">
          <h1 className="font-bold text-xl">Chirps</h1>
        </div>

        {/* Composer */}
        {me && (
          <div className="border-b border-border">
            <ChirpComposer me={me} onPosted={() => refetch()} />
          </div>
        )}

        {/* Feed */}
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
              <ChirpCard key={chirp.id} chirp={chirp} onReply={c => setReplyTo(c)} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Right Sidebar — desktop only */}
      <div className="hidden xl:block w-80 p-4 space-y-4 shrink-0">
        <TrendingSidebar trending={trending} />
      </div>

      {/* Reply Sheet */}
      <AnimatePresence>
        {replyTo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setReplyTo(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <button onClick={() => setReplyTo(null)} className="p-1 rounded-full hover:bg-muted transition-colors">
                  <X className="w-5 h-5" />
                </button>
                <span className="font-bold">Reply</span>
                <div className="w-7" />
              </div>
              <div className="px-4 py-3 border-b border-border opacity-60 pointer-events-none">
                <ChirpCard chirp={replyTo} />
              </div>
              {me && (
                <ChirpComposer me={me} replyTo={replyTo} onClose={() => setReplyTo(null)} onPosted={() => refetch()} />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
