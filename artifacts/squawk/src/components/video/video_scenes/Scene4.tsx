import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import partyVideo from "@assets/party_1779878150807.mp4";

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ scale: 1.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <video 
        src={`${import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : ''}${partyVideo}`}
        autoPlay 
        loop 
        muted 
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-60"
      />
      
      <div className="absolute inset-0 bg-gradient-to-t from-[#0d0018]/90 via-[#0d0018]/20 to-transparent" />

      {/* Reel Interface Overlay */}
      <motion.div 
        className="absolute right-[5vw] bottom-[10vh] flex flex-col gap-[2vh] items-center"
        initial={{ x: 100, opacity: 0 }}
        animate={phase >= 1 ? { x: 0, opacity: 1 } : { x: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 100 }}
      >
        <div className="w-[4vw] h-[4vw] bg-white/20 backdrop-blur-md rounded-full flex flex-col items-center justify-center border border-white/30 text-white">
          <span className="text-[1.5vw]">❤️</span>
          <span className="text-[0.8vw] font-bold mt-1">24K</span>
        </div>
        <div className="w-[4vw] h-[4vw] bg-white/20 backdrop-blur-md rounded-full flex flex-col items-center justify-center border border-white/30 text-white">
          <span className="text-[1.5vw]">💬</span>
          <span className="text-[0.8vw] font-bold mt-1">1.2K</span>
        </div>
        <div className="w-[4vw] h-[4vw] bg-white/20 backdrop-blur-md rounded-full flex flex-col items-center justify-center border border-white/30 text-white">
          <span className="text-[1.5vw]">🔗</span>
          <span className="text-[0.8vw] font-bold mt-1">Share</span>
        </div>
      </motion.div>

      {/* Text Content */}
      <motion.div
        className="absolute bottom-[10vh] left-[5vw] z-20"
        initial={{ y: 50, opacity: 0 }}
        animate={phase >= 1 ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <h2 className="text-[7vw] font-bold text-white leading-none uppercase drop-shadow-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          FLOW
        </h2>
        <motion.p 
          className="text-[2.5vw] text-pink-500 font-bold uppercase tracking-widest mt-[1vh]"
          initial={{ opacity: 0, x: -20 }}
          animate={phase >= 2 ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
          transition={{ duration: 0.5 }}
        >
          The Squad Never Stops
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
