import { useEffect, useRef, useState } from "react";
import VideoTemplate from "../video/VideoTemplate";

const TOTAL_MS = 5000 + 8000 + 8000 + 7000 + 6000; // 34 s — must match SCENE_DURATIONS

type Phase = "idle" | "sharing" | "recording" | "done" | "error";

export default function SquawkExport() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const chunksRef = useRef<Blob[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  async function startCapture() {
    setPhase("sharing");
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await (navigator.mediaDevices as any).getDisplayMedia({
        video: { frameRate: 30, width: 1280, height: 720 },
        audio: false,
        preferCurrentTab: true,
      } as any);
    } catch {
      setPhase("error");
      setErrorMsg("Screen share was cancelled or denied. Please try again and choose to share this tab.");
      return;
    }

    const mimeType = MediaRecorder.isTypeSupported("video/mp4")
      ? "video/mp4"
      : "video/webm;codecs=vp9";

    const recorder = new MediaRecorder(stream, { mimeType });
    recorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const ext = mimeType.startsWith("video/mp4") ? "mp4" : "webm";
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      const a = document.createElement("a");
      a.href = url;
      a.download = `squawk-commercial.${ext}`;
      a.click();
      setPhase("done");
    };

    recorder.start(100);
    setPhase("recording");

    let ms = 0;
    timerRef.current = setInterval(() => {
      ms += 250;
      setElapsed(ms);
      if (ms >= TOTAL_MS + 500) {
        if (timerRef.current) clearInterval(timerRef.current);
        recorder.stop();
      }
    }, 250);
  }

  const pct = Math.min(100, Math.round((elapsed / TOTAL_MS) * 100));

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <VideoTemplate />

      {/* Overlay UI */}
      <div className="absolute inset-0 flex items-end justify-center pb-10 pointer-events-none">
        <div
          className="pointer-events-auto rounded-2xl border border-white/15 px-6 py-4 flex flex-col items-center gap-3 shadow-2xl"
          style={{ background: "rgba(13,6,24,0.88)", backdropFilter: "blur(12px)", minWidth: "320px" }}
        >
          {phase === "idle" && (
            <>
              <p className="text-white/70 text-sm text-center">
                Records one full play-through and downloads as MP4 / WebM.
              </p>
              <button
                onClick={startCapture}
                className="px-6 py-2.5 rounded-full text-sm font-bold text-white"
                style={{ background: "linear-gradient(135deg, #e91e8c, #8b5cf6)" }}
              >
                ● Start Recording
              </button>
            </>
          )}

          {phase === "sharing" && (
            <p className="text-white/70 text-sm animate-pulse">
              Waiting for tab share… select <strong className="text-white">This Tab</strong> in the dialog.
            </p>
          )}

          {phase === "recording" && (
            <>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white text-sm font-semibold">
                  Recording… {pct}%
                </span>
              </div>
              <div className="w-72 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${pct}%`, background: "linear-gradient(90deg, #e91e8c, #8b5cf6)" }}
                />
              </div>
              <p className="text-white/40 text-xs">
                {((TOTAL_MS - elapsed) / 1000).toFixed(0)}s remaining — do not switch tabs
              </p>
            </>
          )}

          {phase === "done" && (
            <>
              <p className="text-green-400 font-semibold text-sm">Download started!</p>
              <button
                onClick={() => { setPhase("idle"); setElapsed(0); }}
                className="px-4 py-1.5 rounded-full text-xs text-white/60 border border-white/15 hover:border-white/30 transition-colors"
              >
                Record again
              </button>
            </>
          )}

          {phase === "error" && (
            <>
              <p className="text-red-400 text-sm text-center">{errorMsg}</p>
              <button
                onClick={() => setPhase("idle")}
                className="px-4 py-1.5 rounded-full text-xs text-white/60 border border-white/15 hover:border-white/30 transition-colors"
              >
                Try again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
