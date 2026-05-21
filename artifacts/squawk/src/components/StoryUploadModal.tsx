import { useState, useRef, useCallback } from "react";
import { X, UploadCloud, Type, Minimize2, Maximize2, Send, Smile, Move } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

interface StoryUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface DraggableText {
  id: string;
  text: string;
  x: number; // 0–100 percent
  y: number; // 0–100 percent
  fontSize: number;
  color: string;
  bgStyle: "none" | "black" | "white";
}

const EMOJI_STRIP = ["😂", "🔥", "💜", "✨", "👀", "😍", "🚀", "🎉", "💯", "🤣", "❤️", "👑", "🌊", "🎶", "😎"];
const TEXT_COLORS = ["#ffffff", "#000000", "#a855f7", "#ec4899", "#f97316", "#22c55e", "#3b82f6", "#facc15"];
const BG_STYLES: { label: string; value: DraggableText["bgStyle"] }[] = [
  { label: "None", value: "none" },
  { label: "Dark", value: "black" },
  { label: "Light", value: "white" },
];

// Special key used to embed image offset into textLayers JSON
const IMAGE_OFFSET_KEY = "__imageOffset";

export default function StoryUploadModal({ open, onClose, onSuccess }: StoryUploadModalProps) {
  const { data: me } = useGetMe();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [objectFit, setObjectFit] = useState<"cover" | "contain">("cover");

  // Image pan offset (0–100%)
  const [imageOffsetX, setImageOffsetX] = useState(50);
  const [imageOffsetY, setImageOffsetY] = useState(50);
  const imageDragging = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const [isPanMode, setIsPanMode] = useState(false);

  // Text layers
  const [textLayers, setTextLayers] = useState<DraggableText[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editColor, setEditColor] = useState("#ffffff");
  const [editBg, setEditBg] = useState<DraggableText["bgStyle"]>("none");
  const [showEmojiStrip, setShowEmojiStrip] = useState(false);

  // Text drag state
  const dragging = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null); setPreview(null); setError(null); setUploading(false);
    setObjectFit("cover"); setTextLayers([]); setEditingId(null);
    setEditingText(""); setShowEmojiStrip(false);
    setImageOffsetX(50); setImageOffsetY(50); setIsPanMode(false);
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
          setFile(f); setPreview(url);
        }
      };
      vid.src = url;
    } else {
      setFile(f); setPreview(URL.createObjectURL(f));
    }
  };

  // ── Text layer management ────────────────────────────────────────────────────
  const addTextLayer = () => {
    const id = Math.random().toString(36).slice(2);
    setTextLayers(prev => [...prev, {
      id, text: "", x: 50, y: 50, fontSize: 22, color: editColor, bgStyle: editBg,
    }]);
    setEditingId(id);
    setEditingText("");
    setIsPanMode(false);
  };

  const commitEdit = () => {
    if (!editingId) return;
    if (!editingText.trim()) {
      setTextLayers(prev => prev.filter(t => t.id !== editingId));
    } else {
      setTextLayers(prev => prev.map(t =>
        t.id === editingId ? { ...t, text: editingText, color: editColor, bgStyle: editBg } : t
      ));
    }
    setEditingId(null);
    setEditingText("");
  };

  const openEditLayer = (layer: DraggableText) => {
    setEditingId(layer.id);
    setEditingText(layer.text);
    setEditColor(layer.color);
    setEditBg(layer.bgStyle);
  };

  // ── Text drag ────────────────────────────────────────────────────────────────
  const onPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    if (isPanMode) return;
    e.stopPropagation();
    const layer = textLayers.find(t => t.id === id);
    if (!layer) return;
    dragging.current = { id, startX: e.clientX, startY: e.clientY, origX: layer.x, origY: layer.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [textLayers, isPanMode]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    // Handle image panning
    if (imageDragging.current && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const dx = ((e.clientX - imageDragging.current.startX) / rect.width) * 100;
      const dy = ((e.clientY - imageDragging.current.startY) / rect.height) * 100;
      setImageOffsetX(Math.max(0, Math.min(100, imageDragging.current.origX - dx)));
      setImageOffsetY(Math.max(0, Math.min(100, imageDragging.current.origY - dy)));
      return;
    }
    // Handle text layer dragging
    if (!dragging.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragging.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragging.current.startY) / rect.height) * 100;
    const newX = Math.max(5, Math.min(95, dragging.current.origX + dx));
    const newY = Math.max(5, Math.min(95, dragging.current.origY + dy));
    setTextLayers(prev => prev.map(t =>
      t.id === dragging.current!.id ? { ...t, x: newX, y: newY } : t
    ));
  }, []);

  const onPointerUp = useCallback(() => {
    dragging.current = null;
    imageDragging.current = null;
  }, []);

  // ── Image pan pointer down ────────────────────────────────────────────────────
  const onCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isPanMode) return;
    e.preventDefault();
    imageDragging.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: imageOffsetX,
      origY: imageOffsetY,
    };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, [isPanMode, imageOffsetX, imageOffsetY]);

  // ── Emoji sticker ────────────────────────────────────────────────────────────
  const addEmoji = (emoji: string) => {
    const id = Math.random().toString(36).slice(2);
    setTextLayers(prev => [...prev, {
      id, text: emoji, x: 50 + Math.random() * 20 - 10, y: 40 + Math.random() * 20 - 10,
      fontSize: 40, color: "#ffffff", bgStyle: "none",
    }]);
    setShowEmojiStrip(false);
  };

  // ── Upload ───────────────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/storage/upload", { method: "POST", body: form });
      if (!res.ok) throw new Error("Upload failed");
      const { mediaUrl } = await res.json();

      // Build caption from first text layer (non-emoji)
      const captionLayer = textLayers.find(t => t.text.trim() && !/^\p{Emoji}/u.test(t.text.trim()));
      const caption = captionLayer?.text.trim() || null;

      // Serialize text layers + image offset into textLayers JSON
      const allLayers: any[] = [...textLayers];
      // Store image offset as a hidden metadata entry
      if (objectFit === "cover" && (imageOffsetX !== 50 || imageOffsetY !== 50)) {
        allLayers.unshift({ [IMAGE_OFFSET_KEY]: true, x: imageOffsetX, y: imageOffsetY });
      }
      const textLayersJson = allLayers.length > 0 ? JSON.stringify(allLayers) : null;

      const storyRes = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaUrl,
          mediaType: file.type.startsWith("video/") ? "video" : "image",
          caption,
          objectFit,
          textLayers: textLayersJson,
        }),
      });
      if (!storyRes.ok) throw new Error("Failed to post story");

      await queryClient.invalidateQueries({ queryKey: ["getStories"] });
      reset(); onSuccess?.(); onClose();
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
            className={`relative flex flex-col bg-black shadow-2xl overflow-hidden ${
              file ? "rounded-2xl" : "w-full max-w-sm rounded-3xl bg-card border border-border"
            }`}
            style={file ? {
              /* Fixed 9:16 frame — calculated from viewport */
              width: "min(100vw, calc(100dvh * 9 / 16))",
              height: "min(100dvh, calc(100vw * 16 / 9))",
              maxWidth: "390px",
              maxHeight: "calc(390px * 16 / 9)",
            } : undefined}
            onClick={e => e.stopPropagation()}
          >

            {/* ── TOP BAR ── */}
            <div className={`flex items-center justify-between px-4 py-3 ${
              file ? "absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent" : "border-b border-border bg-card"
            }`}>
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

            {/* ── PICK MEDIA ── */}
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

            {/* ── EDITOR ── */}
            {file && preview && (
              <div className="relative flex flex-col h-full">

                {/* Media canvas — fills the entire 9:16 frame */}
                <div
                  ref={canvasRef}
                  className={`absolute inset-0 bg-black overflow-hidden select-none ${isPanMode ? "cursor-grab active:cursor-grabbing" : "cursor-default"}`}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerLeave={onPointerUp}
                  onPointerDown={onCanvasPointerDown}
                >
                  {/* Blurred bg for contain mode */}
                  {objectFit === "contain" && (
                    <div className="absolute inset-0 overflow-hidden">
                      {file.type.startsWith("video/") ? (
                        <video src={preview} className="w-full h-full object-cover scale-110 blur-xl opacity-50" muted autoPlay loop playsInline />
                      ) : (
                        <img src={preview} className="w-full h-full object-cover scale-110 blur-xl opacity-50" alt="" />
                      )}
                    </div>
                  )}

                  {/* Main media */}
                  {file.type.startsWith("video/") ? (
                    <video
                      src={preview}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{
                        objectFit: objectFit === "cover" ? "cover" : "contain",
                        objectPosition: objectFit === "cover" ? `${imageOffsetX}% ${imageOffsetY}%` : "center",
                      }}
                      muted autoPlay loop playsInline
                    />
                  ) : (
                    <img
                      src={preview}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{
                        objectFit: objectFit === "cover" ? "cover" : "contain",
                        objectPosition: objectFit === "cover" ? `${imageOffsetX}% ${imageOffsetY}%` : "center",
                      }}
                      alt="Story preview"
                      draggable={false}
                    />
                  )}

                  {/* Pan mode hint */}
                  {isPanMode && (
                    <div className="absolute top-16 left-0 right-0 flex justify-center z-20 pointer-events-none">
                      <div className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                        Drag to reposition image
                      </div>
                    </div>
                  )}

                  {/* Text layers */}
                  {textLayers.map(layer => (
                    <motion.div
                      key={layer.id}
                      className="absolute cursor-grab active:cursor-grabbing touch-none select-none"
                      style={{ left: `${layer.x}%`, top: `${layer.y}%`, transform: "translate(-50%, -50%)", zIndex: 10 }}
                      onPointerDown={e => onPointerDown(e, layer.id)}
                      onDoubleClick={() => openEditLayer(layer)}
                    >
                      <div
                        className={`px-2 py-1 rounded-lg text-center max-w-[200px] break-words ${
                          layer.bgStyle === "black" ? "bg-black/70 backdrop-blur-sm" :
                          layer.bgStyle === "white" ? "bg-white/80" : ""
                        }`}
                        style={{ fontSize: `${layer.fontSize}px`, color: layer.color, lineHeight: 1.3 }}
                      >
                        {layer.text}
                      </div>
                    </motion.div>
                  ))}

                  {/* Emoji strip */}
                  <AnimatePresence>
                    {showEmojiStrip && (
                      <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        className="absolute bottom-14 left-0 right-0 z-20 px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar bg-black/60 backdrop-blur-md"
                      >
                        {EMOJI_STRIP.map(e => (
                          <button
                            key={e}
                            className="text-2xl shrink-0 hover:scale-125 transition-transform"
                            onClick={() => addEmoji(e)}
                          >
                            {e}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Text editor overlay */}
                  <AnimatePresence>
                    {editingId && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 gap-3 px-4"
                      >
                        <div className="flex items-center gap-2 flex-wrap justify-center">
                          {TEXT_COLORS.map(c => (
                            <button
                              key={c}
                              className={`w-7 h-7 rounded-full border-2 transition-transform ${editColor === c ? "scale-125 border-white" : "border-transparent"}`}
                              style={{ backgroundColor: c }}
                              onClick={() => setEditColor(c)}
                            />
                          ))}
                        </div>

                        <div className="flex gap-2">
                          {BG_STYLES.map(s => (
                            <button
                              key={s.value}
                              onClick={() => setEditBg(s.value)}
                              className={`px-3 py-1 rounded-full text-white text-xs font-medium border transition-all ${
                                editBg === s.value ? "border-white bg-white/20" : "border-white/30 bg-white/5"
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>

                        <textarea
                          autoFocus
                          value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                          placeholder="Add text or @mention…"
                          className="w-full bg-black/60 backdrop-blur-md text-center text-sm rounded-xl px-4 py-3 border border-white/20 resize-none outline-none placeholder:text-white/40 min-h-[72px]"
                          style={{ color: editColor, fontSize: "18px" }}
                          rows={3}
                          maxLength={200}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(); } }}
                        />

                        <div className="flex gap-2">
                          <button
                            onClick={() => { setEditingId(null); setEditingText(""); }}
                            className="px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-medium"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={commitEdit}
                            className="px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-[#c084fc] text-white text-xs font-semibold"
                          >
                            Done
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ── TOOLBAR — pinned at bottom ── */}
                <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between gap-2 px-3 py-2.5 bg-black/80 backdrop-blur-md border-t border-white/10">
                  {/* Add text */}
                  <button
                    onClick={addTextLayer}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-colors"
                  >
                    <Type className="w-3.5 h-3.5" />
                    Text
                  </button>

                  {/* Emoji */}
                  <button
                    onClick={() => { setShowEmojiStrip(v => !v); setIsPanMode(false); }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-white text-xs font-semibold transition-colors ${
                      showEmojiStrip ? "bg-primary/70" : "bg-white/15 hover:bg-white/25"
                    }`}
                  >
                    <Smile className="w-3.5 h-3.5" />
                    Sticker
                  </button>

                  {/* Pan / reposition */}
                  {objectFit === "cover" && !file.type.startsWith("video/") && (
                    <button
                      onClick={() => { setIsPanMode(v => !v); setShowEmojiStrip(false); }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-white text-xs font-semibold transition-colors ${
                        isPanMode ? "bg-primary/70" : "bg-white/15 hover:bg-white/25"
                      }`}
                    >
                      <Move className="w-3.5 h-3.5" />
                      Move
                    </button>
                  )}

                  {/* Fit toggle */}
                  <button
                    onClick={() => { setObjectFit(f => f === "cover" ? "contain" : "cover"); setIsPanMode(false); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-colors"
                  >
                    {objectFit === "cover"
                      ? <><Minimize2 className="w-3.5 h-3.5" />Fill</>
                      : <><Maximize2 className="w-3.5 h-3.5" />Fit</>
                    }
                  </button>

                  {/* Change media */}
                  <button
                    onClick={() => { setFile(null); setPreview(null); setTextLayers([]); setImageOffsetX(50); setImageOffsetY(50); }}
                    className="flex items-center gap-1 px-3 py-2 rounded-full bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
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
