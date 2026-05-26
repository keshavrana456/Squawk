import { useState, useRef, useEffect } from "react";
import VideoTemplate from "@/components/video/VideoTemplate";

export default function PromoVideoPage() {
  const [recordingStatus, setRecordingStatus] = useState<"idle" | "requesting" | "recording" | "processing" | "done">("idle");
  const [playKey, setPlayKey] = useState(0); // Used to remount VideoTemplate
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      // Cleanup
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleRecord = async () => {
    try {
      setRecordingStatus("requesting");
      
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: false,
      });

      const options = { mimeType: 'video/webm;codecs=vp9' };
      const supportedOptions = MediaRecorder.isTypeSupported(options.mimeType) 
        ? options 
        : { mimeType: 'video/webm' };

      const mediaRecorder = new MediaRecorder(stream, supportedOptions);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        setRecordingStatus("processing");
        const blob = new Blob(chunksRef.current, { type: supportedOptions.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        document.body.appendChild(a);
        a.style.display = "none";
        a.href = url;
        a.download = `squawk-promo.webm`;
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setRecordingStatus("done");
        
        // Stop stream tracks
        stream.getTracks().forEach(track => track.stop());
      };

      // Set up globals for VideoTemplate to trigger
      window.startRecording = () => {
        if (mediaRecorder.state === "inactive") {
          mediaRecorder.start();
          setRecordingStatus("recording");
        }
      };

      window.stopRecording = () => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
        }
      };

      // Remount VideoTemplate so it starts fresh and triggers startRecording
      setPlayKey(prev => prev + 1);

    } catch (error) {
      console.error("Error starting screen capture:", error);
      setRecordingStatus("idle");
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Overlay UI */}
      <div className="absolute top-4 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="bg-black/80 backdrop-blur-md px-6 py-4 rounded-xl border border-white/10 pointer-events-auto flex items-center gap-4 shadow-2xl">
          <div className="flex flex-col">
            <h2 className="text-white font-bold text-sm uppercase tracking-widest">Video Promo</h2>
            <p className="text-white/60 text-xs">8-scene sequence</p>
          </div>
          <div className="h-8 w-px bg-white/10 mx-2"></div>
          {recordingStatus === "idle" || recordingStatus === "done" ? (
            <button 
              onClick={handleRecord}
              className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded font-medium text-sm transition-colors flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-white"></div>
              Record & Download
            </button>
          ) : (
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 rounded text-sm text-white">
              <div className={`w-2 h-2 rounded-full ${recordingStatus === 'recording' ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'}`}></div>
              {recordingStatus === "requesting" && "Select browser tab..."}
              {recordingStatus === "recording" && "Recording in progress..."}
              {recordingStatus === "processing" && "Processing file..."}
            </div>
          )}
        </div>
      </div>

      {/* Video Content */}
      <VideoTemplate key={playKey} />
    </div>
  );
}