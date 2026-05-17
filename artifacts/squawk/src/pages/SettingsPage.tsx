import { useState, useRef, useEffect } from "react";
import { useGetMe, useUpdateMyProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useClerk } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Camera, LogOut, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const { data: me, isLoading } = useGetMe();
  const updateMutation = useUpdateMyProfile();
  const queryClient = useQueryClient();
  const { signOut } = useClerk();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (me) {
      setDisplayName(me.displayName || "");
      setBio(me.bio || "");
      setWebsite(me.website || "");
    }
  }, [me]);

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center dark">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
      setAvatarPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      let finalAvatarUrl = me?.avatarUrl ?? null;

      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);
        const res = await fetch("/api/storage/upload", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) throw new Error("Avatar upload failed");
        const { mediaUrl } = await res.json();
        finalAvatarUrl = mediaUrl;
      }

      await updateMutation.mutateAsync({
        data: {
          displayName,
          bio: bio || null,
          avatarUrl: finalAvatarUrl,
        }
      });

      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setAvatarFile(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      console.error(e);
      setSaveError(e?.message || "Something went wrong — please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto w-full min-h-[100dvh] bg-background p-4 md:p-8 dark">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Edit Profile</h1>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm mb-8 space-y-8">

        {/* Avatar Section */}
        <div className="flex flex-col md:flex-row items-center gap-6 pb-8 border-b border-border">
          <div className="relative group cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
            <Avatar className="w-24 h-24 border-2 border-border group-hover:border-primary transition-colors">
              <AvatarImage src={avatarPreview || me?.avatarUrl || ''} className="object-cover" />
              <AvatarFallback className="text-2xl bg-muted text-muted-foreground">{me?.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <input type="file" ref={avatarInputRef} onChange={handleAvatarSelect} accept="image/*" className="hidden" />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold">Profile Photo</h3>
            <p className="text-sm text-muted-foreground mb-3">JPG, GIF or PNG. Max size 5MB.</p>
            <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()}>Change Photo</Button>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Username</label>
            <Input value={me?.username || ""} disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
            <p className="text-xs text-muted-foreground">Usernames cannot be changed.</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Display Name</label>
            <Input
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="bg-input border-border focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Bio</label>
            <Textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              className="bg-input border-border focus-visible:ring-primary resize-none h-24"
              maxLength={150}
            />
            <div className="text-right text-xs text-muted-foreground">{bio.length} / 150</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Website (coming soon)</label>
            <Input
              value={website}
              onChange={e => setWebsite(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="bg-input border-border focus-visible:ring-primary"
              disabled
            />
          </div>
        </div>

        {saveError && (
          <p className="text-sm text-destructive text-center">{saveError}</p>
        )}

        {/* Save Button */}
        <div className="pt-6 border-t border-border flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving || !displayName.trim()}
            className="w-full md:w-40 h-12 rounded-full font-bold bg-gradient-to-r from-primary to-[#c084fc] text-white hover:opacity-90 border-0 shadow-lg shadow-primary/20"
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

      {/* Danger Zone */}
      <div className="bg-destructive/5 border border-destructive/20 rounded-3xl p-6 mb-20">
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
