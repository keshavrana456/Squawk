import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, X, ChevronLeft, ChevronRight, Eye, Users, Trash2, MoreVertical, Pause } from "lucide-react";
import {
  useGetActiveStories,
  useGetMe,
  useViewStory,
  type StoryGroup,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import StoryUploadModal from "./StoryUploadModal";
import { useQueryClient } from "@tanstack/react-query";

const IMAGE_DURATION = 5000;
const TRANSFORM_KEY = "__transform";
const LEGACY_OFFSET_KEY = "__imageOffset";

type TextLayer = {
  id?: string; text?: string; x: number; y: number;
  fontSize?: number; color?: string; bgStyle?: "none" | "black" | "white";
  [key: string]: any;
};

type MediaTransform = { tx: number; ty: number; scale: number; rotation?: number } | null;

function parseTextLayers(raw: string | null | undefined): { layers: TextLayer[]; transform: MediaTransform } {
  if (!raw) return { layers: [], transform: null };
  try {
    const parsed = JSON.parse(raw) as any[];
    const transformEntry = parsed.find(l => l[TRANSFORM_KEY]);
    const legacyEntry = parsed.find(l => l[LEGACY_OFFSET_KEY]);
    const layers = parsed.filter(l => !l[TRANSFORM_KEY] && !l[LEGACY_OFFSET_KEY]) as TextLayer[];

    let transform: MediaTransform = null;
    if (transformEntry) {
      transform = {
        tx: transformEntry.x ?? 0,
        ty: transformEntry.y ?? 0,
        scale: transformEntry.scale ?? 1,
        rotation: transformEntry.rotation ?? 0,
      };
    } else if (legacyEntry) {
      transform = { tx: (legacyEntry.x - 50) * 2, ty: (legacyEntry.y - 50) * 2, scale: 1, rotation: 0 };
    }
    return { layers, transform };
  } catch { return { layers: [], transform: null }; }
}

// ─── Story Viewer ─────────────────────────────────────────────────────────────
export function StoryViewer({ groups: initialGroups, startIndex, onClose, onStoryDeleted }: {
  groups: StoryGroup[];
  startIndex: number;
  onClose: () => void;
  onStoryDeleted?: () => void;
}) {
  const [groups, setGroups] = useState(initialGroups);
  const [groupIndex, setGroupIndex] = useState(startIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViews, setShowViews] = useState(false);
  const [viewsList, setViewsList] = useState<any[]>([]);
  const [viewsLoading, setViewsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const markViewed = useViewStory();
  const { data: me } = useGetMe();
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  // Use a ref for isPaused to avoid stale closures inside setInterval
  const isPausedRef = useRef(false);
  // For differentiating tap vs hold
  const pointerDownTimeRef = useRef<number>(0);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const isVideo = currentStory?.mediaType === "video";
  const caption: string | null = (currentStory as any)?.caption ?? null;
  const isMyStory = me && currentGroup?.user?.id === (me as any)?.id;
  const TICK = 50;

  const { layers: textLayers, transform: mediaTransform } = parseTextLayers((currentStory as any)?.textLayers);

  // Sync ref with state
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // Pause/resume video
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isPaused) { v.pause(); } else { v.play().catch(() => {}); }
  }, [isPaused]);

  const goNext = useCallback(() => {
    if (storyIndex < (currentGroup?.stories.length ?? 1) - 1) {
      setStoryIndex(i => i + 1);
      setProgress(0);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex(g => g + 1);
      setStoryIndex(0);
      setProgress(0);
    } else {
      onClose();
    }
  }, [storyIndex, groupIndex, currentGroup, groups.length, onClose]);

  const goPrev = () => {
    if (storyIndex > 0) { setStoryIndex(i => i - 1); setProgress(0); }
    else if (groupIndex > 0) { setGroupIndex(g => g - 1); setStoryIndex(0); setProgress(0); }
  };

  useEffect(() => {
    if (currentStory) markViewed.mutate({ id: currentStory.id });
    setShowViews(false);
    setIsPaused(false);
  }, [currentStory?.id]);

  useEffect(() => {
    if (isVideo) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(0);
    intervalRef.current = setInterval(() => {
      if (isPausedRef.current) return;
      setProgress(p => {
        if (p >= 100) { clearInterval(intervalRef.current!); goNext(); return 100; }
        return p + (TICK / IMAGE_DURATION) * 100;
      });
    }, TICK);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [storyIndex, groupIndex, isVideo, goNext]);

  const handleVideoTimeUpdate = () => {
    const v = videoRef.current;
    if (v && v.duration) setProgress((v.currentTime / v.duration) * 100);
  };
  const handleVideoEnded = () => goNext();

  // Pause on hold — track pointer down on the media area
  const handleMediaPointerDown = (e: React.PointerEvent) => {
    pointerDownTimeRef.current = Date.now();
    setIsPaused(true);
  };
  const handleMediaPointerUp = (e: React.PointerEvent) => {
    setIsPaused(false);
  };
  const handleMediaPointerLeave = (e: React.PointerEvent) => {
    setIsPaused(false);
  };

  const loadViews = async () => {
    if (!currentStory) return;
    setViewsLoading(true);
    try {
      const res = await fetch(`/api/stories/${currentStory.id}/views`);
      if (res.ok) setViewsList(await res.json());
    } catch {}
    setViewsLoading(false);
  };

  const toggleViews = () => {
    if (!showViews) loadViews();
    setShowViews(v => !v);
  };

  const handleDeleteStory = async () => {
    if (!currentStory || isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/stories/${currentStory.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      const newGroups = groups.map((g: any, gi: number) => {
        if (gi !== groupIndex) return g;
        return { ...g, stories: g.stories.filter((_: any, si: number) => si !== storyIndex) };
      }).filter((g: any) => g.stories.length > 0);
      setGroups(newGroups);
      setShowDeleteConfirm(false);
      setShowMenu(false);
      queryClient.invalidateQueries({ queryKey: ["getActiveStories"] });
      onStoryDeleted?.();
      if (newGroups.length === 0) { onClose(); return; }
      const newGroupIndex = Math.min(groupIndex, newGroups.length - 1);
      setGroupIndex(newGroupIndex);
      setStoryIndex(0);
      setProgress(0);
    } catch (e) { console.error(e); }
    finally { setIsDeleting(false); }
  };

  if (!currentGroup || !currentStory) return null;

  const getInitials = (n: string) => n ? n.charAt(0).toUpperCase() : '?';
  const mediaCssTransform = mediaTransform
    ? `translate(calc(-50% + ${mediaTransform.tx}px), calc(-50% + ${mediaTransform.ty}px)) scale(${mediaTransform.scale}) rotate(${mediaTransform.rotation ?? 0}deg)`
    : "translate(-50%, -50%)";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm h-full max-h-[100dvh] md:max-h-[680px] md:rounded-2xl overflow-hidden bg-black flex flex-col"
        style={{ boxShadow: "0 0 40px 6px rgba(192,132,252,0.35), 0 0 80px 16px rgba(236,72,153,0.15)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Blurred background */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {isVideo ? (
            <video src={currentStory.mediaUrl} className="w-full h-full object-cover scale-110 blur-2xl opacity-40" muted autoPlay loop playsInline />
          ) : (
            <img src={currentStory.mediaUrl} className="w-full h-full object-cover scale-110 blur-2xl opacity-40" alt="" />
          )}
        </div>

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
          {currentGroup.stories.map((s: any, i: number) => (
            <div key={s.id} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%',
                  transition: isPaused ? 'none' : undefined,
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-20 px-4 flex items-center gap-2">
          <Avatar className="w-9 h-9 border-2 border-white/30">
            <AvatarImage src={currentGroup.user.avatarUrl || ''} className="object-cover" />
            <AvatarFallback className="text-sm bg-white/20 text-white">{getInitials(currentGroup.user.displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm leading-none">{currentGroup.user.username}</p>
            <p className="text-white/60 text-xs mt-0.5">
              {new Date(currentStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          {isMyStory && (
            <button
              onClick={e => { e.stopPropagation(); toggleViews(); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              {(currentStory as any).viewsCount ?? 0}
            </button>
          )}
          {/* Pause / Play button */}
          <button
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
            onClick={e => { e.stopPropagation(); setIsPaused(v => !v); }}
            title={isPaused ? "Play" : "Pause"}
          >
            {isPaused
              ? <ChevronRight className="w-4 h-4 fill-white" />
              : <Pause className="w-4 h-4 fill-white" />
            }
          </button>
          {isMyStory && (
            <div className="relative">
              <button
                className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                onClick={e => { e.stopPropagation(); setShowMenu(v => !v); }}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 top-10 bg-black/90 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl min-w-[160px] z-50"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-white/10 transition-colors text-sm font-medium"
                      onClick={e => { e.stopPropagation(); setShowMenu(false); setShowDeleteConfirm(true); }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Story
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <button className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media */}
        <div
          className="flex-1 relative z-10 overflow-hidden select-none"
          onPointerDown={handleMediaPointerDown}
          onPointerUp={handleMediaPointerUp}
          onPointerLeave={handleMediaPointerLeave}
          style={{ touchAction: "none" }}
        >
          {isVideo ? (
            <video
              ref={videoRef}
              key={currentStory.id}
              src={currentStory.mediaUrl}
              className="absolute w-full h-full"
              style={{
                top: "50%", left: "50%",
                objectFit: "contain",
                transform: mediaCssTransform,
                transformOrigin: "center center",
              }}
              autoPlay playsInline muted={false}
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
              onLoadedMetadata={() => setProgress(0)}
            />
          ) : (
            <img
              key={currentStory.id}
              src={currentStory.mediaUrl}
              className="absolute w-full h-full"
              style={{
                top: "50%", left: "50%",
                objectFit: "contain",
                transform: mediaCssTransform,
                transformOrigin: "center center",
              }}
              alt=""
              draggable={false}
            />
          )}

          {/* Text layers overlay */}
          {textLayers.map((layer, i) => (
            <div
              key={layer.id ?? i}
              className="absolute pointer-events-none select-none"
              style={{ left: `${layer.x}%`, top: `${layer.y}%`, transform: "translate(-50%, -50%)", zIndex: 15 }}
            >
              <div
                className={`px-2 py-1 rounded-lg text-center max-w-[200px] break-words ${
                  layer.bgStyle === "black" ? "bg-black/70 backdrop-blur-sm" :
                  layer.bgStyle === "white" ? "bg-white/80" : ""
                }`}
                style={{ fontSize: `${layer.fontSize ?? 22}px`, color: layer.color ?? "#fff", lineHeight: 1.3 }}
              >
                {layer.text}
              </div>
            </div>
          ))}

          {/* Caption overlay */}
          {caption && textLayers.length === 0 && (
            <div className="absolute bottom-16 left-0 right-0 flex justify-center px-4 z-10 pointer-events-none">
              <div className="bg-black/50 backdrop-blur-md rounded-xl px-4 py-2 max-w-[85%] text-center">
                <p className="text-white text-sm font-medium leading-snug break-words">{caption}</p>
              </div>
            </div>
          )}

          {/* Pause indicator */}
          <AnimatePresence>
            {isPaused && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.12 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
              >
                <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                  <Pause className="w-7 h-7 text-white fill-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tap zones — use onClick so they fire only on short taps, not holds */}
          <div
            className="absolute inset-y-0 left-0 w-1/3 z-25"
            onClick={e => { e.stopPropagation(); goPrev(); }}
            onPointerDown={e => e.stopPropagation()}
            onPointerUp={e => e.stopPropagation()}
          />
          <div
            className="absolute inset-y-0 right-0 w-1/3 z-25"
            onClick={e => { e.stopPropagation(); goNext(); }}
            onPointerDown={e => e.stopPropagation()}
            onPointerUp={e => e.stopPropagation()}
          />
        </div>

        {/* Views panel (owner only) */}
        <AnimatePresence>
          {showViews && isMyStory && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 340 }}
              className="absolute bottom-0 left-0 right-0 z-30 bg-black/90 backdrop-blur-md rounded-t-2xl border-t border-white/10"
              style={{ maxHeight: "55%" }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-white/60" />
                  <span className="text-white font-semibold text-sm">Seen by {viewsList.length}</span>
                </div>
                <button onClick={() => setShowViews(false)} className="text-white/60 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-y-auto no-scrollbar p-3 space-y-2" style={{ maxHeight: "calc(55vh - 60px)" }}>
                {viewsLoading ? (
                  <div className="flex justify-center py-6">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                ) : viewsList.length === 0 ? (
                  <p className="text-white/40 text-sm text-center py-6">No views yet</p>
                ) : (
                  viewsList.map((v: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 px-1 py-1">
                      <Avatar className="w-8 h-8 border border-white/20">
                        <AvatarImage src={v.user?.avatarUrl || ''} />
                        <AvatarFallback className="bg-white/10 text-white text-xs">
                          {getInitials(v.user?.displayName || '?')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{v.user?.displayName}</p>
                        <p className="text-white/40 text-xs">@{v.user?.username}</p>
                      </div>
                      {v.viewedAt && (
                        <span className="text-white/30 text-xs shrink-0">
                          {new Date(v.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop nav arrows */}
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors hidden md:flex"
          onClick={e => { e.stopPropagation(); goPrev(); }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors hidden md:flex"
          onClick={e => { e.stopPropagation(); goNext(); }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <button className="absolute top-4 right-4 z-40 text-white/60 hover:text-white hidden md:block" onClick={onClose}>
        <X className="w-6 h-6" />
      </button>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/70"
            onClick={e => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 24, stiffness: 340 }}
              className="bg-[#1a1a2e] border border-white/10 rounded-3xl p-6 w-full max-w-xs shadow-2xl"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center">
                  <Trash2 className="w-7 h-7 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Delete this story?</h3>
                  <p className="text-white/50 text-sm mt-1">This action cannot be undone.</p>
                </div>
                <div className="flex gap-3 w-full">
                  <button
                    className="flex-1 py-2.5 rounded-full border border-white/20 text-white/80 text-sm font-semibold hover:bg-white/10 transition-colors"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    className="flex-1 py-2.5 rounded-full bg-red-500 text-white text-sm font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                    onClick={handleDeleteStory}
                    disabled={isDeleting}
                  >
                    {isDeleting
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><Trash2 className="w-4 h-4" />Delete</>
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function StoriesRow() {
  const { data: storyGroups, isLoading, refetch } = useGetActiveStories();
  const { data: me } = useGetMe();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewerGroupIndex, setViewerGroupIndex] = useState<number | null>(null);

  const handleUploadSuccess = () => {
    setUploadOpen(false);
    refetch();
  };

  const openViewer = (groupIndex: number) => setViewerGroupIndex(groupIndex);
  const closeViewer = () => setViewerGroupIndex(null);

  if (isLoading) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto no-scrollbar border-b border-border">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex flex-col items-center gap-1 shrink-0">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="w-12 h-3 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    );
  }

  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : '?';
  const myStoryGroup = storyGroups?.find((g: any) => g.user.username === me?.username);
  const iHaveStory = !!myStoryGroup;

  return (
    <>
      <div className="flex gap-4 p-4 overflow-x-auto no-scrollbar border-b border-border" data-testid="stories-row">
        {/* Add Story */}
        <div
          className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
          data-testid="story-add"
          onClick={() => setUploadOpen(true)}
        >
          <div className="relative w-16 h-16 rounded-full p-[2px] transition-transform group-hover:scale-105 bg-muted border border-border">
            <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-muted flex items-center justify-center">
              <Avatar className="w-full h-full rounded-none">
                <AvatarImage src={me?.avatarUrl || ''} className="object-cover" />
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                  {me?.displayName?.charAt(0)?.toUpperCase() ?? 'Me'}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full border-2 border-background flex items-center justify-center text-primary-foreground">
              <Plus className="w-3 h-3" />
            </div>
          </div>
          <span className="text-xs text-muted-foreground truncate w-16 text-center">Add Story</span>
        </div>

        {/* My Story — only shown when user has active stories */}
        {iHaveStory && myStoryGroup && (
          <div
            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
            data-testid="story-mine"
            onClick={() => setViewerGroupIndex(storyGroups!.findIndex((g: any) => g.user.username === me?.username))}
          >
            <div
              className="relative w-16 h-16 rounded-full p-[2px] transition-transform group-hover:scale-105 bg-gradient-to-tr from-primary to-[#c084fc]"
              style={{ boxShadow: "0 0 14px 4px rgba(192,132,252,0.5), 0 0 28px 6px rgba(236,72,153,0.25)" }}
            >
              <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-muted">
                <Avatar className="w-full h-full rounded-none">
                  <AvatarImage src={me?.avatarUrl || ''} className="object-cover" />
                  <AvatarFallback className="bg-primary/20 text-primary font-semibold">
                    {me?.displayName?.charAt(0)?.toUpperCase() ?? 'Me'}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
            <span className="text-xs text-foreground font-medium truncate w-16 text-center">Your Story</span>
          </div>
        )}

        {/* Other users' stories */}
        {storyGroups?.filter((g: any) => g.user.username !== me?.username).map((group: any, idx: number) => {
          const realIdx = storyGroups!.findIndex((g: any) => g.user.username === group.user.username);
          const hasUnviewed = group.stories.some((s: any) => !(s as any).isViewed);
          return (
            <div
              key={group.user.id}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
              onClick={() => setViewerGroupIndex(realIdx)}
            >
              <div
                className={`relative w-16 h-16 rounded-full p-[2px] transition-transform group-hover:scale-105 ${
                  hasUnviewed
                    ? "bg-gradient-to-tr from-primary to-[#c084fc]"
                    : "bg-muted border border-border"
                }`}
                style={hasUnviewed ? { boxShadow: "0 0 10px 2px rgba(192,132,252,0.4)" } : undefined}
              >
                <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-muted">
                  <Avatar className="w-full h-full rounded-none">
                    <AvatarImage src={group.user.avatarUrl || ''} className="object-cover" />
                    <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                      {getInitials(group.user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-xs text-muted-foreground truncate w-16 text-center">{group.user.username}</span>
            </div>
          );
        })}
      </div>

      {/* Story Viewer */}
      <AnimatePresence>
        {viewerGroupIndex !== null && storyGroups && (
          <StoryViewer
            groups={storyGroups}
            startIndex={viewerGroupIndex}
            onClose={closeViewer}
            onStoryDeleted={() => refetch()}
          />
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <StoryUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSuccess={handleUploadSuccess} />
    </>
  );
}
