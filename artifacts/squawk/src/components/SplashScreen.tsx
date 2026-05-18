import { useEffect } from "react";
import { motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const t = setTimeout(onComplete, 2600);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background dark"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: "easeInOut" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[30%] left-[30%] w-[40%] h-[40%] rounded-full bg-purple-800/30 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[25%] w-[35%] h-[35%] rounded-full bg-pink-700/25 blur-[100px]" />
      </div>

      <motion.div
        initial={{ scale: 0.15, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center gap-6"
      >
        <motion.img
          src={`${BASE}/logo.png`}
          alt="Squawk"
          className="w-28 h-28 object-contain"
          animate={{
            filter: [
              "drop-shadow(0 0 0px rgba(236,72,153,0))",
              "drop-shadow(0 0 40px rgba(236,72,153,0.9)) drop-shadow(0 0 80px rgba(147,51,234,0.7))",
              "drop-shadow(0 0 24px rgba(236,72,153,0.55)) drop-shadow(0 0 50px rgba(147,51,234,0.45))",
            ],
          }}
          transition={{ duration: 1.4, times: [0, 0.55, 1], ease: "easeOut" }}
        />
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-white/40 text-sm font-medium tracking-widest uppercase"
        >
          Squawk
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
