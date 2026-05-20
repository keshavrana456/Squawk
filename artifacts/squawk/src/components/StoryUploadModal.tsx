import { useState, useRef } from "react";
import { X, UploadCloud } from "lucide-react";
import { useGetMe, useCreateStory } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";

interface StoryUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function StoryUploadModal({ open, onClose, onSuccess }: StoryUploadModalProps) {
  const { data: me } = useGetMe();
  const createStory = useCreateStory();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setUploading(false);
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
      await createStory.mutateAsync({
        data: { mediaUrl, mediaType: file.type.startsWith("video/") ? "video" : "image" },
      });
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
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card border border-border rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <div className="flex items-center gap-3">
                <Avatar className="w-9 h-9">
                  <AvatarImage src={me?.avatarUrl || ''} className="object-cover" />
                  <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                    {me?.displayName?.charAt(0)?.toUpperCase() ?? 'Me'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-foreground">{me?.displayName}</p>
                  <p className="text-xs text-muted-foreground">Add to your story</p>
                </div>
              </div>
              <button onClick={handleClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {!file ? (
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
              ) : (
                <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden bg-black max-h-64">
                  {file.type.startsWith("video/") ? (
                    <video ref={videoRef} src={preview!} className="w-full h-full object-cover" muted autoPlay loop playsInline />
                  ) : (
                    <img src={preview!} className="w-full h-full object-cover" alt="Story preview" />
                  )}
                  <button
                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                    onClick={() => { setFile(null); setPreview(null); }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {error && <p className="text-xs text-destructive text-center">{error}</p>}

              <button
                onClick={handlePost}
                disabled={!file || uploading}
                className="w-full h-11 rounded-full font-semibold text-sm bg-gradient-to-r from-primary to-[#c084fc] text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Posting…</>
                ) : "Share Story"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
