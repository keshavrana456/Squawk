import { useState, useRef, useEffect, useCallback } from "react";
import { useGetMe, useUpdateMyProfile, getGetMeQueryKey, getGetUserByUsernameQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Camera, ImagePlus, Check, AtSign, Clock, Link as LinkIcon, ChevronLeft, Move,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const USERNAME_COOLDOWN_DAYS = 14;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

function getDaysUntilCanChange(usernameChangedAt: string | null | undefined): number | null {
  if (!usernameChangedAt) return null;
  const daysSince = (Date.now() - new Date(usernameChangedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince >= USERNAME_COOLDOWN_DAYS) return null;
  return Math.ceil(USERNAME_COOLDOWN_DAYS - daysSince);
}

const LARGE_FILE_THRESHOLD = 15 * 1024 * 1024;

async function uploadFile(file: File): Promise<string> {
  if (file.size > LARGE_FILE_THRESHOLD) {
    const signRes = await fetch("/api/storage/sign-upload", {
      method: "POST",
      credentials: "include",
    });
    if (!signRes.ok) throw new Error("Could not get upload credentials");
    const { signature, timestamp, apiKey, cloudName, folder } = await signRes.json();

    const resourceType = file.type.startsWith("video/") ? "video" : "image";
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", apiKey);
    form.append("timestamp", String(timestamp));
    form.append("signature", signature);
    form.append("folder", folder);

    const uploadRes = await fetch(uploadUrl, { method: "POST", body: form });
    if (!uploadRes.ok) throw new Error("Cloudinary upload failed");
    const data = await uploadRes.json();
    return data.secure_url;
  }

  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/storage/upload", { method: "POST", body: formData, credentials: "include" });
  if (!res.ok) throw new Error("Upload failed");
  const { mediaUrl } = await res.json();
  return mediaUrl;
}

export default function EditProfilePage() {
  const { data: me, isLoading } = useGetMe();
  const updateMutation = useUpdateMyProfile();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Banner position drag
  const [bannerOffsetY, setBannerOffsetY] = useState(0);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [repositionMode, setRepositionMode] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ y: number; offset: number } | null>(null);

  useEffect(() => {
    if (me) {
      setUsername(me.username || "");
      setDisplayName(me.displayName || "");
      setBio(me.bio || "");
      setWebsite((me as any).website || "");
      setBannerOffsetY((me as any).bannerOffsetY ?? 0);
    }
  }, [me]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleBannerSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setBannerFile(e.target.files[0]);
      setBannerPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  // Pointer drag for banner reposition
  const handleBannerPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!repositionMode) return;
    dragStartRef.current = { y: e.clientY, offset: bannerOffsetY };
    setIsDraggingBanner(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  }, [repositionMode, bannerOffsetY]);

  const handleBannerPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current || !repositionMode) return;
    const containerH = bannerRef.current?.clientHeight ?? 192;
    const delta = ((e.clientY - dragStartRef.current.y) / containerH) * 100;
    const newOffset = Math.max(-45, Math.min(45, dragStartRef.current.offset + delta));
    setBannerOffsetY(Math.round(newOffset));
  }, [repositionMode]);

  const handleBannerPointerUp = useCallback(() => {
    dragStartRef.current = null;
    setIsDraggingBanner(false);
  }, []);

  const daysUntilCanChange = getDaysUntilCanChange((me as any)?.usernameChangedAt);
  const usernameChanged = username.trim() !== (me?.username || "");
  const usernameValid = USERNAME_REGEX.test(username.trim());

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    setUsernameError(null);
    if (val && !USERNAME_REGEX.test(val)) {
      setUsernameError("3–20 chars, letters, numbers, and underscores only.");
    }
  };

  const handleSave = async () => {
    if (usernameChanged && daysUntilCanChange !== null) {
      setSaveError(`You can change your username again in ${daysUntilCanChange} day${daysUntilCanChange === 1 ? "" : "s"}.`);
      return;
    }
    if (usernameChanged && !usernameValid) {
      setSaveError("Username must be 3–20 characters, letters, numbers, and underscores only.");
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      const [finalAvatarUrl, finalBannerUrl] = await Promise.all([
        avatarFile ? uploadFile(avatarFile) : Promise.resolve(me?.avatarUrl ?? null),
        bannerFile ? uploadFile(bannerFile) : Promise.resolve(me?.coverUrl ?? null),
      ]);

      const oldUsername = me?.username;
      await updateMutation.mutateAsync({
        data: {
          ...(usernameChanged ? { username: username.trim() } : {}),
          displayName,
          bio: bio || null,
          website: website.trim() || null,
          avatarUrl: finalAvatarUrl,
          coverUrl: finalBannerUrl,
          bannerOffsetY,
        } as any,
      });

      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      if (oldUsername) {
        await queryClient.invalidateQueries({ queryKey: getGetUserByUsernameQueryKey(oldUsername) });
      }
      if (usernameChanged && username.trim()) {
        await queryClient.invalidateQueries({ queryKey: getGetUserByUsernameQueryKey(username.trim()) });
      }
      setAvatarFile(null);
      setBannerFile(null);
      setSaved(true);
      toast({ title: "Profile saved!" });
      const finalUsername = usernameChanged ? username.trim() : (me?.username ?? "");
      setTimeout(() => {
        setSaved(false);
        if (finalUsername) setLocation(`/profile/${finalUsername}`);
      }, 800);
    } catch (e: any) {
      const msg = e?.response?.data?.error ?? e?.message ?? "Something went wrong — please try again.";
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const currentBanner = bannerPreview || me?.coverUrl || null;
  const currentAvatar = avatarPreview || me?.avatarUrl || '';
  const hasBannerImage = !!currentBanner;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto w-full min-h-[100dvh] bg-background pb-28">
      {/* Top nav */}
      <div className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-background/90 backdrop-blur-xl border-b border-border">
        <button
          onClick={() => setLocation(`/profile/${me?.username ?? ""}`)}
          className="p-2 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold flex-1">Edit Profile</h1>
        <Button
          onClick={handleSave}
          disabled={isSaving || !displayName.trim()}
          size="sm"
          className="rounded-full px-5 font-bold bg-gradient-to-r from-primary to-[#c084fc] text-white hover:opacity-90 border-0 shadow-lg shadow-primary/20 min-w-[80px]"
        >
          {isSaving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <div className="flex items-center gap-1.5"><Check className="w-4 h-4" /> Saved</div>
          ) : "Save"}
        </Button>
      </div>

      {/* Banner + Avatar card */}
      <div className="bg-card border-b border-border overflow-hidden">
        {/* Banner */}
        <div
          ref={bannerRef}
          className="relative h-44 md:h-56 w-full select-none"
          style={{ touchAction: repositionMode ? "none" : "auto", cursor: repositionMode ? (isDraggingBanner ? "grabbing" : "grab") : "default" }}
          onPointerDown={handleBannerPointerDown}
          onPointerMove={handleBannerPointerMove}
          onPointerUp={handleBannerPointerUp}
          onPointerCancel={handleBannerPointerUp}
        >
          {currentBanner ? (
            <img
              src={currentBanner}
              alt="Banner"
              className="w-full h-full object-cover pointer-events-none"
              style={{ objectPosition: `center ${50 + bannerOffsetY}%` }}
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-pink-400/15 to-[#c084fc]/20" />
          )}

          {/* Reposition mode overlay */}
          {repositionMode && hasBannerImage && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/30 pointer-events-none">
              <Move className="w-8 h-8 text-white drop-shadow-lg" />
              <span className="text-white text-sm font-semibold drop-shadow">Drag to reposition</span>
            </div>
          )}

          {/* Banner controls (not in reposition mode) */}
          {!repositionMode && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 group">
              <div className="flex gap-3">
                <button
                  className="flex items-center gap-1.5 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-black/80 transition-colors"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  <ImagePlus className="w-4 h-4" />
                  Change
                </button>
                {hasBannerImage && (
                  <button
                    className="flex items-center gap-1.5 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-black/80 transition-colors"
                    onClick={() => setRepositionMode(true)}
                  >
                    <Move className="w-4 h-4" />
                    Reposition
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Done repositioning button */}
          {repositionMode && (
            <button
              className="absolute bottom-3 right-3 bg-white text-black text-sm font-bold px-4 py-1.5 rounded-full shadow-lg"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); setRepositionMode(false); }}
            >
              Done
            </button>
          )}

          <input type="file" ref={bannerInputRef} onChange={handleBannerSelect} accept="image/*" className="hidden" />
        </div>

        {/* Avatar */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12 mb-1">
            <div
              className="relative group cursor-pointer shrink-0"
              onClick={() => avatarInputRef.current?.click()}
            >
              <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
                <AvatarImage src={currentAvatar} className="object-cover" />
                <AvatarFallback className="text-2xl bg-muted text-muted-foreground">{me?.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
                <span className="text-[10px] text-white font-semibold">Change</span>
              </div>
              <input type="file" ref={avatarInputRef} onChange={handleAvatarSelect} accept="image/*" className="hidden" />
            </div>
            <div className="pb-1">
              <p className="font-bold text-foreground text-base">{me?.displayName}</p>
              <p className="text-sm text-muted-foreground">@{me?.username}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="p-5 space-y-5">
        {/* Username */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <AtSign className="w-3.5 h-3.5 text-muted-foreground" />
            Username
          </label>
          {daysUntilCanChange !== null ? (
            <>
              <Input value={username} disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
              <p className="text-xs flex items-center gap-1.5 text-amber-500">
                <Clock className="w-3 h-3 shrink-0" />
                You can change your username again in {daysUntilCanChange} day{daysUntilCanChange === 1 ? "" : "s"}.
              </p>
            </>
          ) : (
            <>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">@</span>
                <Input
                  value={username}
                  onChange={e => handleUsernameChange(e.target.value)}
                  placeholder="yourhandle"
                  className={`bg-input border-border focus-visible:ring-primary pl-7 ${usernameError ? "border-destructive" : ""}`}
                  maxLength={20}
                />
              </div>
              {usernameError ? (
                <p className="text-xs text-destructive">{usernameError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">3–20 chars · letters, numbers, underscores · changeable every 14 days</p>
              )}
            </>
          )}
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Display Name</label>
          <Input
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="bg-input border-border focus-visible:ring-primary"
          />
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground">Bio</label>
          <Textarea
            value={bio}
            onChange={e => setBio(e.target.value)}
            placeholder="Tell us about yourself…"
            className="bg-input border-border focus-visible:ring-primary resize-none h-24"
            maxLength={150}
          />
          <div className="text-right text-xs text-muted-foreground">{bio.length} / 150</div>
        </div>

        {/* Website */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <LinkIcon className="w-3.5 h-3.5 text-muted-foreground" />
            Link
          </label>
          <Input
            value={website}
            onChange={e => setWebsite(e.target.value)}
            placeholder="https://yoursite.com"
            className="bg-input border-border focus-visible:ring-primary"
            type="url"
          />
        </div>

        {saveError && (
          <p className="text-sm text-destructive text-center bg-destructive/10 rounded-2xl px-4 py-3">{saveError}</p>
        )}
      </div>

      {/* Sticky save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/90 backdrop-blur-xl border-t border-border md:hidden">
        <Button
          onClick={handleSave}
          disabled={isSaving || !displayName.trim()}
          className="w-full h-12 rounded-full font-bold bg-gradient-to-r from-primary to-[#c084fc] text-white hover:opacity-90 border-0 shadow-lg shadow-primary/20"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <div className="flex items-center gap-2"><Check className="w-5 h-5" /> Saved!</div>
          ) : "Save Changes"}
        </Button>
      </div>
    </motion.div>
  );
}
