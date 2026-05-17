import { Link } from "wouter";
import { Heart, MessageCircle, Play } from "lucide-react";
import type { Post } from "@workspace/api-client-react";

interface PostGridProps {
  posts: Post[];
}

export default function PostGrid({ posts }: PostGridProps) {
  if (!posts?.length) {
    return (
      <div className="text-center p-8 text-muted-foreground dark">
        No posts yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2 dark">
      {posts.map(post => (
        <Link 
          key={post.id} 
          href={`/post/${post.id}`}
          className="relative aspect-square bg-muted overflow-hidden group cursor-pointer"
          data-testid={`post-grid-item-${post.id}`}
        >
          {post.thumbnailUrl || post.mediaType === 'image' ? (
            <img 
              src={(post.thumbnailUrl || post.mediaUrl).startsWith('/api/') ? (post.thumbnailUrl || post.mediaUrl) : (post.thumbnailUrl || post.mediaUrl)} 
              alt={post.caption || "Post"} 
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <video 
              src={post.mediaUrl.startsWith('/api/') ? post.mediaUrl : post.mediaUrl} 
              className="w-full h-full object-cover"
            />
          )}
          
          {post.mediaType === 'video' && (
            <div className="absolute top-2 right-2 text-white drop-shadow-md">
              <Play className="w-5 h-5 fill-white" />
            </div>
          )}
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
            <div className="flex items-center gap-1 font-semibold">
              <Heart className="w-5 h-5 fill-white" />
              <span>{post.likesCount}</span>
            </div>
            <div className="flex items-center gap-1 font-semibold">
              <MessageCircle className="w-5 h-5 fill-white" />
              <span>{post.commentsCount}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
