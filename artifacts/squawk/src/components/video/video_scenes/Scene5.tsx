import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import gamingOwl from "@assets/image_1779878309038.png";
import braceletHand from "@assets/image_1779878321888.png";
import labOwls from "@assets/image_1779878351944.png";

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const posts = [gamingOwl, braceletHand, labOwls];

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, y: '50vh' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, filter: 'blur(20px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div 
        className="absolute top-[8vh] z-30"
        initial={{ y: -50, opacity: 0 }}
        animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: -50, opacity: 0 }}
      >
        <h2 className="text-[6vw] font-bold text-white uppercase tracking-widest text-center shadow-black drop-shadow-xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          Create. Share. <span className="text-purple-500">Dominate.</span>
        </h2>
      </motion.div>

      <div className="flex gap-[3vw] mt-[10vh] z-20">
        {posts.map((img, i) => (
          <motion.div
            key={i}
            className="w-[25vw] h-[35vw] bg-black/50 border border-purple-500/40 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(147,51,234,0.3)] flex flex-col"
            initial={{ y: 200, opacity: 0, rotate: i === 1 ? 0 : i === 0 ? -10 : 10 }}
            animate={phase >= 1 ? { y: i === 1 ? -20 : 0, opacity: 1, rotate: i === 1 ? 0 : i === 0 ? -5 : 5 } : {}}
            transition={{ type: 'spring', stiffness: 100, damping: 15, delay: i * 0.2 }}
          >
            <div className="w-full h-[70%]">
              <img src={img} className="w-full h-full object-cover" alt="Post" />
            </div>
            <div className="p-[1.5vw] flex flex-col justify-between flex-grow">
              <div className="w-full h-[1vw] bg-white/20 rounded-full mb-[1vw]" />
              <div className="w-3/4 h-[1vw] bg-white/10 rounded-full" />
              <div className="flex justify-between items-center mt-auto">
                 <div className="flex gap-[0.5vw]"><span className="text-pink-500 text-[1.2vw]">❤️</span><span className="text-[1vw] text-white">10K</span></div>
                 <span className="text-white/40 text-[1vw]">Share</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
