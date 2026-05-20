import { useState, useRef } from "react";
import { UploadCloud, X, AlertCircle } from "lucide-react";
import { useCreatePost } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function UploadFlow({ onSuccess }: { onSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createPostMutation = useCreatePost();

  const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/avi", "video/x-msvideo", "video/x-matroska", "video/3gpp", "video/x-flv"];

  const isAllowedFile = (f: File) =>
    f.type.startsWith("image/") || ALLOWED_VIDEO_TYPES.includes(f.type);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!isAllowedFile(selectedFile)) {
        setError("Audio files are not allowed. Please upload an image or video (MP4, WebM, MOV).");
        e.target.value = "";
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (!dropped) return;
    if (!isAllowedFile(dropped)) {
      setError("Audio files are not allowed. Please upload an image or video (MP4, WebM, MOV).");
      return;
    }
    setFile(dropped);
    setPreviewUrl(URL.createObjectURL(dropped));
    setError(null);
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, "");
      if (newTag && !hashtags.includes(newTag)) {
        setHashtags([...hashtags, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setHashtags(hashtags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    setUploadProgress(10);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setUploadProgress(30);

      const uploadRes = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => ({}));
        throw new Error(err.error || "File upload failed");
      }

      const { mediaUrl } = await uploadRes.json();
      setUploadProgress(70);

      await createPostMutation.mutateAsync({
        data: {
          caption: caption || undefined,
          mediaUrl,
          mediaType: file.type.startsWith("video/") ? "video" : "image",
          hashtags,
        },
      });

      setUploadProgress(100);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err?.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-card rounded-2xl border border-border p-6 shadow-xl" data-testid="upload-flow">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Create New Post</h2>

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive rounded-xl px-4 py-3 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {!file ? (
        <div
          className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          data-testid="upload-dropzone"
        >
          <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">Drag photos or videos here</p>
          <p className="text-sm text-muted-foreground mb-4">JPG, PNG, MP4 up to 100MB</p>
          <Button variant="outline" size="sm" className="border-primary/40 text-primary hover:bg-primary/10">
            Select File
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,video/mp4,video/webm,video/quicktime,video/avi,video/x-msvideo,video/x-matroska"
            className="hidden"
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative aspect-square w-full max-w-sm mx-auto rounded-xl overflow-hidden bg-muted border border-border">
            {file.type.startsWith("video/") ? (
              <video src={previewUrl!} className="w-full h-full object-cover" controls />
            ) : (
              <img src={previewUrl!} className="w-full h-full object-cover" alt="Preview" />
            )}
            <button
              className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
              onClick={() => { setFile(null); setPreviewUrl(null); setError(null); }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <Textarea
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="resize-none h-24 bg-input border-border"
              maxLength={2200}
              data-testid="input-caption"
            />
            <div className="text-right text-xs text-muted-foreground mt-1">
              {caption.length} / 2200
            </div>
          </div>

          <div>
            <div className="flex flex-wrap gap-2 mb-2">
              {hashtags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 bg-primary/20 text-primary px-2.5 py-1 rounded-full text-sm font-medium">
                  #{tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add hashtags (press Enter)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="input-hashtags"
            />
          </div>

          {isUploading && uploadProgress > 0 && (
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <Button
            className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold"
            onClick={handleSubmit}
            disabled={isUploading}
            data-testid="button-submit-post"
          >
            {isUploading ? `Uploading... ${uploadProgress}%` : "Share Post"}
          </Button>
        </div>
      )}
    </div>
  );
}
