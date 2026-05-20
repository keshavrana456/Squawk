import { useState } from "react";
import { Heart, MessageCircle, Play, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { Post } from "@workspace/api-client-react";
import PostCard from "@/components/PostCard";
import { motion, AnimatePresence } from "framer-motion";

interface PostGridProps {
  posts: Post[];
}

export default function PostGrid({ posts }: PostGridProps) {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);

  if (!posts?.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No posts yet.
      </div>
    );
  }

  const selectedPost = selectedIdx !== null ? posts[selectedIdx] : null;

  const goNext = () => setSelectedIdx(i => i !== null && i < posts.length - 1 ? i + 1 : i);
  const goPrev = () => setSelectedIdx(i => i !== null && i > 0 ? i - 1 : i);

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5 md:gap-1">
        {posts.map((post, idx) => (
          <button
            key={post.id}
            onClick={() => setSelectedIdx(idx)}
            className="relative aspect-square bg-muted overflow-hidden group cursor-pointer"
            data-testid={`post-grid-item-${post.id}`}
          >
            {post.mediaType === "video" ? (
              <video
                src={post.mediaUrl}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
              />
            ) : (
              <img
                src={post.thumbnailUrl || post.mediaUrl}
                alt={post.caption || "Post"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}

            {post.mediaType === "video" && (
              <div className="absolute top-2 right-2 text-white drop-shadow-md">
                <Play className="w-4 h-4 fill-white" />
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
              <div className="flex items-center gap-1 font-bold text-sm">
                <Heart className="w-4 h-4 fill-white" />
                <span>{post.likesCount}</span>
              </div>
              <div className="flex items-center gap-1 font-bold text-sm">
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>{post.commentsCount}</span>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Full-screen post modal */}
      <AnimatePresence>
        {selectedPost !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setSelectedIdx(null)}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedIdx(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Prev arrow */}
            {selectedIdx! > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Next arrow */}
            {selectedIdx! < posts.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-3 z-10 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Post card wrapper */}
            <motion.div
              key={selectedPost.id}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl no-scrollbar"
              onClick={e => e.stopPropagation()}
            >
              <PostCard post={selectedPost} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
