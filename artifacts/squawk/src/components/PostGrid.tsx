import { Heart, MessageCircle, Play } from "lucide-react";
import type { Post } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface PostGridProps {
  posts: Post[];
}

export default function PostGrid({ posts }: PostGridProps) {
  const [, navigate] = useLocation();

  if (!posts?.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No posts yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-0.5 md:gap-1">
      {posts.map((post) => (
        <button
          key={post.id}
          onClick={() => navigate(`/post/${post.id}`)}
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
  );
}
