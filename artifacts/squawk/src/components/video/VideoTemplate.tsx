import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';
import introBg from "@assets/intro_bg_1779543965947.png";

const SCENE_DURATIONS = { 
  intro: 6000, 
  feed: 6000, 
  flow: 7000, 
  chirps: 5000, 
  nfts: 7000,
  outro: 6000 
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  return (
    <div className="relative w-full h-[100vh] overflow-hidden bg-[#0a0010] text-white" style={{ fontFamily: 'Inter, sans-serif' }}>
      
      {/* Persistent Background */}
      <motion.div 
        className="absolute inset-0 z-0 opacity-30 mix-blend-screen"
        animate={{
          scale: [1.1, 1.2, 1.15, 1.25, 1.1],
          x: ['-2%', '2%', '-1%', '1%', '0%'],
          y: ['-1%', '1%', '-2%', '2%', '0%']
        }}
        transition={{ duration: 37, ease: 'linear', repeat: Infinity }}
      >
        <img src={introBg} className="w-full h-full object-cover blur-2xl opacity-50" alt="" />
      </motion.div>

      {/* Grid overlay */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4vw_4vw] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_10%,transparent_100%)]"></div>

      <AnimatePresence mode="sync">
        {currentScene === 0 && <Scene1 key="intro" />}
        {currentScene === 1 && <Scene2 key="feed" />}
        {currentScene === 2 && <Scene3 key="flow" />}
        {currentScene === 3 && <Scene4 key="chirps" />}
        {currentScene === 4 && <Scene5 key="nfts" />}
        {currentScene === 5 && <Scene6 key="outro" />}
      </AnimatePresence>
    </div>
  );
}