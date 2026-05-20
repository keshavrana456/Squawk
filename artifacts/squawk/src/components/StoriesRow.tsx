import { useState, useRef, useEffect, useCallback } from "react";
import { Plus, X, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useGetActiveStories,
  useGetMe,
  useViewStory,
  type StoryGroup,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import StoryUploadModal from "./StoryUploadModal";

const IMAGE_DURATION = 5000; // 5s per image story

// ─── Story Viewer ─────────────────────────────────────────────────────────────
function StoryViewer({ groups, startIndex, onClose }: { groups: StoryGroup[]; startIndex: number; onClose: () => void }) {
  const [groupIndex, setGroupIndex] = useState(startIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const markViewed = useViewStory();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentGroup = groups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const isVideo = currentStory?.mediaType === "video";
  const duration = isVideo ? (videoRef.current?.duration ? videoRef.current.duration * 1000 : 15000) : IMAGE_DURATION;
  const TICK = 50;

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

  // Track views
  useEffect(() => {
    if (currentStory) {
      markViewed.mutate({ id: currentStory.id });
    }
  }, [currentStory?.id]);

  // Progress timer (skip for video — driven by video events)
  useEffect(() => {
    if (isVideo) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(0);
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(intervalRef.current!); goNext(); return 100; }
        return p + (TICK / IMAGE_DURATION) * 100;
      });
    }, TICK);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [storyIndex, groupIndex, isVideo]);

  // Video progress
  const handleVideoTimeUpdate = () => {
    const v = videoRef.current;
    if (v && v.duration) setProgress((v.currentTime / v.duration) * 100);
  };
  const handleVideoEnded = () => goNext();

  if (!currentGroup || !currentStory) return null;

  const getInitials = (n: string) => n ? n.charAt(0).toUpperCase() : '?';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm h-full max-h-[100dvh] md:max-h-[680px] md:rounded-2xl overflow-hidden bg-black flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
          {currentGroup.stories.map((s, i) => (
            <div key={s.id} className="flex-1 h-[3px] bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{ width: i < storyIndex ? '100%' : i === storyIndex ? `${progress}%` : '0%' }}
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
          <button className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media */}
        <div className="flex-1 relative">
          {isVideo ? (
            <video
              ref={videoRef}
              key={currentStory.id}
              src={currentStory.mediaUrl}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              playsInline
              muted={false}
              onTimeUpdate={handleVideoTimeUpdate}
              onEnded={handleVideoEnded}
              onLoadedMetadata={() => setProgress(0)}
            />
          ) : (
            <img
              key={currentStory.id}
              src={currentStory.mediaUrl}
              className="absolute inset-0 w-full h-full object-cover"
              alt=""
            />
          )}

          {/* Tap zones */}
          <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={e => { e.stopPropagation(); goPrev(); }} />
          <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={e => { e.stopPropagation(); goNext(); }} />
        </div>

        {/* Nav arrows (desktop) */}
        <button
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors hidden md:flex"
          onClick={goPrev}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-9 h-9 bg-black/40 rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors hidden md:flex"
          onClick={goNext}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Close outside on desktop */}
      <button className="absolute top-4 right-4 z-40 text-white/60 hover:text-white hidden md:block" onClick={onClose}>
        <X className="w-6 h-6" />
      </button>
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

  return (
    <>
      <div className="flex gap-4 p-4 overflow-x-auto no-scrollbar border-b border-border" data-testid="stories-row">
        {/* Your Story */}
        <div
          className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
          data-testid="story-add"
          onClick={() => setUploadOpen(true)}
        >
          <div className="relative w-16 h-16 rounded-full p-[2px] bg-border transition-transform group-hover:scale-105">
            <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-muted flex items-center justify-center relative">
              <Avatar className="w-full h-full rounded-none">
                <AvatarImage src={me?.avatarUrl || ''} className="object-cover" />
                <AvatarFallback className="bg-muted text-muted-foreground font-semibold">
                  {me?.displayName?.charAt(0)?.toUpperCase() ?? 'Me'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full border-2 border-background flex items-center justify-center text-primary-foreground">
                <Plus className="w-3 h-3" />
              </div>
            </div>
          </div>
          <span className="text-xs text-muted-foreground truncate w-16 text-center">Your Story</span>
        </div>

        {/* Other Stories */}
        {storyGroups?.map((group, idx) => {
          const avatarColor = `hsl(${group.user.username.length * 50 % 360}, 70%, 50%)`;
          const hasUnviewed = group.hasUnviewed;

          return (
            <div
              key={group.user.id}
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
              onClick={() => openViewer(idx)}
              data-testid={`story-${group.user.username}`}
            >
              <div
                className={`relative w-16 h-16 rounded-full p-[2px] transition-all group-hover:scale-105 ${hasUnviewed ? 'bg-gradient-to-tr from-primary to-[#c084fc]' : 'bg-gradient-to-tr from-primary/25 to-[#c084fc]/25'}`}
                style={hasUnviewed ? { boxShadow: '0 0 14px 3px rgba(192,132,252,0.55)' } : undefined}
              >
                <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-muted">
                  <Avatar className="w-full h-full rounded-none">
                    <AvatarImage src={group.user.avatarUrl || ''} className="object-cover" />
                    <AvatarFallback style={{ backgroundColor: avatarColor, color: 'white' }}>
                      {getInitials(group.user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>
              <span className="text-xs text-foreground truncate w-16 text-center">{group.user.username}</span>
            </div>
          );
        })}
      </div>

      <StoryUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSuccess={handleUploadSuccess} />

      <AnimatePresence>
        {viewerGroupIndex !== null && storyGroups && storyGroups.length > 0 && (
          <StoryViewer
            groups={storyGroups}
            startIndex={viewerGroupIndex}
            onClose={closeViewer}
          />
        )}
      </AnimatePresence>
    </>
  );
}
