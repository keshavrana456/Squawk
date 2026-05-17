import { useState } from "react";
import { Plus } from "lucide-react";
import { useGetActiveStories, type StoryGroup } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

export default function StoriesRow() {
  const { data: storyGroups, isLoading } = useGetActiveStories();
  const [viewingGroup, setViewingGroup] = useState<StoryGroup | null>(null);

  if (isLoading) {
    return (
      <div className="flex gap-4 p-4 overflow-x-auto no-scrollbar border-b border-border dark">
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
      <div className="flex gap-4 p-4 overflow-x-auto no-scrollbar border-b border-border dark" data-testid="stories-row">
        {/* Your Story */}
        <div className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group" data-testid="story-add">
          <div className="relative w-16 h-16 rounded-full p-[2px] bg-border transition-transform group-hover:scale-105">
            <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-muted flex items-center justify-center relative">
              {/* Fallback to generic user if not logged in context, or would use current user */}
              <Avatar className="w-full h-full rounded-none">
                <AvatarFallback className="bg-muted">Me</AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full border-2 border-background flex items-center justify-center text-primary-foreground">
                <Plus className="w-3 h-3" />
              </div>
            </div>
          </div>
          <span className="text-xs text-muted-foreground truncate w-16 text-center">Your Story</span>
        </div>

        {/* Other Stories */}
        {storyGroups?.map(group => {
          const avatarColor = `hsl(${group.user.username.length * 50 % 360}, 70%, 50%)`;
          const hasUnviewed = group.hasUnviewed;
          
          return (
            <div 
              key={group.user.id} 
              className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
              onClick={() => setViewingGroup(group)}
              data-testid={`story-${group.user.username}`}
            >
              <div className={`relative w-16 h-16 rounded-full p-[2px] transition-transform group-hover:scale-105 ${hasUnviewed ? 'bg-gradient-to-tr from-primary to-[#c084fc]' : 'bg-border'}`}>
                <div className="w-full h-full rounded-full border-2 border-background overflow-hidden bg-muted">
                  <Avatar className="w-full h-full rounded-none">
                    <AvatarImage src={group.user.avatarUrl || ''} />
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

      {/* Basic Story Viewer Modal */}
      <AnimatePresence>
        {viewingGroup && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex flex-col"
            onClick={() => setViewingGroup(null)}
          >
            <div className="w-full max-w-md mx-auto h-full relative bg-card flex flex-col" onClick={e => e.stopPropagation()}>
              {/* Progress bars */}
              <div className="absolute top-0 left-0 w-full p-2 flex gap-1 z-20">
                {viewingGroup.stories.map((s, i) => (
                  <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                    <div className="h-full bg-white w-full" />
                  </div>
                ))}
              </div>
              
              {/* Header */}
              <div className="absolute top-4 left-0 w-full p-4 flex items-center gap-2 z-20">
                <Avatar className="w-8 h-8 border border-white/20">
                  <AvatarImage src={viewingGroup.user.avatarUrl || ''} />
                  <AvatarFallback>{getInitials(viewingGroup.user.displayName)}</AvatarFallback>
                </Avatar>
                <span className="text-white font-medium text-shadow">{viewingGroup.user.username}</span>
                <button className="ml-auto text-white/80 p-2" onClick={() => setViewingGroup(null)}>
                  X
                </button>
              </div>

              {/* Media - simple placeholder for just first story for now */}
              <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
                {viewingGroup.stories[0]?.mediaType === 'video' ? (
                  <video src={viewingGroup.stories[0].mediaUrl} autoPlay muted loop className="w-full h-full object-cover" />
                ) : (
                  <img src={viewingGroup.stories[0]?.mediaUrl} className="w-full h-full object-cover" />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
