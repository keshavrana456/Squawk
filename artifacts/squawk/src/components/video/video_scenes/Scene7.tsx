import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

const FEATURES = [
  { name: "POSTS", color: "from-pink-500 to-purple-600" },
  { name: "REELS", color: "from-cyan-400 to-blue-600" },
  { name: "CHIRPS", color: "from-purple-500 to-pink-500" },
  { name: "MESSAGES", color: "from-green-400 to-emerald-600" },
  { name: "EXPLORE", color: "from-yellow-400 to-orange-500" },
  { name: "CONTESTS", color: "from-red-500 to-pink-600" }
];

export function Scene7() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 100),
      setTimeout(() => setPhase(2), 2000), // All features visible
      setTimeout(() => setPhase(3), 2800), // Main text
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(30px)', scale: 1.5 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 flex flex-wrap content-center justify-center gap-[2vw] px-[10vw] z-10">
        {FEATURES.map((feature, i) => (
          <motion.div
            key={i}
            className={`w-[25vw] h-[8vw] rounded-2xl flex items-center justify-center bg-gradient-to-br ${feature.color} opacity-80`}
            initial={{ scale: 0, opacity: 0 }}
            animate={phase >= 1 ? { scale: 1, opacity: 0.8 } : {}}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: i * 0.15 }}
          >
            <span className="text-[3vw] font-black text-white uppercase tracking-widest" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
              {feature.name}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm z-20"
        initial={{ opacity: 0 }}
        animate={phase >= 3 ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5 }}
      />

      <motion.div
        className="relative z-30 flex flex-col items-center"
        initial={{ y: 50, opacity: 0 }}
        animate={phase >= 3 ? { y: 0, opacity: 1 } : { y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      >
        <h2 className="text-[8vw] font-bold text-white uppercase tracking-widest shadow-black drop-shadow-2xl" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          Everything Monad
        </h2>
        <h3 className="text-[4vw] font-bold text-cyan-400 uppercase tracking-widest mt-[-2vh]" style={{ fontFamily: "'Bebas Neue', sans-serif" }}>
          In One Place
        </h3>
      </motion.div>
    </motion.div>
  );
}
