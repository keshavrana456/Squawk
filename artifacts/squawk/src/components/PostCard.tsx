import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, BadgeCheck, Play } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { 
  useLikePost, 
  useSavePost,
  getGetFeedQueryKey,
  getGetUserPostsQueryKey,
  getListPostsQueryKey,
  type Post
} from "@workspace/api-client-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface PostCardProps {
  post: Post;
  onLike?: () => void;
  onSave?: () => void;
  onComment?: () => void;
}

export default function PostCard({ post, onLike, onSave, onComment }: PostCardProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const likeMutation = useLikePost();
  const saveMutation = useSavePost();
  
  const [showHeart, setShowHeart] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isSaved, setIsSaved] = useState(post.isSaved);

  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : '?';
  const avatarColor = `hsl(${post.author.username.length * 50 % 360}, 70%, 50%)`;

  const handleLike = () => {
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    
    likeMutation.mutate({ id: post.id }, {
      onError: () => {
        setIsLiked(!newLiked);
        setLikesCount(prev => !newLiked ? prev + 1 : prev - 1);
      }
    });
    
    if (onLike) onLike();
  };

  const handleSave = () => {
    const newSaved = !isSaved;
    setIsSaved(newSaved);
    
    saveMutation.mutate({ id: post.id }, {
      onError: () => setIsSaved(!newSaved)
    });
    
    if (onSave) onSave();
  };

  const handleDoubleTap = () => {
    if (!isLiked) handleLike();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 1000);
  };

  const renderCaption = (text: string | null, hashtags: string[]) => {
    if (!text) return null;
    let renderedText = text;
    
    // Simple regex to find hashtags and make them bold, but since we have an array of hashtags,
    // we can just append them if they aren't in the text, or we can just render the text and hashtags below
    return (
      <div className="text-sm mt-2">
        <span className="font-semibold mr-2">{post.author.username}</span>
        {text}
        {hashtags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {hashtags.map(tag => (
              <Link key={tag} href={`/explore/hashtags/${tag}`} className="text-primary hover:underline" data-testid={`link-hashtag-${tag}`}>
                #{tag}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-card border-b border-border md:border md:rounded-2xl md:mb-6 overflow-hidden max-w-xl mx-auto dark" data-testid={`post-card-${post.id}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3 group" data-testid={`link-author-${post.author.username}`}>
          <Avatar className="w-10 h-10 border border-border group-hover:border-primary transition-colors">
            <AvatarImage src={post.author.avatarUrl || ''} />
            <AvatarFallback style={{ backgroundColor: avatarColor, color: 'white' }}>
              {getInitials(post.author.displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{post.author.username}</span>
              {post.author.isVerified && <BadgeCheck className="w-4 h-4 text-primary" />}
            </div>
            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(post.createdAt))} ago</span>
          </div>
        </Link>
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </div>

      {/* Media */}
      <div 
        className="relative w-full bg-black aspect-[4/5] flex items-center justify-center overflow-hidden cursor-pointer"
        onDoubleClick={handleDoubleTap}
        data-testid="post-media"
      >
        {post.mediaType === 'video' ? (
          <video 
            src={post.mediaUrl.startsWith('/api/') ? post.mediaUrl : post.mediaUrl} 
            className="w-full h-full object-cover"
            autoPlay 
            muted 
            loop 
            playsInline
          />
        ) : (
          <img 
            src={post.mediaUrl.startsWith('/api/') ? post.mediaUrl : post.mediaUrl} 
            alt={post.caption || "Post media"} 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        )}
        
        <AnimatePresence>
          {showHeart && (
            <motion.div 
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
            >
              <Heart className="w-32 h-32 text-primary fill-primary drop-shadow-[0_0_20px_rgba(124,58,237,0.5)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleLike} 
              className={`transition-colors hover:opacity-70 ${isLiked ? 'text-primary' : 'text-foreground'}`}
              data-testid="button-like"
            >
              <Heart className={`w-7 h-7 ${isLiked ? 'fill-primary' : ''}`} />
            </button>
            <button 
              onClick={() => { if(onComment) onComment(); else setLocation(`/post/${post.id}`); }} 
              className="text-foreground transition-colors hover:opacity-70"
              data-testid="button-comment"
            >
              <MessageCircle className="w-7 h-7" />
            </button>
            <button className="text-foreground transition-colors hover:opacity-70" data-testid="button-share">
              <Send className="w-7 h-7" />
            </button>
          </div>
          <button 
            onClick={handleSave} 
            className={`transition-colors hover:opacity-70 ${isSaved ? 'text-foreground' : 'text-foreground'}`}
            data-testid="button-save"
          >
            <Bookmark className={`w-7 h-7 ${isSaved ? 'fill-foreground' : ''}`} />
          </button>
        </div>

        <div className="font-semibold text-sm mb-1">
          {likesCount} likes
        </div>

        {renderCaption(post.caption, post.hashtags)}

        {post.commentsCount > 0 && (
          <Link href={`/post/${post.id}`} className="text-sm text-muted-foreground mt-2 inline-block hover:underline" data-testid="link-comments">
            View all {post.commentsCount} comments
          </Link>
        )}
      </div>
    </div>
  );
}
