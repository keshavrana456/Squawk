import { useEffect, useRef, useState } from "react";
import { useListPosts, useLikePost, useSavePost, type Post } from "@workspace/api-client-react";
import { Heart, MessageCircle, Bookmark, Volume2, VolumeX, MoreHorizontal } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

export default function ReelsPage() {
  const { data: postsData } = useListPosts();
  const posts = (postsData as any)?.items || [];
  
  const [muted, setMuted] = useState(true);

  if (!posts.length) return (
    <div className="flex items-center justify-center h-full min-h-screen bg-black dark">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[100dvh] w-full bg-black snap-y snap-mandatory overflow-y-auto no-scrollbar dark">
      {posts.map((post: Post) => (
        <Reel key={post.id} post={post} muted={muted} setMuted={setMuted} />
      ))}
    </motion.div>
  );
}

function Reel({ post, muted, setMuted }: { post: Post, muted: boolean, setMuted: (m: boolean) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const likeMutation = useLikePost();
  const saveMutation = useSavePost();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.6 }
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

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
  };

  const getInitials = (n: string) => n ? n.charAt(0).toUpperCase() : '?';

  return (
    <div className="h-[100dvh] w-full snap-start relative flex items-center justify-center bg-black">
      {post.mediaType === 'video' ? (
        <video
          ref={videoRef}
          src={post.mediaUrl.startsWith('/api/') ? post.mediaUrl : post.mediaUrl}
          className="w-full h-full object-cover md:w-auto md:max-w-lg"
          loop
          muted={muted}
          playsInline
          onClick={() => {
            if (videoRef.current?.paused) videoRef.current.play();
            else videoRef.current?.pause();
          }}
        />
      ) : (
        <img 
          src={post.mediaUrl.startsWith('/api/') ? post.mediaUrl : post.mediaUrl}
          className="w-full h-full object-cover md:w-auto md:max-w-lg"
        />
      )}
      
      {/* Overlay */}
      <div className="absolute inset-0 md:max-w-lg md:mx-auto pointer-events-none flex flex-col justify-between p-4 pb-20 md:pb-6">
        {/* Top Right */}
        <div className="flex justify-end pointer-events-auto mt-4 md:mt-0">
          <button onClick={() => setMuted(!muted)} className="p-3 bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition-colors">
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Bottom Area */}
        <div className="flex items-end justify-between pointer-events-auto">
          {/* Info */}
          <div className="flex-1 pr-12 text-white drop-shadow-lg">
            <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3 mb-4 w-fit">
              <Avatar className="w-12 h-12 border-2 border-white/20">
                <AvatarImage src={post.author.avatarUrl || ''} />
                <AvatarFallback className="bg-primary">{getInitials(post.author.displayName)}</AvatarFallback>
              </Avatar>
              <span className="font-bold text-lg">{post.author.username}</span>
            </Link>
            <p className="text-[15px] line-clamp-2 leading-tight">{post.caption}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-primary font-medium">
              {post.hashtags?.map(tag => (
                <span key={tag}>#{tag}</span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-5 pb-4">
            <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
              <div className="p-3.5 bg-black/40 rounded-full group-hover:bg-black/60 transition-colors backdrop-blur-md">
                <Heart className={`w-7 h-7 ${isLiked ? 'fill-primary text-primary' : 'text-white'}`} />
              </div>
              <span className="text-white text-sm font-semibold">{likesCount}</span>
            </button>
            <Link href={`/post/${post.id}`}>
              <button className="flex flex-col items-center gap-1 group">
                <div className="p-3.5 bg-black/40 rounded-full group-hover:bg-black/60 transition-colors backdrop-blur-md">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <span className="text-white text-sm font-semibold">{post.commentsCount}</span>
              </button>
            </Link>
            <button onClick={() => saveMutation.mutate({ id: post.id })} className="flex flex-col items-center gap-1 group">
              <div className="p-3.5 bg-black/40 rounded-full group-hover:bg-black/60 transition-colors backdrop-blur-md">
                <Bookmark className={`w-7 h-7 ${post.isSaved ? 'fill-white text-white' : 'text-white'}`} />
              </div>
            </button>
            <button className="p-3.5 bg-black/40 rounded-full hover:bg-black/60 transition-colors backdrop-blur-md">
              <MoreHorizontal className="w-7 h-7 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
