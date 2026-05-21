import { useState, useRef, useCallback, useEffect } from "react";
import { X, UploadCloud, Type, Send, Smile } from "lucide-react";
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
  x: number;
  y: number;
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

export const TRANSFORM_KEY = "__transform";

export default function StoryUploadModal({ open, onClose, onSuccess }: StoryUploadModalProps) {
  const { data: me } = useGetMe();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Image transform state
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [scale, setScale] = useState(1);

  // Text layers
  const [textLayers, setTextLayers] = useState<DraggableText[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editColor, setEditColor] = useState("#ffffff");
  const [editBg, setEditBg] = useState<DraggableText["bgStyle"]>("none");
  const [showEmojiStrip, setShowEmojiStrip] = useState(false);

  // Pointer tracking for pan + pinch
  const canvasRef = useRef<HTMLDivElement>(null);
  const ptrCache = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragOrigin = useRef<{ startX: number; startY: number; origTx: number; origTy: number } | null>(null);
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchScale = useRef<number>(1);
  const textDragging = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null); setPreview(null); setError(null); setUploading(false);
    setTx(0); setTy(0); setScale(1);
    setTextLayers([]); setEditingId(null); setEditingText(""); setShowEmojiStrip(false);
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

  // ── Wheel zoom ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || !file) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.08 : 0.93;
      setScale(s => Math.max(0.15, Math.min(12, s * factor)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [file]);

  // ── Pointer events for pan + pinch ─────────────────────────────────────────
  const getPinchDist = () => {
    const pts = Array.from(ptrCache.current.values());
    if (pts.length < 2) return null;
    return Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
  };

  const onCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (editingId) return;
    ptrCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (ptrCache.current.size === 1) {
      dragOrigin.current = { startX: e.clientX, startY: e.clientY, origTx: tx, origTy: ty };
      lastPinchDist.current = null;
    } else if (ptrCache.current.size === 2) {
      dragOrigin.current = null;
      lastPinchDist.current = getPinchDist();
      lastPinchScale.current = scale;
    }
  }, [editingId, tx, ty, scale]);

  const onCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    ptrCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (ptrCache.current.size >= 2) {
      // Pinch zoom
      const dist = getPinchDist();
      if (dist !== null && lastPinchDist.current !== null) {
        const newScale = Math.max(0.15, Math.min(12, lastPinchScale.current * (dist / lastPinchDist.current)));
        setScale(newScale);
      }
    } else if (ptrCache.current.size === 1 && dragOrigin.current && textDragging.current === null) {
      // Pan image
      const dx = e.clientX - dragOrigin.current.startX;
      const dy = e.clientY - dragOrigin.current.startY;
      setTx(dragOrigin.current.origTx + dx);
      setTy(dragOrigin.current.origTy + dy);
    }
  }, []);

  const onCanvasPointerUp = useCallback((e: React.PointerEvent) => {
    ptrCache.current.delete(e.pointerId);
    if (ptrCache.current.size < 2) {
      lastPinchDist.current = null;
    }
    if (ptrCache.current.size === 0) {
      dragOrigin.current = null;
    }
  }, []);

  // ── Text layer pointer drag ─────────────────────────────────────────────────
  const onTextPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    const layer = textLayers.find(t => t.id === id);
    if (!layer) return;
    textDragging.current = { id, startX: e.clientX, startY: e.clientY, origX: layer.x, origY: layer.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [textLayers]);

  const onTextPointerMove = useCallback((e: React.PointerEvent) => {
    if (!textDragging.current || !canvasRef.current) return;
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = ((e.clientX - textDragging.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - textDragging.current.startY) / rect.height) * 100;
    setTextLayers(prev => prev.map(t =>
      t.id === textDragging.current!.id
        ? { ...t, x: t.x + dx, y: t.y + dy }
        : t
    ));
    textDragging.current.startX = e.clientX;
    textDragging.current.startY = e.clientY;
  }, []);

  const onTextPointerUp = useCallback(() => {
    textDragging.current = null;
  }, []);

  // ── Text layer management ───────────────────────────────────────────────────
  const addTextLayer = () => {
    const id = Math.random().toString(36).slice(2);
    setTextLayers(prev => [...prev, {
      id, text: "", x: 50, y: 50, fontSize: 22, color: editColor, bgStyle: editBg,
    }]);
    setEditingId(id);
    setEditingText("");
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

  const addEmoji = (emoji: string) => {
    const id = Math.random().toString(36).slice(2);
    setTextLayers(prev => [...prev, {
      id, text: emoji,
      x: 45 + Math.random() * 20,
      y: 35 + Math.random() * 30,
      fontSize: 40, color: "#ffffff", bgStyle: "none",
    }]);
    setShowEmojiStrip(false);
  };

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadRes = await fetch("/api/storage/upload", {
        method: "POST",
        body: form,
        credentials: "include",
      });
      if (!uploadRes.ok) {
        const txt = await uploadRes.text().catch(() => "Upload failed");
        throw new Error(txt);
      }
      const { mediaUrl } = await uploadRes.json();

      // Build textLayers: prepend transform metadata, then actual text layers
      const allLayers: any[] = [
        { [TRANSFORM_KEY]: true, x: tx, y: ty, scale },
        ...textLayers,
      ];

      const captionLayer = textLayers.find(t => t.text.trim() && !/^\p{Emoji}/u.test(t.text.trim()));
      const caption = captionLayer?.text.trim() || null;

      const storyRes = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          mediaUrl,
          mediaType: file.type.startsWith("video/") ? "video" : "image",
          caption,
          objectFit: "cover",
          textLayers: JSON.stringify(allLayers),
        }),
      });
      if (!storyRes.ok) {
        const txt = await storyRes.text().catch(() => "Failed to post story");
        throw new Error(txt);
      }

      await queryClient.invalidateQueries({ queryKey: ["getStories"] });
      await queryClient.invalidateQueries({ queryKey: ["getActiveStories"] });
      reset(); onSuccess?.(); onClose();
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
      setUploading(false);
    }
  };

  const isVideo = file?.type.startsWith("video/") ?? false;
  const mediaTransform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${scale})`;

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
              width: "min(100vw, calc(100dvh * 9 / 16))",
              height: "min(100dvh, calc(100vw * 16 / 9))",
              maxWidth: "390px",
              maxHeight: "calc(390px * 16 / 9)",
            } : undefined}
            onClick={e => e.stopPropagation()}
          >
            {/* ── TOP BAR ── */}
            <div className={`flex items-center justify-between px-4 py-3 ${
              file
                ? "absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent pointer-events-none"
                : "border-b border-border bg-card"
            }`}>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center hover:bg-black/70 transition-colors pointer-events-auto"
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
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-[#c084fc] text-white text-sm font-semibold disabled:opacity-60 hover:opacity-90 transition-opacity pointer-events-auto"
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

                {/* Media canvas */}
                <div
                  ref={canvasRef}
                  className="absolute inset-0 bg-black overflow-hidden"
                  style={{ cursor: editingId ? "default" : "grab", touchAction: "none" }}
                  onPointerDown={onCanvasPointerDown}
                  onPointerMove={onCanvasPointerMove}
                  onPointerUp={onCanvasPointerUp}
                  onPointerLeave={onCanvasPointerUp}
                >
                  {/* Media — free-form transform */}
                  {isVideo ? (
                    <video
                      src={preview}
                      className="absolute w-full h-full"
                      style={{
                        top: "50%", left: "50%",
                        objectFit: "cover",
                        transform: mediaTransform,
                        transformOrigin: "center center",
                        pointerEvents: "none",
                        userSelect: "none",
                      }}
                      muted autoPlay loop playsInline
                    />
                  ) : (
                    <img
                      src={preview}
                      className="absolute w-full h-full"
                      style={{
                        top: "50%", left: "50%",
                        objectFit: "cover",
                        transform: mediaTransform,
                        transformOrigin: "center center",
                        pointerEvents: "none",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                      }}
                      alt="Story preview"
                      draggable={false}
                    />
                  )}

                  {/* Pinch / drag hint — fades after 2s */}
                  <div
                    className="absolute bottom-14 left-0 right-0 flex justify-center pointer-events-none z-20"
                    style={{ opacity: scale === 1 && tx === 0 && ty === 0 ? 1 : 0, transition: "opacity 1.5s 1s" }}
                  >
                    <div className="bg-black/55 text-white/80 text-xs px-3 py-1.5 rounded-full">
                      Drag to pan · Pinch or scroll to zoom
                    </div>
                  </div>

                  {/* Text layers */}
                  {textLayers.map(layer => (
                    <div
                      key={layer.id}
                      className="absolute touch-none select-none"
                      style={{
                        left: `${layer.x}%`,
                        top: `${layer.y}%`,
                        transform: "translate(-50%, -50%)",
                        zIndex: 10,
                        cursor: "grab",
                      }}
                      onPointerDown={e => onTextPointerDown(e, layer.id)}
                      onPointerMove={onTextPointerMove}
                      onPointerUp={onTextPointerUp}
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
                    </div>
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
                            onClick={ev => { ev.stopPropagation(); addEmoji(e); }}
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
                        onClick={e => e.stopPropagation()}
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
                          onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(); }
                          }}
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

                {/* ── TOOLBAR ── */}
                <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between gap-2 px-4 py-3 bg-black/80 backdrop-blur-md border-t border-white/10">
                  <button
                    onClick={() => addTextLayer()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 text-white text-xs font-semibold hover:bg-white/25 transition-colors"
                  >
                    <Type className="w-3.5 h-3.5" />
                    Text
                  </button>

                  <button
                    onClick={() => setShowEmojiStrip(v => !v)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-semibold transition-colors ${
                      showEmojiStrip ? "bg-primary/70" : "bg-white/15 hover:bg-white/25"
                    }`}
                  >
                    <Smile className="w-3.5 h-3.5" />
                    Sticker
                  </button>

                  <button
                    onClick={() => { setFile(null); setPreview(null); setTextLayers([]); setTx(0); setTy(0); setScale(1); }}
                    className="w-9 h-9 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/25 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {error && (
                  <div className="absolute top-16 left-0 right-0 flex justify-center z-30 pointer-events-none">
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
