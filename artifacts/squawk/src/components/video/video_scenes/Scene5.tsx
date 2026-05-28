import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import gamerBird from "@assets/image_1780004756525.png";
import bracelet from "@assets/image_1780004763558.png";
import purpleBird from "@assets/image_1780004774314.png";

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const posts = [gamerBird, bracelet, purpleBird];

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, y: '50vh' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="absolute top-[10vh] z-30"
        initial={{ y: -50, opacity: 0 }}
        animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: -50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <h2 className="text-[7vw] font-bold text-white uppercase tracking-widest text-center shadow-black drop-shadow-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          POSTS & <span className="text-[#7c3aed]">STORIES</span>
        </h2>
      </motion.div>

      <div className="flex gap-[4vw] mt-[12vh] z-20">
        {posts.map((img, i) => (
          <motion.div
            key={i}
            className="w-[26vw] h-[38vw] bg-black/60 backdrop-blur-md border border-[#7c3aed]/40 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(124,58,237,0.2)] flex flex-col"
            initial={{ y: 200, opacity: 0, rotate: i === 1 ? 0 : i === 0 ? -12 : 12 }}
            animate={phase >= 1 ? { y: i === 1 ? -30 : 0, opacity: 1, rotate: i === 1 ? 0 : i === 0 ? -8 : 8 } : {}}
            transition={{ type: 'spring', stiffness: 90, damping: 15, delay: i * 0.2 }}
          >
            <div className="w-full h-[75%] relative overflow-hidden">
              <img src={img} className="w-full h-full object-cover" alt="Post" />
            </div>
            <div className="p-[2vw] flex flex-col justify-between flex-grow bg-gradient-to-t from-black to-black/40">
              <div className="flex items-center gap-[1vw] mb-[1.5vw]">
                <div className="w-[3vw] h-[3vw] rounded-full bg-gradient-to-tr from-[#ff2d92] to-[#7c3aed]" />
                <div className="flex flex-col gap-[0.5vw]">
                  <div className="w-[8vw] h-[1vw] bg-white/40 rounded-full" />
                  <div className="w-[4vw] h-[0.8vw] bg-white/20 rounded-full" />
                </div>
              </div>
              <div className="flex justify-between items-center mt-auto">
                 <div className="flex gap-[1vw]">
                   <span className="text-[#ff2d92] text-[1.5vw]">❤️</span>
                   <span className="text-white/60 text-[1.5vw]">💬</span>
                 </div>
                 <span className="text-[#00b4ff] text-[1.2vw] font-bold">SHARE</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}