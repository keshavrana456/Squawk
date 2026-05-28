import { useState, useRef, useEffect } from "react";
import VideoTemplate from "@/components/video/VideoTemplate";

export default function PromoVideoPage() {
  const [playKey, setPlayKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleFullscreen = async () => {
      try {
        if (!document.fullscreenElement && containerRef.current) {
          await containerRef.current.requestFullscreen();
        }
      } catch (err) {
        console.error("Fullscreen error:", err);
      }
    };
    handleFullscreen();
    document.addEventListener("click", handleFullscreen, { once: true });
    
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "f" || e.key === "F") {
        if (!document.fullscreenElement) {
          containerRef.current?.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(console.error);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-black fixed inset-0 z-50 m-0 p-0">
      <VideoTemplate key={playKey} />
    </div>
  );
}
