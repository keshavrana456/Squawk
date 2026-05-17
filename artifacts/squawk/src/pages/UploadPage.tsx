import UploadFlow from "@/components/UploadFlow";
import { useLocation } from "wouter";
import { motion } from "framer-motion";

export default function UploadPage() {
  const [, setLocation] = useLocation();

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen p-4 md:p-8 flex items-center justify-center dark">
      <div className="w-full">
        <UploadFlow onSuccess={() => setLocation("/home")} />
      </div>
    </motion.div>
  );
}
