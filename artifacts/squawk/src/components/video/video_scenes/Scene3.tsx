import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const STATS = [
  { label: "Floor Price", value: "2.5K", prefix: "", suffix: " MON" },
  { label: "Total Volume", value: "2M+", prefix: "", suffix: " MON" },
];

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 5500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, x: '100vw' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 1.5, filter: 'blur(20px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGVsbGlwc2UgY3g9IjIwIiBjeT0iMjAiIHJ4PSIxIiByeT0iMSIgZmlsbD0iI2ZmZmZmZiIvPjwvc3ZnPg==')] z-0 pointer-events-none" />

      <motion.div
        className="mb-[8vh] z-20 text-center"
        initial={{ opacity: 0, y: -30 }}
        animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <h2 className="text-[6vw] font-bold text-white uppercase tracking-[0.1em]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          LIVE SALES <span className="text-[#00b4ff]">TRACKING</span>
        </h2>
      </motion.div>

      <div className="flex gap-[4vw] w-[80vw] z-20 justify-center">
        {STATS.map((stat, i) => (
          <motion.div
            key={i}
            className="w-[35vw] bg-black/60 backdrop-blur-xl border border-[#00b4ff]/40 p-[3vw] rounded-3xl flex flex-col justify-center relative overflow-hidden shadow-[0_0_50px_rgba(0,180,255,0.2)]"
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={phase >= 2 ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 100, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, delay: i * 0.2 }}
          >
            {/* Animated scanline */}
            <motion.div 
              className="absolute -inset-[100%] bg-gradient-to-b from-transparent via-[#00b4ff]/20 to-transparent"
              animate={{ y: ['-200%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
            />
            <h3 className="text-[2.5vw] text-white/50 font-medium tracking-wider mb-[1vh] uppercase font-mono">{stat.label}</h3>
            <div className="flex items-baseline gap-[1vw]">
              <span className="text-[8vw] font-bold text-white leading-none" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
                {stat.value}
              </span>
              <span className="text-[3vw] text-[#00b4ff] font-bold uppercase tracking-widest">{stat.suffix}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}