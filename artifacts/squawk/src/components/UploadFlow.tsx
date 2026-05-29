import { useState, useRef } from "react";
import { UploadCloud, X, AlertCircle } from "lucide-react";
import { useCreatePost } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMentions } from "@/hooks/useMentions";
import MentionSuggestions from "@/components/MentionSuggestions";

const LARGE_FILE_THRESHOLD = 15 * 1024 * 1024; // 15 MB — above this, upload directly to Cloudinary

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
  const captionRef = useRef<HTMLTextAreaElement>(null);
  const { suggestions: mentionSuggestions, loading: mentionsLoading, isOpen: mentionsOpen, handleChange: handleMentionChange, insertMention } = useMentions(caption, setCaption, captionRef);

  const createPostMutation = useCreatePost();

  const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime", "video/avi", "video/x-msvideo", "video/x-matroska", "video/3gpp", "video/x-flv"];
  const isAllowedFile = (f: File) => f.type.startsWith("image/") || ALLOWED_VIDEO_TYPES.includes(f.type);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!isAllowedFile(selectedFile)) {
        setError("Only images and videos (MP4, WebM, MOV) are supported.");
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
      setError("Only images and videos (MP4, WebM, MOV) are supported.");
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

  // Direct upload to Cloudinary — used for large files to avoid proxy timeouts
  const uploadDirectToCloudinary = async (f: File): Promise<string> => {
    // 1. Get signed params from the server
    const signRes = await fetch("/api/storage/sign-upload", {
      method: "POST",
      credentials: "include",
    });
    if (!signRes.ok) throw new Error("Could not get upload credentials");
    const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

    // 2. Upload directly to Cloudinary using XMLHttpRequest so we get progress events
    const resourceType = f.type.startsWith("video/") ? "video" : "image";
    const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

    return new Promise((resolve, reject) => {
      const form = new FormData();
      form.append("file", f);
      form.append("api_key", apiKey);
      form.append("timestamp", String(timestamp));
      form.append("signature", signature);
      form.append("folder", folder);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", url);

      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable) {
          // Map upload progress to 20–85% of the overall bar
          const pct = 20 + Math.round((evt.loaded / evt.total) * 65);
          setUploadProgress(pct);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          resolve(data.secure_url);
        } else {
          reject(new Error("Cloudinary upload failed"));
        }
      };
      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.send(form);
    });
  };

  // Server-proxy upload — used for small files (fast, simple)
  const uploadViaServer = async (f: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", f);

    const uploadRes = await fetch("/api/storage/upload", {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!uploadRes.ok) {
      const err = await uploadRes.json().catch(() => ({}));
      throw new Error((err as any).error || "File upload failed");
    }

    const { mediaUrl } = await uploadRes.json();
    return mediaUrl;
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    setUploadProgress(10);

    try {
      let mediaUrl: string;

      if (file.size > LARGE_FILE_THRESHOLD) {
        // Large file — upload straight to Cloudinary to avoid proxy timeouts
        setUploadProgress(20);
        mediaUrl = await uploadDirectToCloudinary(file);
      } else {
        // Small file — go through the server (simpler, no extra roundtrip)
        setUploadProgress(30);
        mediaUrl = await uploadViaServer(file);
      }

      setUploadProgress(88);

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
            {file.size > LARGE_FILE_THRESHOLD && (
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                Large file — direct upload
              </div>
            )}
          </div>

          <div className="relative">
            <MentionSuggestions
              suggestions={mentionSuggestions}
              loading={mentionsLoading}
              isOpen={mentionsOpen}
              onSelect={insertMention}
              className="absolute bottom-full left-0 right-0 mb-1 max-h-52 overflow-y-auto"
            />
            <Textarea
              ref={captionRef}
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => handleMentionChange(e.target.value)}
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
            <div className="space-y-1">
              <div className="w-full bg-muted rounded-full h-1.5">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                {uploadProgress < 85 ? "Uploading…" : "Saving post…"} {uploadProgress}%
              </p>
            </div>
          )}

          <Button
            className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold"
            onClick={handleSubmit}
            disabled={isUploading}
            data-testid="button-submit-post"
          >
            {isUploading ? `Uploading… ${uploadProgress}%` : "Share Post"}
          </Button>
        </div>
      )}
    </div>
  );
}
