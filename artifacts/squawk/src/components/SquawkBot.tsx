import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";

interface Message {
  role: "bot" | "user";
  text: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const RESPONSES: Record<string, string> = {
  default: "I'm SQUAD, your Squawk guide! Ask me about posting, stories, NFTs, or anything Squawk.",
  hello: "Hey! I'm SQUAD 🐦 Your guide to the Squawk universe. What do you want to know?",
  hi: "Hey! I'm SQUAD 🐦 Your guide to the Squawk universe. What do you want to know?",
  hey: "Hey! I'm SQUAD 🐦 Your guide to the Squawk universe. What do you want to know?",
  post: "Posting on Squawk is easy — tap the ✦ button in the sidebar or bottom bar. You can upload images or short videos. Add captions and hashtags to get discovered!",
  story: "To add a story, tap your profile picture circle in the home feed. Stories expire after 24 hours. You can upload photos or videos up to 15 seconds.",
  follow: "Go to a user's profile and tap Follow. You can also find people in the Explore page. New users are auto-followed by 10K Squad bots so your feed is never empty!",
  message: "Tap the Message button on any user's profile to start a DM. Or head to the Messages tab. You can search for users by name too!",
  nft: "The 10K Squad is a collection of 10,000 unique Squawk bird NFTs. Each one is hand-drawn with different traits. Holders get exclusive perks on Squawk including special badges!",
  "10k": "10K Squad is Squawk's official NFT collection — 10,000 unique bird characters on-chain. Holders get special badges, exclusive feeds, and community perks.",
  squad: "The Squad is the Squawk community! Join by grabbing a 10K Squad NFT or just by being active. Post, follow, and squawk your way to the top.",
  notification: "Notifications live in the bell icon. You'll get alerts for likes, comments, follows, and mentions. Tap 'Mark all read' to clear them.",
  profile: "Your profile shows your posts, followers, and following. Tap Edit Profile in the sidebar to update your photo, bio, and cover banner.",
  banner: "To change your cover banner, go to your profile and click the 'Edit banner' button, or go to Settings > tap the banner area.",
  explore: "The Explore page shows trending posts, top hashtags, and suggested users. Great way to discover new creators!",
  flow: "Flow (Reels) are short videos from creators you follow. Scroll through in the Flow tab — swipe up for next!",
  reel: "Flow (Reels) are short videos from creators you follow. Scroll through in the Flow tab — swipe up for next!",
  settings: "In Settings you can update your display name, bio, profile photo, and cover banner.",
  hashtag: "Use hashtags in your posts to get discovered. Trending hashtags show up in the Explore page.",
  theme: "You can switch between dark and light mode using the sun/moon button in the sidebar!",
  dark: "You can switch to dark mode using the moon button in the sidebar navigation.",
  light: "You can switch to light mode using the sun button in the sidebar navigation.",
};

function getResponse(input: string): string {
  const lower = input.toLowerCase();
  for (const [key, val] of Object.entries(RESPONSES)) {
    if (key !== "default" && lower.includes(key)) return val;
  }
  return RESPONSES.default;
}

export default function SquawkBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hey! I'm SQUAD 🐦 Your Squawk guide. Ask me about posting, stories, NFTs, or anything!" }
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages(prev => [...prev,
      { role: "user", text: trimmed },
      { role: "bot", text: getResponse(trimmed) }
    ]);
    setInput("");
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-[340px] rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden bg-card"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border"
              style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.3), rgba(219,39,119,0.2))" }}>
              <div className="flex items-center gap-3">
                <img
                  src={`${BASE}/squad-bot.jpg`}
                  alt="SQUAD"
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary/40 shadow-lg"
                />
                <div>
                  <div className="font-black text-foreground text-sm">SQUAD</div>
                  <div className="text-[11px] text-primary">Your Squawk guide</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-4 flex flex-col gap-3" style={{ maxHeight: 320 }}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "bot" && (
                    <img src={`${BASE}/squad-bot.jpg`} alt="SQUAD" className="w-6 h-6 rounded-full object-cover mr-2 mt-1 shrink-0 border border-border" />
                  )}
                  <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm font-medium"
                      : "bg-muted text-foreground border border-border/50 rounded-bl-sm"
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="p-3 border-t border-border">
              <div className="flex gap-2 items-center bg-muted/50 border border-border rounded-2xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary transition-all">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  placeholder="Ask SQUAD anything..."
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder-muted-foreground py-1"
                />
                <button
                  onClick={send}
                  disabled={!input.trim()}
                  className="w-7 h-7 rounded-full bg-primary flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0 hover:opacity-90"
                >
                  <Send className="w-3.5 h-3.5 text-primary-foreground" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setOpen(o => !o)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="w-14 h-14 rounded-full shadow-2xl shadow-pink-900/40 overflow-hidden border-2 border-primary/50 relative"
      >
        <img src={`${BASE}/squad-bot.jpg`} alt="SQUAD" className="w-full h-full object-cover" />
        {!open && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-primary border-2 border-background animate-pulse" />
        )}
      </motion.button>
    </div>
  );
}
