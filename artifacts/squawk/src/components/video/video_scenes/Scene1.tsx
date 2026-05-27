import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import birdImg from "@assets/MAIN_BODY_1779543929049.png";
import squadLogo from "@assets/my_talking_squad_png_for_intro_1779543965946.png";

function SmokeParticle({ delay, x, size, opacity }: { delay: number; x: string; size: number; opacity: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, rgba(200,150,255,${opacity}) 0%, rgba(150,100,220,${opacity * 0.4}) 40%, transparent 70%)`,
        filter: 'blur(18px)',
        left: x,
        bottom: '30%',
      }}
      initial={{ y: 0, opacity: 0, scale: 0.5 }}
      animate={{
        y: [0, -80, -180, -320],
        opacity: [0, opacity, opacity * 0.7, 0],
        scale: [0.5, 1.2, 1.8, 2.5],
        x: [0, 20, -10, 15],
      }}
      transition={{
        duration: 3.5,
        delay,
        ease: 'easeOut',
        repeat: Infinity,
        repeatDelay: 1.5,
      }}
    />
  );
}

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.cdnfonts.com/css/rockybilly';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1600),
      setTimeout(() => setPhase(4), 3800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center z-10 w-full h-full overflow-hidden"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)', scale: 1.2 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative z-20 flex flex-col items-center justify-center w-full h-full">

        {/* Smoke particles — reveal effect around the SQUAWK text */}
        {phase >= 1 && (
          <>
            <SmokeParticle delay={0}    x="8%"  size={120} opacity={0.35} />
            <SmokeParticle delay={0.2}  x="20%" size={90}  opacity={0.28} />
            <SmokeParticle delay={0.4}  x="35%" size={150} opacity={0.4}  />
            <SmokeParticle delay={0.15} x="50%" size={110} opacity={0.32} />
            <SmokeParticle delay={0.5}  x="62%" size={130} opacity={0.38} />
            <SmokeParticle delay={0.3}  x="75%" size={100} opacity={0.3}  />
            <SmokeParticle delay={0.6}  x="88%" size={140} opacity={0.35} />
            <SmokeParticle delay={0.1}  x="28%" size={80}  opacity={0.25} />
            <SmokeParticle delay={0.45} x="58%" size={95}  opacity={0.3}  />
          </>
        )}

        {/* Giant SQUAWK background text — Rockybilly font */}
        <motion.h1
          className="absolute z-0 text-[35vw] font-black text-white/5 uppercase tracking-tighter"
          style={{ fontFamily: "'Rockybilly', 'Bebas Neue', sans-serif" }}
          initial={{ x: '-100vw', opacity: 0 }}
          animate={phase >= 1 ? { x: '0vw', opacity: 1 } : { x: '-100vw', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        >
          SQUAWK
        </motion.h1>

        {/* Mascot */}
        <motion.div
          initial={{ y: '100vh', opacity: 0, scale: 0.5, rotate: 10 }}
          animate={phase >= 2 ? { y: '5vh', opacity: 1, scale: 1, rotate: 0 } : { y: '100vh', opacity: 0, scale: 0.5, rotate: 10 }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          className="absolute z-30 pointer-events-none"
        >
          <img src={birdImg} alt="Mascot" className="h-[60vh] object-contain drop-shadow-[0_20px_50px_rgba(236,72,153,0.6)]" />
        </motion.div>

        {/* Logo */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -15, y: '-20vh' }}
          animate={phase >= 2 ? { scale: 1, opacity: 1, rotate: -5, y: '-25vh' } : { scale: 0, opacity: 0, rotate: -15, y: '-20vh' }}
          transition={{ type: 'spring', stiffness: 250, damping: 15, delay: 0.2 }}
          className="absolute z-40 w-[30vw] max-w-lg pointer-events-none"
        >
          <img src={squadLogo} alt="My Talking Squad" className="w-full h-auto drop-shadow-2xl" />
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={phase >= 3 ? { opacity: 1, y: 0, filter: 'blur(0px)' } : { opacity: 0, y: 30, filter: 'blur(10px)' }}
          transition={{ duration: 0.8 }}
          className="absolute bottom-[10vh] w-[80vw] text-center z-40 pointer-events-none"
        >
          <div className="inline-block bg-white text-black px-[2vw] py-[1vw] rounded-full transform -rotate-2">
            <p className="text-[2.5vw] font-bold tracking-widest uppercase" style={{ fontFamily: "'Rockybilly', 'Bebas Neue', sans-serif" }}>
              The Social Home of the 10K Squad
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
