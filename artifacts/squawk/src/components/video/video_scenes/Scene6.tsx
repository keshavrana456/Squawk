import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import img1 from "@assets/image_1779535208719.png";
import img2 from "@assets/image_1779537958506.png";
import img3 from "@assets/image_1779538612190.png";
import img4 from "@assets/image_1779538798096.png";

export function Scene6() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 600),
      setTimeout(() => setPhase(3), 1200),
      setTimeout(() => setPhase(4), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const gridImages = [img1, img2, img3, img4, img1, img2];

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center z-10 w-full h-full overflow-hidden pt-[10vh]"
      initial={{ opacity: 0, y: '-100vh' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ scale: 2, opacity: 0 }}
        animate={phase >= 1 ? { scale: 1, opacity: 1 } : { scale: 2, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <h2 className="text-[10vw] font-black text-white leading-none uppercase text-center" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>
          EXPLORE
        </h2>
        <div className="w-[40vw] h-[5vh] mx-auto bg-white/10 rounded-full border border-white/20 mt-[2vh] flex items-center px-[2vw]">
          <span className="text-white/50 text-[1.5vw]">🔍 Search for users, tags, or 10K Squad...</span>
        </div>
      </motion.div>

      {/* Masonry Grid Mockup */}
      <div className="w-[80vw] h-[60vh] mt-[5vh] flex gap-[2vw] justify-center relative">
        
        {/* Left Column */}
        <div className="w-1/3 flex flex-col gap-[2vw] -mt-[5vh]">
          <motion.div 
            className="w-full h-[30vh] bg-purple-900 rounded-[1.5vw] overflow-hidden shadow-xl"
            initial={{ opacity: 0, y: 50 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ type: 'spring', delay: 0.1 }}
          >
            <img src={gridImages[0]} className="w-full h-full object-cover opacity-80" alt="" />
          </motion.div>
          <motion.div 
            className="w-full h-[40vh] bg-pink-900 rounded-[1.5vw] overflow-hidden shadow-xl"
            initial={{ opacity: 0, y: 50 }}
            animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ type: 'spring', delay: 0.4 }}
          >
             <img src={gridImages[1]} className="w-full h-full object-cover opacity-80" alt="" />
          </motion.div>
        </div>

        {/* Center Column */}
        <div className="w-1/3 flex flex-col gap-[2vw]">
          <motion.div 
            className="w-full h-[40vh] bg-blue-900 rounded-[1.5vw] overflow-hidden shadow-xl relative"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={phase >= 2 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', delay: 0.2 }}
          >
             <img src={gridImages[2]} className="w-full h-full object-cover opacity-80" alt="" />
             <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                <span className="text-[3vw] font-bold text-white uppercase tracking-widest" style={{ fontFamily: 'Bebas Neue, sans-serif' }}>Trending</span>
             </div>
          </motion.div>
          <motion.div 
            className="w-full h-[25vh] bg-green-900 rounded-[1.5vw] overflow-hidden shadow-xl"
            initial={{ opacity: 0, y: 50 }}
            animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ type: 'spring', delay: 0.5 }}
          >
            <img src={gridImages[3]} className="w-full h-full object-cover opacity-80" alt="" />
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="w-1/3 flex flex-col gap-[2vw] -mt-[2vh]">
          <motion.div 
            className="w-full h-[25vh] bg-orange-900 rounded-[1.5vw] overflow-hidden shadow-xl"
            initial={{ opacity: 0, y: 50 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ type: 'spring', delay: 0.3 }}
          >
            <img src={gridImages[4]} className="w-full h-full object-cover opacity-80" alt="" />
          </motion.div>
          <motion.div 
            className="w-full h-[35vh] bg-yellow-900 rounded-[1.5vw] overflow-hidden shadow-xl"
            initial={{ opacity: 0, y: 50 }}
            animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ type: 'spring', delay: 0.6 }}
          >
            <img src={gridImages[5]} className="w-full h-full object-cover opacity-80" alt="" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}