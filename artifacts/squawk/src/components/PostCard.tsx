import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, BadgeCheck, Volume2, VolumeX } from "lucide-react";
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
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : '?';
  const avatarColor = `hsl(${post.author.username.length * 50 % 360}, 70%, 50%)`;

  const handleLike = () => {
    if (likeMutation.isPending) return;
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);

    likeMutation.mutate({ id: post.id }, {
      onSuccess: (data) => {
        setIsLiked(data.isLiked);
        setLikesCount(data.likesCount);
        const patchPosts = (posts: any[]) =>
          posts.map((p: any) =>
            p.id === post.id ? { ...p, isLiked: data.isLiked, likesCount: data.likesCount } : p
          );
        queryClient.setQueriesData({ queryKey: ["feed"] }, (old: any) =>
          old?.posts ? { ...old, posts: patchPosts(old.posts) } : old
        );
        queryClient.setQueriesData({ queryKey: getGetFeedQueryKey() }, (old: any) =>
          old?.posts ? { ...old, posts: patchPosts(old.posts) } : old
        );
        queryClient.setQueriesData({ queryKey: getGetUserPostsQueryKey(post.author.username) }, (old: any) =>
          Array.isArray(old) ? patchPosts(old) : old
        );
        queryClient.setQueriesData({ queryKey: getListPostsQueryKey() }, (old: any) =>
          old?.items ? { ...old, items: patchPosts(old.items) } : old
        );
      },
      onError: () => {
        setIsLiked(!newLiked);
        setLikesCount(prev => !newLiked ? prev + 1 : prev - 1);
      },
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

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: post.caption || "Squawk post", url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
      } catch {}
    }
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(m => {
      if (videoRef.current) videoRef.current.muted = !m;
      return !m;
    });
  };

  const renderCaption = (text: string | null, hashtags: string[]) => {
    if (!text) return null;
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
    <div className="bg-card border-b border-border md:border md:rounded-2xl md:mb-6 overflow-hidden max-w-xl mx-auto" data-testid={`post-card-${post.id}`}>
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
              {(post.author as any).isFounder && <BadgeCheck className="w-4 h-4 text-pink-500" title="Founder" />}
              {post.author.isVerified && !((post.author as any).isFounder) && <BadgeCheck className="w-4 h-4 text-primary" />}
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
        className="relative w-full bg-muted overflow-hidden cursor-pointer"
        style={{ aspectRatio: post.mediaType === 'video' ? '9/16' : '4/5', maxHeight: post.mediaType === 'video' ? '75vh' : undefined }}
        onDoubleClick={handleDoubleTap}
        data-testid="post-media"
      >
        {post.mediaType === 'video' ? (
          <>
            <video 
              ref={videoRef}
              src={post.mediaUrl}
              className="w-full h-full object-contain bg-black"
              autoPlay 
              muted={isMuted}
              loop 
              playsInline
            />
            <button
              onClick={handleMuteToggle}
              className="absolute bottom-3 right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </>
        ) : (
          <img 
            src={post.mediaUrl}
            alt={post.caption || "Post media"} 
            className="w-full h-full object-contain bg-black"
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
            <button 
              onClick={handleShare} 
              className="text-foreground transition-colors hover:opacity-70" 
              data-testid="button-share"
              aria-label="Share post"
            >
              <Send className="w-7 h-7" />
            </button>
          </div>
          <button 
            onClick={handleSave} 
            className={`transition-colors hover:opacity-70 ${isSaved ? 'text-primary' : 'text-foreground'}`}
            data-testid="button-save"
          >
            <Bookmark className={`w-7 h-7 ${isSaved ? 'fill-primary' : ''}`} />
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
