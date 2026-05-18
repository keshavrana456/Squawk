import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Bot } from "lucide-react";

interface Message {
  role: "bot" | "user";
  text: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const RESPONSES: Record<string, string> = {
  default: "I'm SquawkBot! Ask me anything about Squawk or the 10K Squad NFT collection.",
  hello: "Hey! I'm SquawkBot, your guide to the Squawk universe. What do you want to know?",
  hi: "Hey! I'm SquawkBot, your guide to the Squawk universe. What do you want to know?",
  post: "Posting on Squawk is easy — tap the ✦ button in the sidebar or bottom bar. You can upload images or short videos. Add captions and hashtags to get discovered!",
  story: "To add a story, tap your profile picture in the home feed or the circle with your avatar. Stories expire after 24 hours. You can upload photos or videos up to 15 seconds.",
  follow: "Go to a user's profile and tap Follow. You can also discover people in the Explore page. New users are auto-followed by the 10K Squad bots so your feed is never empty!",
  message: "Tap the Message button on any user's profile to start a DM. Or head to the Messages tab in the sidebar.",
  nft: "The 10K Squad is a collection of 10,000 unique Squawk bird NFTs. Each one is hand-drawn with different traits — outfits, expressions, accessories, and backgrounds. Holders get exclusive perks on Squawk!",
  "10k": "10K Squad is Squawk's official NFT collection — 10,000 unique bird characters. They live on the blockchain and give holders special badges, exclusive feeds, and community perks.",
  squad: "The Squad is the Squawk community! Join by grabbing a 10K Squad NFT or just by being active on the platform. Post, follow, and squawk your way to the top.",
  notification: "Notifications are in the bell icon. You'll get alerts for likes, comments, follows, and mentions. Tap 'Mark all read' to clear them.",
  profile: "Your profile shows your posts, followers, and following count. Tap Edit Profile in the sidebar to update your photo, bio, and cover banner.",
  explore: "The Explore page shows trending posts, top hashtags, and suggested users. Great way to find new people to follow!",
  reel: "Flow (Reels) are short videos from creators you follow. Swipe through in the Flow tab.",
  settings: "In Settings you can update your display name, bio, profile photo, and cover banner.",
  hashtag: "Use hashtags in your posts to get discovered. Trending hashtags show up in the Explore page.",
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
    { role: "bot", text: "Hey! I'm SquawkBot 🐦 Ask me about posting, stories, NFTs, or anything Squawk!" }
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    const userMsg: Message = { role: "user", text: trimmed };
    const botMsg: Message = { role: "bot", text: getResponse(trimmed) };
    setMessages(prev => [...prev, userMsg, botMsg]);
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
            className="w-[340px] max-h-[480px] rounded-3xl border border-border shadow-2xl shadow-black/60 flex flex-col overflow-hidden"
            style={{ background: "hsl(268 48% 9%)" }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-[#a21caf]/30 to-[#db2777]/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <img src={`${BASE}/logo.png`} alt="bot" className="w-6 h-6 object-contain" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">SquawkBot</div>
                  <div className="text-[11px] text-pink-300">Your Squawk guide</div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 min-h-0" style={{ maxHeight: 320 }}>
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-pink-500 to-purple-600 text-white rounded-br-sm"
                        : "bg-white/8 text-white/90 border border-white/10 rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="p-3 border-t border-border">
              <div className="flex gap-2 items-center bg-white/5 border border-white/10 rounded-2xl px-3 py-1.5">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-transparent outline-none text-sm text-white placeholder-white/30 py-1"
                />
                <button
                  onClick={send}
                  disabled={!input.trim()}
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center disabled:opacity-40 transition-opacity shrink-0"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
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
        className="w-14 h-14 rounded-full shadow-2xl shadow-pink-900/50 flex items-center justify-center relative"
        style={{ background: "linear-gradient(135deg, #ec4899, #9333ea)" }}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div key="bot" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <Bot className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-400 border-2 border-background animate-pulse" />
        )}
      </motion.button>
    </div>
  );
}
