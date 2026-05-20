import { useState, useRef } from "react";
import { X, UploadCloud, Type, AlignCenter, Maximize2, Minimize2, Send } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

interface StoryUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function renderCaptionWithMentions(text: string) {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    part.startsWith("@")
      ? <span key={i} className="text-primary font-semibold">{part}</span>
      : <span key={i}>{part}</span>
  );
}

export default function StoryUploadModal({ open, onClose, onSuccess }: StoryUploadModalProps) {
  const { data: me } = useGetMe();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [objectFit, setObjectFit] = useState<"cover" | "contain">("cover");
  const [caption, setCaption] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [captionInput, setCaptionInput] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setUploading(false);
    setObjectFit("cover");
    setCaption("");
    setCaptionInput("");
    setShowTextInput(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = (f: File) => {
    setError(null);
    if (f.type.startsWith("video/")) {
      const url = URL.createObjectURL(f);
      const vid = document.createElement("video");
      vid.preload = "metadata";
      vid.onloadedmetadata = () => {
        if (vid.duration > 15) {
          setError("Videos must be 15 seconds or shorter.");
          URL.revokeObjectURL(url);
        } else {
          setFile(f);
          setPreview(url);
        }
      };
      vid.src = url;
    } else {
      setFile(f);
      setPreview(URL.createObjectURL(f));
    }
  };

  const applyCaption = () => {
    setCaption(captionInput.trim());
    setShowTextInput(false);
  };

  const handlePost = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/storage/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const { mediaUrl } = await res.json();

      const storyRes = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl,
          mediaType: file.type.startsWith("video/") ? "video" : "image",
          caption: caption || null,
          objectFit,
        }),
      });
      if (!storyRes.ok) throw new Error("Failed to post story");

      await queryClient.invalidateQueries({ queryKey: ["getStories"] });
      reset();
      onSuccess?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
      setUploading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.96, opacity: 0 }}
            className={`relative flex flex-col bg-black shadow-2xl overflow-hidden ${file ? "w-full max-w-sm rounded-2xl" : "w-full max-w-sm rounded-3xl bg-card border border-border"}`}
            onClick={e => e.stopPropagation()}
          >
            {/* ── TOP BAR ── */}
            <div className={`flex items-center justify-between px-4 py-3 ${file ? "absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent" : "border-b border-border bg-card"}`}>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {!file && (
                <div className="flex items-center gap-2">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={me?.avatarUrl || ""} className="object-cover" />
                    <AvatarFallback className="text-xs">{me?.displayName?.charAt(0)?.toUpperCase() ?? "M"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-semibold text-foreground">{me?.displayName}</span>
                </div>
              )}

              {file && (
                <button
                  onClick={handlePost}
                  disabled={uploading}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-[#c084fc] text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity"
                >
                  {uploading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <Send className="w-3.5 h-3.5" />
                  }
                  {uploading ? "Posting…" : "Share"}
                </button>
              )}
            </div>

            {/* ── PICK MEDIA (no file yet) ── */}
            {!file && (
              <div className="p-5 space-y-4 bg-card">
                <div
                  className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
                  onClick={() => inputRef.current?.click()}
                >
                  <UploadCloud className="w-10 h-10 text-muted-foreground mb-3" />
                  <p className="font-medium text-foreground mb-1">Photo or short video</p>
                  <p className="text-xs text-muted-foreground">Videos up to 15 seconds · Visible for 24 hours</p>
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </div>
                {error && <p className="text-xs text-destructive text-center">{error}</p>}
              </div>
            )}

            {/* ── EDITOR VIEW (file selected) ── */}
            {file && preview && (
              <div className="relative">
                {/* Media canvas — 9:16 */}
                <div className="relative w-full aspect-[9/16] bg-black overflow-hidden">
                  {file.type.startsWith("video/") ? (
                    <video
                      src={preview}
                      className={`w-full h-full ${objectFit === "cover" ? "object-cover" : "object-contain"}`}
                      muted autoPlay loop playsInline
                    />
                  ) : (
                    <img
                      src={preview}
                      className={`w-full h-full ${objectFit === "cover" ? "object-cover" : "object-contain"}`}
                      alt="Story preview"
                    />
                  )}

                  {/* Caption overlay */}
                  {caption && !showTextInput && (
                    <div
                      className="absolute bottom-20 left-0 right-0 flex items-center justify-center px-4"
                      onClick={() => { setCaptionInput(caption); setShowTextInput(true); }}
                    >
                      <div className="bg-black/50 backdrop-blur-md rounded-xl px-4 py-2 max-w-[85%] text-center cursor-pointer">
                        <p className="text-white text-sm font-medium leading-snug break-words">
                          {renderCaptionWithMentions(caption)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Inline text editor */}
                  {showTextInput && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                      <div className="w-4/5 flex flex-col items-center gap-3">
                        <textarea
                          autoFocus
                          value={captionInput}
                          onChange={e => setCaptionInput(e.target.value)}
                          placeholder="Add text or @mention…"
                          className="w-full bg-black/60 backdrop-blur-md text-white text-center text-sm rounded-xl px-4 py-3 border border-white/20 resize-none outline-none placeholder:text-white/40 min-h-[80px]"
                          rows={3}
                          maxLength={200}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowTextInput(false)}
                            className="px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={applyCaption}
                            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-[#c084fc] text-white text-xs font-semibold"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ── BOTTOM TOOLBAR ── */}
                <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center justify-between px-4 pb-4 pt-10 bg-gradient-to-t from-black/70 to-transparent">
                  {/* Text tool */}
                  <button
                    onClick={() => { setCaptionInput(caption); setShowTextInput(true); }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-colors ${caption ? "bg-primary/80 text-white" : "bg-white/15 text-white"}`}
                  >
                    <Type className="w-3.5 h-3.5" />
                    {caption ? "Edit text" : "Add text"}
                  </button>

                  {/* Fit toggle */}
                  <button
                    onClick={() => setObjectFit(f => f === "cover" ? "contain" : "cover")}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-colors"
                    title={objectFit === "cover" ? "Switch to Fit" : "Switch to Fill"}
                  >
                    {objectFit === "cover"
                      ? <><Minimize2 className="w-3.5 h-3.5" />Fill</>
                      : <><Maximize2 className="w-3.5 h-3.5" />Fit</>
                    }
                  </button>

                  {/* Discard */}
                  <button
                    onClick={() => { setFile(null); setPreview(null); setCaption(""); }}
                    className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-colors"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                    Change
                  </button>
                </div>

                {error && (
                  <div className="absolute top-16 left-0 right-0 flex justify-center z-30">
                    <p className="bg-destructive/90 text-white text-xs px-4 py-2 rounded-full">{error}</p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
