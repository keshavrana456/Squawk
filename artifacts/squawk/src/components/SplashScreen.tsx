import { useEffect } from "react";
import { motion } from "framer-motion";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  useEffect(() => {
    const t = setTimeout(onComplete, 700);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background dark"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[25%] left-[25%] w-[50%] h-[50%] rounded-full bg-purple-800/35 blur-[140px]" />
        <div className="absolute bottom-[15%] right-[20%] w-[45%] h-[45%] rounded-full bg-pink-700/30 blur-[120px]" />
      </div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex flex-col items-center"
      >
        <motion.img
          src={`${BASE}/logo.png`}
          alt="Squawk"
          className="w-48 h-48 object-contain"
          animate={{
            filter: [
              "drop-shadow(0 0 0px rgba(236,72,153,0))",
              "drop-shadow(0 0 40px rgba(236,72,153,0.9)) drop-shadow(0 0 80px rgba(147,51,234,0.7))",
            ],
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </motion.div>
    </motion.div>
  );
}
