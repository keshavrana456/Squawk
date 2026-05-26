import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import partyVideo from "@assets/party_1779543875891.mp4";
import img1 from "@assets/image_1779538612190.png";

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 3800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ x: '100vw', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex w-full h-full">
        {/* Left side text */}
        <div className="w-1/2 h-full flex flex-col justify-center pl-[10vw] relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 50, rotateX: -45 }}
            animate={phase >= 2 ? { opacity: 1, y: 0, rotateX: 0 } : { opacity: 0, y: 50, rotateX: -45 }}
            transition={{ type: 'spring', stiffness: 120, damping: 15 }}
            className="overflow-hidden perspective-1000"
          >
            <h2 
              className="text-[12vw] font-bold leading-none text-transparent bg-clip-text bg-gradient-to-br from-[#8b5cf6] to-[#f472b6]"
              style={{ fontFamily: 'Bebas Neue, sans-serif' }}
            >
              FLOW
            </h2>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={phase >= 3 ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[3vw] text-white/90 mt-[1vw] font-bold uppercase tracking-wide">
              Infinite Reels.
            </p>
            <p className="text-[2vw] text-pink-400 font-medium">
              Lose yourself in the current.
            </p>
          </motion.div>
        </div>

        {/* Right side phone mockup */}
        <div className="w-1/2 h-full flex items-center justify-center relative">
          <motion.div
            initial={{ y: '50vh', rotate: 20, opacity: 0, scale: 0.8 }}
            animate={phase >= 1 ? { y: 0, rotate: -5, opacity: 1, scale: 1 } : { y: '50vh', rotate: 20, opacity: 0, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 150, damping: 20 }}
            className="w-[24vw] h-[48vw] rounded-[3vw] border-[0.5vw] border-white/20 bg-black overflow-hidden relative shadow-[0_0_80px_rgba(139,92,246,0.5)]"
          >
            <video 
              src={`${import.meta.env.BASE_URL ? import.meta.env.BASE_URL.replace(/\/$/, '') : ''}${partyVideo}`} 
              autoPlay 
              loop 
              muted 
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Dark gradient overlay for text */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
            
            {/* Fake UI Overlay */}
            <div className="absolute bottom-[2vw] left-[1.5vw] right-[1.5vw] z-10">
              <div className="flex items-center gap-[1vw] mb-[0.5vw]">
                <div className="w-[3vw] h-[3vw] rounded-full overflow-hidden border-2 border-pink-500">
                  <img src={img1} className="w-full h-full object-cover" alt="" />
                </div>
                <span className="font-bold text-[1.4vw] text-white">@creator_flow</span>
              </div>
              <p className="text-[1.1vw] text-white/80 line-clamp-2">This is the best party of the year! 🎉 Keep the vibes going #flow #squad</p>
            </div>

            {/* Right side action buttons */}
            <div className="absolute right-[1.5vw] bottom-[10vw] flex flex-col gap-[2vw] items-center z-10">
              <div className="flex flex-col items-center gap-[0.5vw]">
                <div className="w-[3.5vw] h-[3.5vw] bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-[1.5vw]">
                  ❤️
                </div>
                <span className="text-[0.9vw] font-bold text-white shadow-sm">14.2K</span>
              </div>
              <div className="flex flex-col items-center gap-[0.5vw]">
                <div className="w-[3.5vw] h-[3.5vw] bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-[1.5vw]">
                  💬
                </div>
                <span className="text-[0.9vw] font-bold text-white shadow-sm">342</span>
              </div>
              <div className="flex flex-col items-center gap-[0.5vw]">
                <div className="w-[3.5vw] h-[3.5vw] bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-[1.5vw]">
                  🚀
                </div>
              </div>
            </div>
          </motion.div>

          {/* Floating Hearts Animation */}
          {phase >= 3 && (
            <div className="absolute right-[10vw] bottom-[15vh]">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-[3vw]"
                  initial={{ y: 0, x: 0, opacity: 1, scale: 0.5 }}
                  animate={{ 
                    y: -400 - Math.random() * 100, 
                    x: (Math.random() - 0.5) * 150, 
                    opacity: 0,
                    scale: 1.5
                  }}
                  transition={{ 
                    duration: 2 + Math.random(), 
                    repeat: Infinity,
                    delay: i * 0.4
                  }}
                >
                  ❤️
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}