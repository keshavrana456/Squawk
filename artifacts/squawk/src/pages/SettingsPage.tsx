import { useGetMe } from "@workspace/api-client-react";
import { useClerk } from "@clerk/react";
import { useLocation } from "wouter";
import { LogOut, Moon, Sun, Info, Mail, Shield, ChevronRight, UserCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useAboutModal } from "@/components/AboutModal";

export default function SettingsPage() {
  const { data: me } = useGetMe();
  const { signOut } = useClerk();
  const { theme, toggle: toggleTheme } = useTheme();
  const [, setLocation] = useLocation();
  const about = useAboutModal();

  const handleSendReport = () => {
    const subject = encodeURIComponent("Squawk Report / Feedback");
    const body = encodeURIComponent(`Username: @${me?.username ?? "unknown"}\n\nDescribe your issue or feedback below:\n\n`);
    window.open(`mailto:squawk069@gmail.com?subject=${subject}&body=${body}`, "_blank");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto w-full min-h-[100dvh] bg-background p-4 md:p-8 pb-24">
      <h1 className="text-3xl font-bold mb-8 text-foreground">Settings</h1>

      {/* Edit Profile link */}
      <div className="bg-card border border-border rounded-3xl p-2 mb-6">
        <button
          onClick={() => setLocation("/edit-profile")}
          className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-muted/60 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-foreground">Edit Profile</p>
              <p className="text-xs text-muted-foreground">Photo, banner, username, bio, links</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
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
      <div className="bg-card border border-border rounded-3xl overflow-hidden mb-6">
        {/* Banner */}
        <div className="relative h-28 overflow-hidden">
          <img src="/nft-banner.png" alt="10K Squad" className="w-full h-full object-cover" style={{ objectPosition: "center 30%" }} />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.7))" }} />
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <img src="/logo.png" alt="Squawk" className="w-8 h-8 rounded-xl ring-1 ring-purple-500/40" />
            <div>
              <div className="text-white font-black text-base leading-none">Squawk</div>
              <div className="text-white/50 text-[10px]">10K Squad · Monad · v1.0.0</div>
            </div>
          </div>
        </div>

        <div className="p-5">
          <h3 className="text-base font-bold text-foreground mb-3 flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-400" />
            About
          </h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            Squawk is the social home of the <span className="text-foreground font-semibold">10K Squad</span> NFT community on <span className="text-foreground font-semibold">Monad</span>. Posts, reels, chirps, DMs, explore, contests, and holder perks — all in one place.
          </p>
          <div className="space-y-2 text-sm mb-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Contact</span>
              <a href="mailto:squawk069@gmail.com" className="text-primary hover:underline text-xs">squawk069@gmail.com</a>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Community</span>
              <a href="https://x.com/the10ksquad" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">@the10kSquad <ExternalLink className="w-3 h-3" /></a>
            </div>
          </div>
          <button
            onClick={about.show}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:scale-[1.01]"
            style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.25), rgba(236,72,153,0.18))", border: "1px solid rgba(147,51,234,0.35)", color: "rgb(216,180,254)" }}
          >
            <Info className="w-4 h-4" />
            View Full Project Details
          </button>
          <p className="text-center text-xs text-muted-foreground/50 mt-3">Made with love for the 10K Squad community on Monad</p>
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

    {about.modal}
  );
}
