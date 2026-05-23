import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import partyVideo from "@assets/party_1779543875891.mp4";

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
      setTimeout(() => setPhase(4), 6000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10"
      initial={{ opacity: 0, x: '100vw' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex w-full h-full">
        {/* Left side text */}
        <div className="w-1/2 h-full flex flex-col justify-center pl-[10vw] relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
            transition={{ duration: 0.8 }}
            className="overflow-hidden"
          >
            <h2 
              className="text-[12vw] font-bold leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#8b5cf6] to-[#f472b6]"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              FLOW
            </h2>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, x: -50 }}
            animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.6 }}
            className="text-[3vw] text-white/80 mt-[2vw]"
          >
            Your world. Your flow.
          </motion.p>
        </div>

        {/* Right side phone mockup */}
        <div className="w-1/2 h-full flex items-center justify-center relative">
          <motion.div
            initial={{ y: '50vh', rotate: 15, opacity: 0 }}
            animate={phase >= 1 ? { y: 0, rotate: -5, opacity: 1 } : { y: '50vh', rotate: 15, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="w-[22vw] h-[45vw] rounded-[3vw] border-[0.5vw] border-white/20 bg-black overflow-hidden relative shadow-[0_0_100px_rgba(139,92,246,0.4)]"
          >
            <video 
              src={`${import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : ''}${partyVideo}`} 
              autoPlay 
              loop 
              muted 
              playsInline
              className="w-full h-full object-cover"
            />
            {/* UI overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
              <div className="absolute bottom-[2vw] left-[2vw] right-[2vw] flex justify-between items-end">
                <div>
                  <p className="font-bold text-[1.2vw]">@party_bird</p>
                  <p className="text-[1vw] text-white/80">Vibes are immaculate today 🎧</p>
                </div>
                <div className="flex flex-col gap-[1vw]">
                  <div className="w-[3vw] h-[3vw] rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">♡</div>
                  <div className="w-[3vw] h-[3vw] rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">💬</div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Neon trail effect behind phone */}
          {phase >= 1 && (
            <motion.div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[22vw] h-[45vw] rounded-[3vw] border-[0.5vw] border-[#f472b6]/50 -z-10"
              initial={{ scale: 1, opacity: 1, rotate: -5 }}
              animate={{ scale: 1.2, opacity: 0, rotate: -10 }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}