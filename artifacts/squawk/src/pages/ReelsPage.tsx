import { useEffect, useRef, useState } from "react";
import { useListPosts, useLikePost, useSavePost, useGetMe, type Post } from "@workspace/api-client-react";
import { Heart, MessageCircle, Bookmark, Volume2, VolumeX, MoreHorizontal } from "lucide-react";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

const DEMO_VIDEOS = [
  {
    id: -1, mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    mediaType: "video", caption: "Fire vibes only 🔥 #squad #vibes #10ksquad",
    hashtags: ["squad", "vibes", "10ksquad"], likesCount: 1842, commentsCount: 94,
    isLiked: false, isSaved: false, viewsCount: 12400,
    author: { id: -1, username: "squad_official", displayName: "SQUAD Official", avatarUrl: "", isVerified: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: -2, mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    mediaType: "video", caption: "Escape the ordinary ✨ #flow #nft #art",
    hashtags: ["flow", "nft", "art"], likesCount: 3210, commentsCount: 155,
    isLiked: false, isSaved: false, viewsCount: 28900,
    author: { id: -2, username: "pixel_phoenix", displayName: "Pixel Phoenix", avatarUrl: "", isVerified: false },
    createdAt: new Date().toISOString(),
  },
  {
    id: -3, mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    mediaType: "video", caption: "Having too much fun with the crew 😂🎉 #fun #squadgoals",
    hashtags: ["fun", "squadgoals"], likesCount: 5670, commentsCount: 312,
    isLiked: false, isSaved: false, viewsCount: 54300,
    author: { id: -3, username: "neon_cult", displayName: "Neon Cult", avatarUrl: "", isVerified: true },
    createdAt: new Date().toISOString(),
  },
  {
    id: -4, mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    mediaType: "video", caption: "Joy ride season 🚗💨 #joyride #culture",
    hashtags: ["joyride", "culture"], likesCount: 2890, commentsCount: 87,
    isLiked: false, isSaved: false, viewsCount: 31200,
    author: { id: -4, username: "drift_mode", displayName: "Drift Mode", avatarUrl: "", isVerified: false },
    createdAt: new Date().toISOString(),
  },
  {
    id: -5, mediaUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    mediaType: "video", caption: "When the beat drops 🎵🔥 #music #vibes #squawk",
    hashtags: ["music", "vibes", "squawk"], likesCount: 7340, commentsCount: 441,
    isLiked: false, isSaved: false, viewsCount: 89100,
    author: { id: -5, username: "bass_theory", displayName: "Bass Theory", avatarUrl: "", isVerified: true },
    createdAt: new Date().toISOString(),
  },
];

export default function ReelsPage() {
  const { data: postsData } = useListPosts();
  const rawPosts = (postsData as any)?.items || [];
  const videoPosts = rawPosts.filter((p: Post) => p.mediaType === "video");
  const reels = videoPosts.length > 0
    ? [...videoPosts, ...DEMO_VIDEOS]
    : [...DEMO_VIDEOS, ...rawPosts.slice(0, 3)];

  const [muted, setMuted] = useState(true);

  if (!reels.length) return (
    <div className="flex items-center justify-center h-full min-h-screen bg-black">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[100dvh] w-full bg-black snap-y snap-mandatory overflow-y-auto no-scrollbar">
      {reels.map((post: any) => (
        <Reel key={post.id} post={post} muted={muted} setMuted={setMuted} />
      ))}
    </motion.div>
  );
}

function Reel({ post, muted, setMuted }: { post: any; muted: boolean; setMuted: (m: boolean) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const likeMutation = useLikePost();
  const saveMutation = useSavePost();
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isSaved, setIsSaved] = useState(post.isSaved);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) videoRef.current?.play().catch(() => {});
        else videoRef.current?.pause();
      },
      { threshold: 0.6 }
    );
    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  const handleLike = () => {
    if (post.id < 0) { setIsLiked(!isLiked); setLikesCount((p: number) => isLiked ? p - 1 : p + 1); return; }
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount((prev: number) => newLiked ? prev + 1 : prev - 1);
    likeMutation.mutate({ id: post.id }, { onError: () => { setIsLiked(!newLiked); setLikesCount((prev: number) => !newLiked ? prev + 1 : prev - 1); } });
  };

  const handleSave = () => {
    if (post.id < 0) { setIsSaved(!isSaved); return; }
    setIsSaved(!isSaved);
    saveMutation.mutate({ id: post.id });
  };

  const getInitials = (n: string) => n ? n.charAt(0).toUpperCase() : "?";

  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

  return (
    <div className="h-[100dvh] w-full snap-start relative flex items-center justify-center bg-black">
      {post.mediaType === "video" ? (
        <video
          ref={videoRef}
          src={post.mediaUrl}
          className="w-full h-full object-cover md:w-auto md:max-w-lg"
          loop muted={muted} playsInline
          onClick={() => videoRef.current?.paused ? videoRef.current.play() : videoRef.current?.pause()}
        />
      ) : (
        <img src={post.mediaUrl} className="w-full h-full object-cover md:w-auto md:max-w-lg" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 md:max-w-lg md:mx-auto bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

      <div className="absolute inset-0 md:max-w-lg md:mx-auto pointer-events-none flex flex-col justify-between p-4 pb-20 md:pb-6">
        <div className="flex justify-end pointer-events-auto mt-4 md:mt-0">
          <button onClick={() => setMuted(!muted)} className="p-3 btn-water rounded-full text-white">
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        <div className="flex items-end justify-between pointer-events-auto">
          <div className="flex-1 pr-12 text-white drop-shadow-lg">
            <Link href={post.id > 0 ? `/profile/${post.author.username}` : "#"} className="flex items-center gap-3 mb-4 w-fit">
              <Avatar className="w-12 h-12 border-2 border-white/30">
                <AvatarImage src={post.author.avatarUrl || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">{getInitials(post.author.displayName)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-bold text-base">{post.author.username}</div>
                {post.author.isVerified && <span className="text-[11px] text-primary font-semibold">✓ Verified</span>}
              </div>
            </Link>
            <p className="text-[15px] line-clamp-2 leading-snug">{post.caption}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {post.hashtags?.map((tag: string) => (
                <span key={tag} className="text-sm text-primary font-semibold">#{tag}</span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-5 pb-4">
            <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
              <div className="p-3.5 btn-water rounded-full">
                <Heart className={`w-7 h-7 transition-all ${isLiked ? "fill-primary text-primary scale-110" : "text-white"}`} />
              </div>
              <span className="text-white text-xs font-bold">{fmt(likesCount)}</span>
            </button>
            {post.id > 0 ? (
              <Link href={`/post/${post.id}`}>
                <button className="flex flex-col items-center gap-1 group">
                  <div className="p-3.5 btn-water rounded-full">
                    <MessageCircle className="w-7 h-7 text-white" />
                  </div>
                  <span className="text-white text-xs font-bold">{post.commentsCount}</span>
                </button>
              </Link>
            ) : (
              <button className="flex flex-col items-center gap-1 group">
                <div className="p-3.5 btn-water rounded-full">
                  <MessageCircle className="w-7 h-7 text-white" />
                </div>
                <span className="text-white text-xs font-bold">{post.commentsCount}</span>
              </button>
            )}
            <button onClick={handleSave} className="flex flex-col items-center gap-1 group">
              <div className="p-3.5 btn-water rounded-full">
                <Bookmark className={`w-7 h-7 ${isSaved ? "fill-white text-white" : "text-white"}`} />
              </div>
            </button>
            <button className="p-3.5 btn-water rounded-full">
              <MoreHorizontal className="w-7 h-7 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
