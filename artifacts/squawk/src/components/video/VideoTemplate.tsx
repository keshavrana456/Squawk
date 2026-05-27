import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';
import { Scene7 } from './video_scenes/Scene7';
import { Scene8 } from './video_scenes/Scene8';
import { useEffect } from 'react';

const SCENE_DURATIONS = { 
  intro: 5000, 
  nft_showcase: 5500, 
  live_feed: 5000, 
  flow_video: 5000, 
  posts: 5000,
  contests: 5000,
  features: 4500,
  outro: 5000 
};

function ParticleField() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen opacity-60">
      {Array.from({ length: 40 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            width: Math.random() * 4 + 1 + 'px',
            height: Math.random() * 4 + 1 + 'px',
            left: Math.random() * 100 + 'vw',
            top: Math.random() * 100 + 'vh',
            filter: 'blur(1px)',
            boxShadow: '0 0 8px 2px rgba(236,72,153,0.5)'
          }}
          animate={{
            y: [0, -100, -200],
            x: [0, Math.random() * 50 - 25, Math.random() * 100 - 50],
            opacity: [0, Math.random() * 0.5 + 0.3, 0],
          }}
          transition={{
            duration: Math.random() * 5 + 5,
            repeat: Infinity,
            ease: 'linear',
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
}

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  return (
    <div className="relative w-full h-[100vh] overflow-hidden bg-[#0a0010] text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Persistent Background Layer */}
      <motion.div 
        className="absolute inset-0 z-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(circle at 50% 50%, #1a0030 0%, #0d0018 100%)',
            'radial-gradient(circle at 60% 40%, #1a0030 0%, #0d0018 100%)',
            'radial-gradient(circle at 40% 60%, #1a0030 0%, #0d0018 100%)',
          ][currentScene % 3]
        }}
        transition={{ duration: 4, ease: 'easeInOut' }}
      />

      <ParticleField />
      
      {/* Persistent Grid & Noise */}
      <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-[0.15] mix-blend-overlay pointer-events-none"></div>
      
      {/* Kinetic Midground Accents */}
      <motion.div
        className="absolute w-[50vw] h-[50vw] rounded-full blur-[120px] pointer-events-none z-0"
        animate={{
          background: currentScene % 2 === 0 ? 'radial-gradient(circle, rgba(236,72,153,0.3) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(6,182,212,0.3) 0%, transparent 70%)',
          x: ['20vw', '60vw', '10vw', '70vw', '30vw', '80vw', '20vw', '50vw'][currentScene],
          y: ['30vh', '10vh', '60vh', '20vh', '50vh', '30vh', '70vh', '40vh'][currentScene],
          scale: [1, 1.2, 0.8, 1.5, 1, 1.3, 0.9, 1.4][currentScene],
        }}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
      />

      <AnimatePresence mode="popLayout" initial={false}>
        {currentScene === 0 && <Scene1 key="intro" />}
        {currentScene === 1 && <Scene2 key="nft" />}
        {currentScene === 2 && <Scene3 key="feed" />}
        {currentScene === 3 && <Scene4 key="flow" />}
        {currentScene === 4 && <Scene5 key="posts" />}
        {currentScene === 5 && <Scene6 key="contests" />}
        {currentScene === 6 && <Scene7 key="features" />}
        {currentScene === 7 && <Scene8 key="outro" />}
      </AnimatePresence>
    </div>
  );
}
