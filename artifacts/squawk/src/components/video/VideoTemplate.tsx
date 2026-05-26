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
import introBg from "@assets/intro_bg_1779543965947.png";

const SCENE_DURATIONS = { 
  intro: 4500, 
  feed: 4500, 
  flow: 4500, 
  chirps: 4000, 
  messages: 4000,
  explore: 4000,
  nfts: 5500,
  outro: 5000 
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-[100vh] overflow-hidden bg-[#0a0010] text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Persistent Background Layer - Outside AnimatePresence for continuity */}
      <motion.div 
        className="absolute inset-0 z-0 mix-blend-screen pointer-events-none"
        animate={{
          scale: [1.1, 1.2, 1.15, 1.25, 1.1],
          x: ['-2vw', '2vw', '-1vw', '1vw', '0vw'],
          y: ['-1vh', '1vh', '-2vh', '2vh', '0vh'],
          opacity: currentScene === 7 ? 0.8 : 0.4
        }}
        transition={{ duration: 30, ease: 'linear', repeat: Infinity }}
      >
        <img src={introBg} className="w-full h-full object-cover blur-3xl" alt="" />
      </motion.div>

      {/* Persistent Grid & Noise */}
      <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-30 mix-blend-overlay pointer-events-none"></div>
      
      {/* Kinetic Midground Accents */}
      <motion.div
        className="absolute w-[40vw] h-[40vw] rounded-full blur-[100px] pointer-events-none z-0"
        animate={{
          background: currentScene % 2 === 0 ? 'radial-gradient(circle, rgba(236,72,153,0.4) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(147,51,234,0.4) 0%, transparent 70%)',
          x: currentScene === 0 ? '50vw' : currentScene === 3 ? '10vw' : currentScene === 6 ? '70vw' : '40vw',
          y: currentScene === 1 ? '50vh' : currentScene === 4 ? '10vh' : currentScene === 7 ? '60vh' : '30vh',
          scale: currentScene === 6 ? 1.5 : 1,
        }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      />

      <AnimatePresence mode="popLayout" initial={false}>
        {currentScene === 0 && <Scene1 key="intro" />}
        {currentScene === 1 && <Scene2 key="feed" />}
        {currentScene === 2 && <Scene3 key="flow" />}
        {currentScene === 3 && <Scene4 key="chirps" />}
        {currentScene === 4 && <Scene5 key="messages" />}
        {currentScene === 5 && <Scene6 key="explore" />}
        {currentScene === 6 && <Scene7 key="nfts" />}
        {currentScene === 7 && <Scene8 key="outro" />}
      </AnimatePresence>
    </div>
  );
}