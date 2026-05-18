import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, ChevronRight } from "lucide-react";

interface Message {
  role: "bot" | "user";
  text: string;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

// Multiple variants per topic — bot picks randomly to avoid repetition
const TOPIC_RESPONSES: Record<string, string[]> = {
  greeting: [
    "Hey! 👋 I'm SQUAD, your Squawk guide. Ask me anything about the app, the 10K Squad NFTs, or how things work!",
    "What's good! I'm SQUAD 🐦 Drop your question — I know everything about Squawk.",
    "Hey there! SQUAD here. Whether it's posting, DMs, NFTs, or settings — I've got you.",
  ],
  post: [
    "Creating a post is easy — hit the ✦ button in the sidebar (desktop) or bottom bar (mobile). Upload a photo or video, write a caption, add hashtags like #squawk to get discovered, then tap Post.",
    "Tap the ✦ Create button to make a post. You can upload images or short clips, write a caption up to 2,200 characters, and tag friends or locations. More hashtags = more reach!",
    "To post, use the Create button (the ✦ icon). You can add up to 10 hashtags. Pro tip: post when your followers are most active — usually evenings — for max engagement.",
  ],
  story: [
    "Stories vanish after 24 hours! Tap your profile circle on the home feed to add one. You can upload photos or short videos up to 60 seconds. Your followers see it at the top of their feed.",
    "Add a story by tapping your avatar ring on the home screen. Stories are great for behind-the-scenes content — they disappear in 24 hours and show up in the stories bar.",
    "Stories live for 24 hours and show at the very top of your followers' feeds. Tap your circle icon on the home page to upload. Photos and videos both work!",
  ],
  follow: [
    "To follow someone, visit their profile and hit the Follow button. You can also find people on the Explore page under 'Suggested' or by searching their username.",
    "Go to any user's profile and tap Follow. Want to find new people? Check the Explore page — it shows trending creators and suggested accounts based on who you follow.",
    "Following works just like other social apps — visit a profile, tap Follow. Unfollow anytime from their profile or from your Following list on your own profile page.",
  ],
  message: [
    "To DM someone, visit their profile and tap the Message button. Or go to the Messages tab and hit + to search by name. You can search for any user even if you don't follow them.",
    "DMs are in the Messages tab. Tap the + button and start typing a name — live search shows matching users instantly. Tap any result to open a chat.",
    "Hit the Message button on any profile, or use the Messages tab in the sidebar. Type in the search box to find any user by name or username. Messages refresh every 3 seconds.",
  ],
  nft: [
    "The 10K Squad is a collection of 10,000 unique Squawk bird NFTs. Each bird has hand-drawn traits — outfits, backgrounds, accessories. Floor price is 0.45 ETH. Holders get exclusive perks on Squawk.",
    "10K Squad NFTs are 10,000 one-of-a-kind Squawk birds on-chain. There are 4 rarity tiers: Legendary (150), Epic (850), Rare (2,000), and Common (7,000). Higher rarity = more perks.",
    "The 10K Squad NFT collection launched with 10,000 birds, 420+ unique traits, and 3,812 current holders. Grab one on OpenSea to unlock exclusive Squawk badges and features.",
  ],
  rarity: [
    "There are 4 rarity tiers: Legendary (150 birds 🔥), Epic (850 birds 💜), Rare (2,000 birds 💙), and Common (7,000 birds 💚). Legendary holders get maximum perks on Squawk.",
    "Rarity breakdown: Legendary = 150 birds (ultra rare), Epic = 850, Rare = 2,000, Common = 7,000. Each tier unlocks different badge levels and feed features.",
    "Legendaries are the crown jewel — only 150 exist out of 10,000. Then Epic (850), Rare (2,000), and Common (7,000). The rarer your bird, the more exclusive your Squawk perks.",
  ],
  explore: [
    "The Explore page is your discovery hub. It shows trending posts, popular hashtags, and suggested creators. Great way to find new people and trending content.",
    "Explore (the compass icon) surfaces trending hashtags, popular posts, and recommended accounts. Search for any user or hashtag from the top search bar.",
    "Hit Explore to browse trending content and find new creators. You'll see suggested users, hot hashtags, and the most-liked posts right now.",
  ],
  flow: [
    "Flow is Squawk's short-video feed — like Reels but for the squad. Swipe up to move to the next video. Tap the heart to like, the comment bubble to reply.",
    "The Flow tab (play icon) is full-screen video content. Scroll up for the next clip, tap the screen to pause/play. You can mute/unmute with the volume button in the top right.",
    "Flow = Squawk's video feed. Tap the Flow icon (▶) in the sidebar. Sample videos from creators are always loading. Creators can post their own videos through the Create button.",
  ],
  notification: [
    "Notifications are in the bell icon. You'll get alerts for new likes, comments, follows, and replies. The badge shows your unread count — tap 'Mark all read' to clear it.",
    "The bell icon shows all your activity — likes, comments, new followers, mentions. A pink badge appears when you have unread notifications. They update every 30 seconds.",
    "Check your notifications via the bell icon in the sidebar. New activity (likes, follows, comments) shows up there. The live badge counter updates automatically.",
  ],
  profile: [
    "Your profile shows all your posts, your follower and following counts (tap them to see the full list), your bio, and your cover banner. Tap 'Edit Profile' to make changes.",
    "On your profile page, tap your follower or following count to see the full list of people. Edit your photo, bio, and banner by clicking Edit Profile — or tap your banner directly to change it.",
    "Profile pages show your post grid, stats, and bio. Tap the followers/following numbers to see who's following you or who you follow. Edit everything from the Settings page.",
  ],
  banner: [
    "To change your cover banner: go to your profile page and click anywhere on the banner, or tap the 'Edit banner' button in the bottom-right corner of it. Upload any image.",
    "Your profile banner is fully editable! Tap it directly on your profile page to upload a new image. It uploads instantly and updates live.",
    "Visit your profile and tap the banner area (or the small 'Edit banner' button) to change it. Works on desktop and mobile. PNG or JPG, any size.",
  ],
  settings: [
    "Settings lets you update your display name, bio, profile photo, and cover banner. You can also log out from there.",
    "In Settings (gear icon at the bottom of the sidebar), you can change your display name, write a bio, swap your profile photo, and update your banner image.",
    "Settings → Edit Profile. Change your name, bio, avatar, and banner. Usernames can't be changed once set, but everything else is editable.",
  ],
  hashtag: [
    "Hashtags power discovery on Squawk! Add them in your caption like #squawk or #nft. Popular ones show up on the Explore page. Up to 10 hashtags work best.",
    "Use hashtags to get your posts seen by more people. Type # followed by a word in your caption. Trending hashtags appear in Explore — jumping on them boosts reach.",
    "Hashtags help your content surface in search and Explore. Add up to 30 but 5–10 focused ones get the best engagement. Check Explore to see which are trending now.",
  ],
  theme: [
    "You can switch between dark and light mode using the sun/moon button near the bottom of the sidebar. Your preference is saved and stays that way on future visits.",
    "Dark mode = deep purple vibes. Light mode = clean white with purple accents. Toggle it with the sun (☀️) or moon (🌙) button in the sidebar.",
    "The theme toggle is in the sidebar — look for the sun or moon icon. Squawk looks great in both dark purple and light mode. Try both!",
  ],
  like: [
    "Double-tap any post or tap the heart icon to like it. The creator gets a notification. Liked posts are saved in your activity for later.",
    "To like a post, tap the ❤️ heart icon below it. You can also double-tap the image to instantly like. Likes show up in the creator's notifications.",
    "Liking a post is just a tap on the heart. In Flow (video mode), tap the heart on the right side panel. Your likes help content trend on Explore.",
  ],
  comment: [
    "Tap the comment bubble on any post to leave a comment. You can reply to individual comments too. Use @username to mention someone.",
    "Comments are under the speech bubble icon on posts. Tap it to read all comments or add your own. Mentioning @users in comments sends them a notification.",
    "To comment, tap the comment icon on any post. Long press a comment to reply directly to it. Your comment shows up in the post owner's notifications.",
  ],
  save: [
    "Tap the bookmark icon to save any post. Saved posts go to your private collection — only you can see them.",
    "The 🔖 bookmark saves posts for later. It's private — no one can see your saved collection except you. Great for keeping inspo or content you want to revisit.",
  ],
  search: [
    "Use the Explore page to search for users, hashtags, or posts. Type in the search bar at the top. Results update as you type.",
    "Search lives in the Explore tab. You can search by username, display name, or hashtag. Try typing a name — live results appear instantly.",
  ],
  floor: [
    "The current floor price for a 10K Squad NFT is 0.45 ETH on OpenSea. Prices fluctuate with market demand. Legendary birds typically trade much higher.",
    "Floor price is 0.45 ETH as of now. This is the cheapest you can buy a 10K Squad bird. Legendaries go for significantly more. Check OpenSea for live prices.",
  ],
  default: [
    "Hmm, I'm not sure about that one! Try asking about posting, stories, NFTs, messages, profiles, or the 10K Squad collection.",
    "I don't have info on that right now. Ask me about Squawk features like posting, DMs, notifications, the Flow tab, or the 10K Squad NFTs!",
    "Good question — but that's outside my knowledge! I can help with posting, stories, follows, messages, profile editing, NFTs, or anything else Squawk-related.",
    "Not sure about that one! But I can explain posting, stories, DMs, the Flow tab, NFT rarity tiers, profile editing, or notifications. What would you like to know?",
  ],
};

const QUICK_SUGGESTIONS = [
  "How do I post?",
  "What are 10K Squad NFTs?",
  "How do I DM someone?",
  "What are the rarity tiers?",
  "How do I change my banner?",
];

function getTopicKey(input: string): string {
  const lower = input.toLowerCase();
  const KEYWORDS: [string, string[]][] = [
    ["greeting", ["hello", "hi", "hey", "what's up", "sup", "yo", "howdy", "hii", "heya"]],
    ["post", ["post", "upload", "publish", "create", "share", "caption"]],
    ["story", ["story", "stories", "24 hour", "disappear"]],
    ["follow", ["follow", "unfollow", "following", "follower"]],
    ["message", ["message", "dm", "chat", "direct", "talk", "convers"]],
    ["nft", ["nft", "10k squad", "10,000", "opensea", "mint", "on-chain", "blockchain", "collection"]],
    ["rarity", ["legendary", "epic", "rare", "common", "rarity", "tier", "trait"]],
    ["explore", ["explore", "discover", "search", "trending", "find"]],
    ["flow", ["flow", "reel", "video", "short", "tiktok", "watch"]],
    ["notification", ["notif", "alert", "bell", "badge", "unread", "mention"]],
    ["profile", ["profile", "my page", "account", "bio", "follower count", "following count"]],
    ["banner", ["banner", "cover", "header image"]],
    ["settings", ["setting", "edit profile", "edit account"]],
    ["hashtag", ["hashtag", "#", "tag", "trending tag"]],
    ["theme", ["theme", "dark mode", "light mode", "dark/light", "toggle", "sun", "moon"]],
    ["like", ["like", "heart", "double tap", "❤"]],
    ["comment", ["comment", "reply", "feedback", "respond"]],
    ["save", ["save", "bookmark", "saved post"]],
    ["search", ["search", "look up"]],
    ["floor", ["floor price", "floor", "eth", "price", "buy", "cost", "worth"]],
  ];

  for (const [key, keywords] of KEYWORDS) {
    if (keywords.some(kw => lower.includes(kw))) return key;
  }
  return "default";
}

function getResponse(input: string, recentTopics: string[]): { text: string; topic: string } {
  const topic = getTopicKey(input);
  const variants = TOPIC_RESPONSES[topic] || TOPIC_RESPONSES.default;
  
  // Avoid repeating the exact same variant — track last used index per topic
  const lastUsed = recentTopics.filter(t => t === topic).length;
  const idx = lastUsed % variants.length;
  
  // For repeated same-topic asks, rotate through variants
  return { text: variants[idx], topic };
}

export default function SquawkBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "Hey! I'm SQUAD 🐦 Your Squawk guide. Ask me anything — posting, stories, NFTs, DMs, or the 10K Squad collection!" }
  ]);
  const [input, setInput] = useState("");
  const [topicHistory, setTopicHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = (text?: string) => {
    const trimmed = (text || input).trim();
    if (!trimmed) return;
    const { text: responseText, topic } = getResponse(trimmed, topicHistory);
    setMessages(prev => [
      ...prev,
      { role: "user", text: trimmed },
      { role: "bot", text: responseText },
    ]);
    setTopicHistory(prev => [...prev, topic]);
    setInput("");
    setShowSuggestions(false);
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
            style={{ maxHeight: "min(520px, 80dvh)" }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0"
              style={{ background: "linear-gradient(135deg, rgba(147,51,234,0.3), rgba(219,39,119,0.2))" }}
            >
              <div className="flex items-center gap-3">
                <img src={`${BASE}/squad-bot.jpg`} alt="SQUAD" className="w-10 h-10 rounded-full object-cover border-2 border-primary/40 shadow-lg" />
                <div>
                  <div className="font-black text-foreground text-sm">SQUAD</div>
                  <div className="text-[11px] text-primary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                    Online · Squawk guide
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
                  {m.role === "bot" && (
                    <img src={`${BASE}/squad-bot.jpg`} alt="SQUAD" className="w-6 h-6 rounded-full object-cover mr-2 mt-1 shrink-0 border border-border" />
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.18 }}
                    className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-sm font-medium"
                        : "bg-muted text-foreground border border-border/50 rounded-bl-sm"
                    }`}
                  >
                    {m.text}
                  </motion.div>
                </div>
              ))}

              {/* Quick suggestion chips — show only at start */}
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

              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border shrink-0">
              <div className="flex gap-2 items-center bg-muted/50 border border-border rounded-2xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary transition-all">
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && send()}
                  placeholder="Ask SQUAD anything..."
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground py-1"
                />
                <button
                  onClick={() => send()}
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
