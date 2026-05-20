import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ChevronRight } from "lucide-react";

interface Message {
  role: "assistant" | "user";
  content: string;
  typing?: boolean;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const QUICK_SUGGESTIONS = [
  "What is the 10K Squad NFT?",
  "How do I post on Squawk?",
  "Where can I buy a 10K Squad NFT?",
  "What perks do holders get?",
  "How do I DM someone?",
];

export default function SquawkBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hey! I'm SQUAD 🐦 Your AI guide for Squawk and the 10K Squad NFT on Monad. Ask me anything!",
    },
  ]);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const send = async (text?: string) => {
    const trimmed = (text || input).trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMsg];

    setMessages(updatedMessages);
    setInput("");
    setShowSuggestions(false);
    setIsTyping(true);

    try {
      const res = await fetch(`${BASE}/api/bot/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Try again in a moment!",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
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
            style={{ maxHeight: "min(540px, 80dvh)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.3), rgba(219,39,119,0.2))" }}
            >
              <div className="flex items-center gap-3">
                <img src={`${BASE}/squad-bot.jpg`} alt="SQUAD" className="w-10 h-10 rounded-full object-cover border-2 border-primary/40 shadow-lg" />
                <div>
                  <div className="font-black text-foreground text-sm">SQUAD AI</div>
                  <div className="text-[11px] text-primary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    Online · Powered by AI
                  </div>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="overflow-y-auto p-4 flex flex-col gap-3 flex-1">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "assistant" && (
                    <img src={`${BASE}/squad-bot.jpg`} alt="SQUAD" className="w-6 h-6 rounded-full object-cover mr-2 mt-1 shrink-0 border border-border" />
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.18 }}
                    className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm font-medium"
                        : "bg-muted text-foreground border border-border/50 rounded-bl-sm"
                    }`}
                  >
                    {m.content}
                  </motion.div>
                </div>
              ))}

              {/* Quick suggestion chips */}
              {showSuggestions && messages.length === 1 && (
                <div className="flex flex-col gap-1.5 mt-1 pl-8">
                  {QUICK_SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="flex items-center gap-1.5 text-left text-xs px-3 py-2 rounded-xl bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border/50 transition-colors w-full"
                    >
                      <ChevronRight className="w-3 h-3 text-primary shrink-0" />
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <img src={`${BASE}/squad-bot.jpg`} alt="SQUAD" className="w-6 h-6 rounded-full object-cover mr-2 mt-1 shrink-0 border border-border" />
                  <div className="bg-muted border border-border/50 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}

              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border shrink-0">
              <div className="flex gap-2 items-center bg-muted/50 border border-border rounded-2xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary transition-all">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
                  placeholder="Ask SQUAD anything..."
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground py-1"
                />
                <button
                  onClick={() => send()}
                  disabled={!input.trim() || isTyping}
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
