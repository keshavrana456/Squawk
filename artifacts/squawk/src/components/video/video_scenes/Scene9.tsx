import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

function GlitchLogo() {
  const [glitch, setGlitch] = useState(false);

  useEffect(() => {
    const triggerGlitch = () => {
      setGlitch(true);
      setTimeout(() => setGlitch(false), 300 + Math.random() * 200);
    };
    const iv = setInterval(triggerGlitch, 1200 + Math.random() * 800);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="relative w-[12vw] h-auto flex items-center justify-center">
      <img
        src={`${import.meta.env.BASE_URL}logo.png`}
        className="w-full h-auto object-contain relative z-10"
        alt="Squawk"
        style={{ filter: glitch ? 'hue-rotate(180deg) brightness(1.4)' : 'none', transition: 'filter 0.05s' }}
      />
      {/* Red channel offset */}
      {glitch && (
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          className="absolute top-0 left-0 w-full h-auto object-contain z-0 mix-blend-screen"
          alt=""
          style={{ transform: `translate(${(Math.random() - 0.5) * 12}px, ${(Math.random() - 0.5) * 6}px)`, filter: 'saturate(5) hue-rotate(0deg)', opacity: 0.7 }}
        />
      )}
      {/* Cyan channel offset */}
      {glitch && (
        <img
          src={`${import.meta.env.BASE_URL}logo.png`}
          className="absolute top-0 left-0 w-full h-auto object-contain z-0 mix-blend-screen"
          alt=""
          style={{ transform: `translate(${(Math.random() - 0.5) * -12}px, ${(Math.random() - 0.5) * 6}px)`, filter: 'saturate(5) hue-rotate(120deg)', opacity: 0.5 }}
        />
      )}
      {/* Scanline flash */}
      {glitch && (
        <div
          className="absolute inset-0 z-20 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(transparent 50%, rgba(255,45,146,0.3) 50%)',
            backgroundSize: '100% 4px',
            opacity: 0.6,
          }}
        />
      )}
    </div>
  );
}

export function Scene9() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1600),
      setTimeout(() => setPhase(3), 3000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 w-full h-full overflow-hidden bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(30px)' }}
      transition={{ duration: 1.5 }}
    >
      {/* Background glow */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center z-0"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      >
        <div className="w-[80vw] h-[80vw] bg-[#ff2d92]/15 rounded-full blur-[130px] mix-blend-screen" />
      </motion.div>

      <motion.div className="relative z-20 flex flex-col items-center justify-center gap-[2vh]">
        {/* Glitchable logo — smaller */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
          transition={{ type: 'spring', bounce: 0.4 }}
        >
          <GlitchLogo />
        </motion.div>

        {/* Subtext */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: -30 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-[2.2vw] font-bold text-white uppercase tracking-[0.3em] text-center" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            SOCIAL HOME FOR 10K SQUAD
          </h2>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <p
            className="text-[4vw] font-bold uppercase tracking-[0.2em] drop-shadow-[0_0_15px_rgba(0,180,255,0.5)] text-center"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              background: 'linear-gradient(90deg, #00b4ff, #ff2d92)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Culture at light speed.
          </p>
        </motion.div>
      </motion.div>

      {/* Floating particles */}
      {phase >= 1 && (
        <div className="absolute inset-0 pointer-events-none z-30">
          {Array.from({ length: 35 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: Math.random() * 5 + 2 + 'px',
                height: Math.random() * 5 + 2 + 'px',
                left: '50%',
                top: '50%',
                backgroundColor: i % 3 === 0 ? '#ff2d92' : i % 3 === 1 ? '#00b4ff' : '#7c3aed',
              }}
              initial={{ x: 0, y: 0, scale: 0, opacity: 1 }}
              animate={{
                x: (Math.random() - 0.5) * window.innerWidth * 1.4,
                y: (Math.random() - 0.5) * window.innerHeight * 1.4,
                scale: Math.random() * 1.5,
                opacity: 0,
              }}
              transition={{
                duration: Math.random() * 4 + 2,
                ease: 'easeOut',
                repeat: Infinity,
                delay: Math.random() * 1.5,
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
