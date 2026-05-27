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
  scene1: 10000, 
  scene2: 12000, 
  scene3: 8000, 
  scene4: 12000, 
  scene5: 10000, 
  scene6: 10000,
  scene7: 8000,
  scene8: 10000
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({ durations: SCENE_DURATIONS });

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Syncopate:wght@400;600;700&display=swap';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  return (
    <div className="relative w-full h-[100vh] overflow-hidden bg-[#0e0723] text-white font-sans select-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
      {/* Persistent Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <motion.div 
          className="absolute w-[80vw] h-[80vw] rounded-full blur-[120px] mix-blend-screen"
          style={{ background: 'radial-gradient(circle, rgba(244,114,182,0.15), transparent 60%)' }}
          animate={{ 
            x: ['-20%', '60%', '-10%', '-20%'], 
            y: ['-10%', '30%', '50%', '-10%'],
            scale: [1, 1.2, 0.9, 1]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} 
        />
        <motion.div 
          className="absolute w-[90vw] h-[90vw] rounded-full blur-[150px] mix-blend-screen right-0 bottom-0"
          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.1), transparent 60%)' }}
          animate={{ 
            x: ['20%', '-40%', '10%', '20%'], 
            y: ['10%', '-50%', '30%', '10%'],
            scale: [1.1, 0.8, 1.3, 1.1]
          }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} 
        />
      </div>

      <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-[0.2] mix-blend-overlay pointer-events-none"></div>

      {/* Midground Persistent Elements */}
      <motion.div
        className="absolute w-[2px] bg-gradient-to-b from-transparent via-[#f472b6] to-transparent pointer-events-none z-0"
        animate={{
          left: ['10vw', '85vw', '30vw', '70vw', '20vw', '80vw', '50vw', '15vw'][currentScene],
          height: ['30vh', '80vh', '40vh', '100vh', '60vh', '20vh', '90vh', '50vh'][currentScene],
          top: ['10vh', '5vh', '40vh', '0vh', '20vh', '60vh', '5vh', '25vh'][currentScene],
          opacity: currentScene === 7 ? 0 : 0.4
        }}
        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
      />
      
      <motion.div
        className="absolute h-[2px] bg-gradient-to-r from-transparent via-[#8b5cf6] to-transparent pointer-events-none z-0"
        animate={{
          top: ['80vh', '20vh', '70vh', '15vh', '85vh', '30vh', '10vh', '90vh'][currentScene],
          width: ['40vw', '90vw', '30vw', '60vw', '80vw', '20vw', '70vw', '50vw'][currentScene],
          left: ['10vw', '5vw', '50vw', '20vw', '10vw', '60vw', '15vw', '25vw'][currentScene],
          opacity: currentScene === 7 ? 0 : 0.3
        }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
      />

      <AnimatePresence mode="sync">
        {currentScene === 0 && <Scene1 key="s1" />}
        {currentScene === 1 && <Scene2 key="s2" />}
        {currentScene === 2 && <Scene3 key="s3" />}
        {currentScene === 3 && <Scene4 key="s4" />}
        {currentScene === 4 && <Scene5 key="s5" />}
        {currentScene === 5 && <Scene6 key="s6" />}
        {currentScene === 6 && <Scene7 key="s7" />}
        {currentScene === 7 && <Scene8 key="s8" />}
      </AnimatePresence>
    </div>
  );
}
