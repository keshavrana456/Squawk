import { useState, useRef, useEffect } from "react";
import { useGetMe, useUpdateMyProfile, getGetMeQueryKey, getGetUserByUsernameQueryKey } from "@workspace/api-client-react";
import { useClerk } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Camera, LogOut, Check, ImagePlus, Moon, Sun, Info, Mail, Shield, ChevronRight, Link as LinkIcon, Clock, AtSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

const USERNAME_COOLDOWN_DAYS = 14;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

function getDaysUntilCanChange(usernameChangedAt: string | null | undefined): number | null {
  if (!usernameChangedAt) return null;
  const daysSince = (Date.now() - new Date(usernameChangedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince >= USERNAME_COOLDOWN_DAYS) return null;
  return Math.ceil(USERNAME_COOLDOWN_DAYS - daysSince);
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/storage/upload", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const { mediaUrl } = await res.json();
  return mediaUrl;
}

export default function SettingsPage() {
  const { data: me, isLoading } = useGetMe();
  const updateMutation = useUpdateMyProfile();
  const queryClient = useQueryClient();
  const { signOut } = useClerk();
  const { theme, toggle: toggleTheme } = useTheme();
  const [, setLocation] = useLocation();

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

  useEffect(() => {
    if (me) {
      setUsername(me.username || "");
      setDisplayName(me.displayName || "");
      setBio(me.bio || "");
      setWebsite((me as any).website || "");
    }
  }, [me]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

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
      const finalUsername = usernameChanged ? username.trim() : (me?.username ?? "");
      setTimeout(() => {
        setSaved(false);
        if (finalUsername) setLocation(`/profile/${finalUsername}`);
      }, 1000);
    } catch (e: any) {
      console.error(e);
      const msg = e?.response?.data?.error ?? e?.message ?? "Something went wrong — please try again.";
      setSaveError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendReport = () => {
    const subject = encodeURIComponent("Squawk Report / Feedback");
    const body = encodeURIComponent(`Username: @${me?.username ?? "unknown"}\n\nDescribe your issue or feedback below:\n\n`);
    window.open(`mailto:squawk069@gmail.com?subject=${subject}&body=${body}`, "_blank");
  };

  const currentBanner = bannerPreview || me?.coverUrl || null;
  const currentAvatar = avatarPreview || me?.avatarUrl || '';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto w-full min-h-[100dvh] bg-background p-4 md:p-8 pb-24">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Settings</h1>

      {/* Profile Card */}
      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm mb-6">

        {/* Banner Section */}
        <div
          className="relative h-36 md:h-48 w-full cursor-pointer group"
          onClick={() => bannerInputRef.current?.click()}
        >
          {currentBanner ? (
            <img src={currentBanner} alt="Banner" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-pink-400/15 to-[#c084fc]/20" />
          )}
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ImagePlus className="w-7 h-7 text-white mb-1" />
            <span className="text-white text-sm font-medium">Change Banner</span>
          </div>
          <input type="file" ref={bannerInputRef} onChange={handleBannerSelect} accept="image/*" className="hidden" />
        </div>

        <div className="p-6 space-y-8">
          {/* Avatar Section */}
          <div className="flex flex-col md:flex-row items-center gap-6 pb-8 border-b border-border">
            <div className="relative group cursor-pointer -mt-16 md:-mt-20 z-10" onClick={() => avatarInputRef.current?.click()}>
              <Avatar className="w-24 h-24 border-4 border-card group-hover:border-primary transition-colors shadow-lg">
                <AvatarImage src={currentAvatar} className="object-cover" />
                <AvatarFallback className="text-2xl bg-muted text-muted-foreground">{me?.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <input type="file" ref={avatarInputRef} onChange={handleAvatarSelect} accept="image/*" className="hidden" />
            </div>
            <div className="text-center md:text-left md:mt-0">
              <h3 className="text-lg font-bold">Profile Photo</h3>
              <p className="text-sm text-muted-foreground mb-3">JPG, GIF or PNG. Max size 5MB.</p>
              <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()}>Change Photo</Button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-5">
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
                      className={`bg-input border-border focus-visible:ring-primary pl-7 ${usernameError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      maxLength={20}
                    />
                  </div>
                  {usernameError ? (
                    <p className="text-xs text-destructive">{usernameError}</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      3–20 characters · letters, numbers, underscores · changeable once every 14 days
                    </p>
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
                placeholder="Tell us about yourself… URLs will be clickable on your profile"
                className="bg-input border-border focus-visible:ring-primary resize-none h-24"
                maxLength={150}
              />
              <div className="text-right text-xs text-muted-foreground">{bio.length} / 150</div>
            </div>

            {/* Website / Link */}
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
              <p className="text-xs text-muted-foreground">Shown as a clickable link on your profile.</p>
            </div>
          </div>

          {saveError && (
            <p className="text-sm text-destructive text-center">{saveError}</p>
          )}

          {/* Save Button */}
          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving || !displayName.trim()}
              className="w-full md:w-44 h-12 rounded-full font-bold bg-gradient-to-r from-primary to-[#c084fc] text-white hover:opacity-90 border-0 shadow-lg shadow-primary/20"
            >
              {isSaving ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : saved ? (
                <div className="flex items-center gap-2"><Check className="w-5 h-5" /> Saved</div>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-card border border-border rounded-3xl p-5 mb-6">
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <Sun className="w-4 h-4 text-yellow-400" />
          Appearance
        </h3>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-muted/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            {theme === "dark" ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-yellow-400" />}
            <span className="font-medium text-foreground">{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
          </div>
          <div className={`relative w-12 h-6 rounded-full transition-colors ${theme === "dark" ? "bg-primary" : "bg-muted"}`}>
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${theme === "dark" ? "translate-x-7" : "translate-x-1"}`} />
          </div>
        </button>
      </div>

      {/* Support */}
      <div className="bg-card border border-border rounded-3xl p-5 mb-6">
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-400" />
          Support
        </h3>
        <button
          onClick={handleSendReport}
          className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-muted/60 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="text-left">
              <p className="font-medium text-foreground">Send Report / Feedback</p>
              <p className="text-xs text-muted-foreground">squawk069@gmail.com</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* About */}
      <div className="bg-card border border-border rounded-3xl p-5 mb-6">
        <h3 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
          <Info className="w-4 h-4 text-purple-400" />
          About
        </h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span className="font-medium text-foreground">App</span>
            <span>Squawk</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-foreground">Version</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-foreground">Built for</span>
            <span>10K Squad · Monad</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium text-foreground">Contact</span>
            <a href="mailto:squawk069@gmail.com" className="text-primary hover:underline">squawk069@gmail.com</a>
          </div>
          <div className="pt-3 border-t border-border text-center text-xs text-muted-foreground/60">
            Made with love for the 10K Squad community on Monad
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-3xl p-6">
        <h3 className="text-lg font-bold text-destructive mb-2">Account Access</h3>
        <p className="text-sm text-muted-foreground mb-6">Log out of your Squawk account on this device.</p>
        <Button
          variant="outline"
          className="w-full md:w-auto border-destructive text-destructive hover:bg-destructive hover:text-white"
          onClick={() => signOut({ redirectUrl: "/" })}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Log Out
        </Button>
      </div>
    </motion.div>
  );
}
