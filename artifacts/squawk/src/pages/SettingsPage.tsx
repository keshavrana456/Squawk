import { useGetMe } from "@workspace/api-client-react";
import { useClerk } from "@clerk/react";
import { useLocation } from "wouter";
import { LogOut, Moon, Sun, Info, Mail, Shield, ChevronRight, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";

export default function SettingsPage() {
  const { data: me } = useGetMe();
  const { signOut } = useClerk();
  const { theme, toggle: toggleTheme } = useTheme();
  const [, setLocation] = useLocation();

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
