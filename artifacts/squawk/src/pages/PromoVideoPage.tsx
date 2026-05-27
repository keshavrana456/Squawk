import { useState, useRef } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import VideoTemplate from "@/components/video/VideoTemplate";

export default function PromoVideoPage() {
  const [playKey, setPlayKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // fallback: not supported
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleReplay = () => setPlayKey(prev => prev + 1);

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-black">
      {/* Overlay UI */}
      <div className="absolute top-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="bg-black/80 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 pointer-events-auto flex items-center gap-4 shadow-2xl">
          <div className="flex flex-col">
            <h2 className="text-white font-bold text-sm uppercase tracking-widest">Video Promo</h2>
            <p className="text-white/60 text-xs">8-scene sequence</p>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2"></div>
          <button
            onClick={handleReplay}
            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded font-medium text-sm transition-colors"
          >
            ↺ Replay
          </button>
          <button
            onClick={handleFullscreen}
            className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          </button>
        </div>
      </div>

      {/* Video Content */}
      <VideoTemplate key={playKey} />
    </div>
  );
}
