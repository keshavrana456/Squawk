import { useState, useRef } from "react";
import { UploadCloud, X } from "lucide-react";
import { useRequestUploadUrl, useCreatePost } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function UploadFlow({ onSuccess }: { onSuccess?: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requestUrlMutation = useRequestUploadUrl();
  const createPostMutation = useCreatePost();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (newTag && !hashtags.includes(newTag)) {
        setHashtags([...hashtags, newTag]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!file) return;
    setIsUploading(true);

    try {
      // 1. Get presigned URL
      const { uploadURL, objectPath } = await requestUrlMutation.mutateAsync({
        data: {
          name: file.name,
          size: file.size,
          contentType: file.type
        }
      });

      // 2. Upload file to GCS
      await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });

      // 3. Create post
      await createPostMutation.mutateAsync({
        data: {
          caption: caption || undefined,
          mediaUrl: `/api/storage${objectPath}`,
          mediaType: file.type.startsWith('video/') ? 'video' : 'image',
          hashtags: hashtags
        }
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-card rounded-2xl border border-border p-6 shadow-xl dark" data-testid="upload-flow">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Create New Post</h2>
      
      {!file ? (
        <div 
          className="border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          data-testid="upload-dropzone"
        >
          <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">Drag photos or videos here</p>
          <p className="text-sm text-muted-foreground">JPG, PNG, MP4 up to 50MB</p>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            accept="image/*,video/*" 
            className="hidden" 
          />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative aspect-square w-full max-w-sm mx-auto rounded-xl overflow-hidden bg-black border border-border">
            {file.type.startsWith('video/') ? (
              <video src={previewUrl!} className="w-full h-full object-cover" controls />
            ) : (
              <img src={previewUrl!} className="w-full h-full object-cover" alt="Preview" />
            )}
            <button 
              className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70 backdrop-blur-sm"
              onClick={() => { setFile(null); setPreviewUrl(null); }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <Textarea 
              placeholder="Write a caption..." 
              value={caption}
              onChange={e => setCaption(e.target.value)}
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
              {hashtags.map(tag => (
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
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={handleTagInput}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              data-testid="input-hashtags"
            />
          </div>

          <Button 
            className="w-full bg-gradient-to-r from-primary to-[#06b6d4] text-white" 
            onClick={handleSubmit}
            disabled={isUploading}
            data-testid="button-submit-post"
          >
            {isUploading ? "Uploading..." : "Share Post"}
          </Button>
        </div>
      )}
    </div>
  );
}
