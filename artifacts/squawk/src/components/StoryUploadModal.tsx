import { useState, useRef, useCallback, useEffect } from "react";
import { X, UploadCloud, Type, Send, Smile, RotateCcw, FlipHorizontal } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useMentions } from "@/hooks/useMentions";
import MentionSuggestions from "@/components/MentionSuggestions";

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

  // Image transform state — start at scale=1, no pan, no rotation
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Text layers
  const [textLayers, setTextLayers] = useState<DraggableText[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editColor, setEditColor] = useState("#ffffff");
  const [editBg, setEditBg] = useState<DraggableText["bgStyle"]>("none");
  const [showEmojiStrip, setShowEmojiStrip] = useState(false);

  // Pointer tracking for pan + pinch + rotate
  const canvasRef = useRef<HTMLDivElement>(null);
  const ptrCache = useRef<Map<number, { x: number; y: number }>>(new Map());
  const dragOrigin = useRef<{ startX: number; startY: number; origTx: number; origTy: number } | null>(null);
  const lastPinchDist = useRef<number | null>(null);
  const lastPinchScale = useRef<number>(1);
  const lastPinchAngle = useRef<number | null>(null);
  const lastPinchRotation = useRef<number>(0);
  const textDragging = useRef<{ id: string; startX: number; startY: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const storyTextRef = useRef<HTMLTextAreaElement>(null);
  const { suggestions: mentionSuggestions, loading: mentionsLoading, isOpen: mentionsOpen, handleChange: handleMentionChange, insertMention } = useMentions(editingText, setEditingText, storyTextRef);

  const reset = () => {
    setFile(null); setPreview(null); setError(null); setUploading(false);
    setTx(0); setTy(0); setScale(1); setRotation(0);
    setTextLayers([]); setEditingId(null); setEditingText(""); setShowEmojiStrip(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleFile = (f: File) => {
    setError(null);
    // Reset transform when new file is loaded so image appears at natural size
    setTx(0); setTy(0); setScale(1); setRotation(0);
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
      setScale(s => Math.max(0.1, Math.min(10, s * factor)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [file]);

  const getPinchInfo = () => {
    const pts = Array.from(ptrCache.current.values());
    if (pts.length < 2) return null;
    const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
    const angle = Math.atan2(pts[1].y - pts[0].y, pts[1].x - pts[0].x) * (180 / Math.PI);
    return { dist, angle };
  };

  const onCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (editingId) return;
    try {
      ptrCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      if (ptrCache.current.size === 1) {
        dragOrigin.current = { startX: e.clientX, startY: e.clientY, origTx: tx, origTy: ty };
        lastPinchDist.current = null;
        lastPinchAngle.current = null;
      } else if (ptrCache.current.size === 2) {
        dragOrigin.current = null;
        const info = getPinchInfo();
        if (info) {
          lastPinchDist.current = info.dist;
          lastPinchAngle.current = info.angle;
        }
        lastPinchScale.current = scale;
        lastPinchRotation.current = rotation;
      }
    } catch { /* ignore gesture errors */ }
  }, [editingId, tx, ty, scale, rotation]);

  const onCanvasPointerMove = useCallback((e: React.PointerEvent) => {
    try {
      ptrCache.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrCache.current.size >= 2) {
        const info = getPinchInfo();
        if (info && lastPinchDist.current !== null && lastPinchDist.current > 0) {
          setScale(Math.max(0.1, Math.min(10, lastPinchScale.current * (info.dist / lastPinchDist.current))));
        }
        if (info && lastPinchAngle.current !== null) {
          setRotation(lastPinchRotation.current + (info.angle - lastPinchAngle.current));
        }
      } else if (ptrCache.current.size === 1 && dragOrigin.current && textDragging.current === null) {
        setTx(dragOrigin.current.origTx + (e.clientX - dragOrigin.current.startX));
        setTy(dragOrigin.current.origTy + (e.clientY - dragOrigin.current.startY));
      }
    } catch { /* ignore gesture errors */ }
  }, []);

  const onCanvasPointerUp = useCallback((e: React.PointerEvent) => {
    try {
      ptrCache.current.delete(e.pointerId);
      if (ptrCache.current.size < 2) {
        lastPinchDist.current = null;
        lastPinchAngle.current = null;
      }
      if (ptrCache.current.size === 0) dragOrigin.current = null;
    } catch { /* ignore */ }
  }, []);

  // ── Text layer pointer drag ─────────────────────────────────────────────────
  const onTextPointerDown = useCallback((e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    textDragging.current = { id, startX: e.clientX, startY: e.clientY };
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
  }, []);

  const onTextPointerMove = useCallback((e: React.PointerEvent) => {
    if (!textDragging.current || !canvasRef.current) return;
    e.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = ((e.clientX - textDragging.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - textDragging.current.startY) / rect.height) * 100;
    const id = textDragging.current.id;
    setTextLayers(prev => prev.map(t =>
      t.id === id ? { ...t, x: Math.max(5, Math.min(95, t.x + dx)), y: Math.max(5, Math.min(95, t.y + dy)) } : t
    ));
    textDragging.current.startX = e.clientX;
    textDragging.current.startY = e.clientY;
  }, []);

  const onTextPointerUp = useCallback(() => { textDragging.current = null; }, []);

  // ── Text layer management ───────────────────────────────────────────────────
  const addTextLayer = () => {
    const id = Math.random().toString(36).slice(2);
    setTextLayers(prev => [...prev, { id, text: "", x: 50, y: 50, fontSize: 22, color: editColor, bgStyle: editBg }]);
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
    if (!file || uploading) return;
    setUploading(true);
    setError(null);
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

      const allLayers: any[] = [
        { [TRANSFORM_KEY]: true, x: tx, y: ty, scale, rotation },
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
          objectFit: "contain",
          textLayers: JSON.stringify(allLayers),
        }),
      });
      if (!storyRes.ok) {
        const txt = await storyRes.text().catch(() => "Failed to post story");
        throw new Error(txt);
      }

      await queryClient.invalidateQueries({ queryKey: ["getStories"] });
      await queryClient.invalidateQueries({ queryKey: ["getActiveStories"] });
      reset();
      onSuccess?.();
      onClose();
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const isVideo = file?.type.startsWith("video/") ?? false;
  // Image transform — contain by default (scale=1 shows full image), user can pinch to zoom
  const mediaTransform = `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(${scale}) rotate(${rotation}deg)`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-sm"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
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
            <div
              className={`flex items-center justify-between px-4 py-3 ${
                file
                  ? "absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/70 to-transparent pointer-events-none"
                  : "border-b border-border bg-card"
              }`}
              style={{ paddingTop: file ? "calc(env(safe-area-inset-top, 0px) + 12px)" : undefined }}
            >
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
                  {/* Media — use contain so full image is visible at scale=1 */}
                  {isVideo ? (
                    <video
                      src={preview}
                      className="absolute"
                      style={{
                        top: "50%", left: "50%",
                        width: "100%", height: "100%",
                        objectFit: "contain",
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
                      className="absolute"
                      style={{
                        top: "50%", left: "50%",
                        width: "100%", height: "100%",
                        objectFit: "contain",
                        transform: mediaTransform,
                        transformOrigin: "center center",
                        pointerEvents: "none",
                        userSelect: "none",
                        WebkitUserSelect: "none",
                        maxWidth: "none",
                      }}
                      alt="Story preview"
                      draggable={false}
                    />
                  )}

                  {/* Gesture hint */}
                  <div
                    className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none z-20"
                    style={{ opacity: scale === 1 && tx === 0 && ty === 0 && rotation === 0 ? 1 : 0, transition: "opacity 1.5s 1s" }}
                  >
                    <div className="bg-black/55 text-white/80 text-xs px-3 py-1.5 rounded-full">
                      Drag · Pinch to zoom · Two fingers to rotate
                    </div>
                  </div>

                  {/* Text layers */}
                  {textLayers.map(layer => (
                    <div
                      key={layer.id}
                      className="absolute touch-none select-none"
                      style={{ left: `${layer.x}%`, top: `${layer.y}%`, transform: "translate(-50%, -50%)", zIndex: 10, cursor: "grab" }}
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

                  {/* Emoji strip — slides up from above toolbar */}
                  <AnimatePresence>
                    {showEmojiStrip && (
                      <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        className="absolute left-0 right-0 z-20 px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar bg-black/70 backdrop-blur-md"
                        style={{ bottom: "calc(64px + env(safe-area-inset-bottom, 0px))" }}
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
                        className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 gap-3 px-4"
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
                        <div className="relative w-full">
                          <MentionSuggestions
                            suggestions={mentionSuggestions}
                            loading={mentionsLoading}
                            isOpen={mentionsOpen}
                            onSelect={insertMention}
                            className="absolute bottom-full left-0 right-0 mb-1 max-h-40 overflow-y-auto"
                          />
                        <textarea
                          ref={storyTextRef}
                          autoFocus
                          value={editingText}
                          onChange={e => handleMentionChange(e.target.value)}
                          placeholder="Add text or @mention…"
                          className="w-full bg-black/60 backdrop-blur-md text-center text-sm rounded-xl px-4 py-3 border border-white/20 resize-none outline-none placeholder:text-white/40 min-h-[72px]"
                          style={{ color: editColor, fontSize: "18px" }}
                          rows={3}
                          maxLength={200}
                          onKeyDown={e => {
                            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); commitEdit(); }
                          }}
                        />
                        </div>
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

                {/* ── RIGHT-SIDE ICON TOOLBAR ── */}
                <div
                  className="absolute right-3 z-20 flex flex-col gap-3"
                  style={{ top: "50%", transform: "translateY(-50%)" }}
                >
                  {/* Add Text */}
                  <button
                    onClick={addTextLayer}
                    title="Add text"
                    className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors border border-white/10 active:scale-95"
                  >
                    <Type className="w-5 h-5" />
                  </button>

                  {/* Stickers / Emoji */}
                  <button
                    onClick={() => setShowEmojiStrip(v => !v)}
                    title="Stickers"
                    className={`w-10 h-10 rounded-full backdrop-blur-sm text-white flex items-center justify-center transition-colors border active:scale-95 ${
                      showEmojiStrip ? "bg-primary/80 border-primary" : "bg-black/60 border-white/10 hover:bg-black/80"
                    }`}
                  >
                    <Smile className="w-5 h-5" />
                  </button>

                  {/* Rotate 90° */}
                  <button
                    onClick={() => setRotation(r => r + 90)}
                    title="Rotate 90°"
                    className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors border border-white/10 active:scale-95"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>

                  {/* Reset transform */}
                  <button
                    onClick={() => { setTx(0); setTy(0); setScale(1); setRotation(0); }}
                    title="Reset view"
                    className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/80 transition-colors border border-white/10 active:scale-95"
                  >
                    <FlipHorizontal className="w-5 h-5" />
                  </button>

                  {/* Clear / pick new image */}
                  <button
                    onClick={() => { setFile(null); setPreview(null); setTextLayers([]); setTx(0); setTy(0); setScale(1); setRotation(0); }}
                    title="Choose different image"
                    className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-red-500/70 transition-colors border border-white/10 active:scale-95"
                  >
                    <X className="w-5 h-5" />
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
