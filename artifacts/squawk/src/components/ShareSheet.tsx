import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Check, Copy, Share2, Send } from "lucide-react";
import {
  FaXTwitter,
  FaWhatsapp,
  FaTelegram,
  FaFacebook,
  FaReddit,
  FaDiscord,
  FaInstagram,
  FaSnapchat,
  FaLinkedin,
  FaPinterest,
  FaThreads,
  FaTiktok,
} from "react-icons/fa6";
import { useGetConversations, useGetMe } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/react";

interface ShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: number;
  caption?: string | null;
}

interface Platform {
  name: string;
  Icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  onClick: (url: string, text: string) => void;
}

function openUrl(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

const PLATFORMS: Platform[] = [
  {
    name: "X",
    Icon: FaXTwitter,
    iconColor: "#ffffff",
    bgColor: "#000000",
    onClick: (url, text) =>
      openUrl(
        `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      ),
  },
  {
    name: "WhatsApp",
    Icon: FaWhatsapp,
    iconColor: "#ffffff",
    bgColor: "#25D366",
    onClick: (url, text) =>
      openUrl(`https://wa.me/?text=${encodeURIComponent(text + " " + url)}`),
  },
  {
    name: "Telegram",
    Icon: FaTelegram,
    iconColor: "#ffffff",
    bgColor: "#2AABEE",
    onClick: (url, text) =>
      openUrl(
        `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      ),
  },
  {
    name: "Discord",
    Icon: FaDiscord,
    iconColor: "#ffffff",
    bgColor: "#5865F2",
    onClick: () => openUrl("https://discord.com/channels/@me"),
  },
  {
    name: "Instagram",
    Icon: FaInstagram,
    iconColor: "#ffffff",
    bgColor:
      "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
    onClick: async (url) => {
      try {
        await navigator.clipboard.writeText(url);
        alert("Link copied! Open Instagram and paste it.");
      } catch {}
    },
  },
  {
    name: "Snapchat",
    Icon: FaSnapchat,
    iconColor: "#000000",
    bgColor: "#FFFC00",
    onClick: (url) =>
      openUrl(
        `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`,
      ),
  },
  {
    name: "Facebook",
    Icon: FaFacebook,
    iconColor: "#ffffff",
    bgColor: "#1877F2",
    onClick: (url) =>
      openUrl(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      ),
  },
  {
    name: "Reddit",
    Icon: FaReddit,
    iconColor: "#ffffff",
    bgColor: "#FF4500",
    onClick: (url, text) =>
      openUrl(
        `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
      ),
  },
  {
    name: "Threads",
    Icon: FaThreads,
    iconColor: "#ffffff",
    bgColor: "#000000",
    onClick: (url, text) =>
      openUrl(
        `https://www.threads.net/intent/post?text=${encodeURIComponent(text + " " + url)}`,
      ),
  },
  {
    name: "LinkedIn",
    Icon: FaLinkedin,
    iconColor: "#ffffff",
    bgColor: "#0A66C2",
    onClick: (url) =>
      openUrl(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      ),
  },
  {
    name: "Pinterest",
    Icon: FaPinterest,
    iconColor: "#ffffff",
    bgColor: "#E60023",
    onClick: (url, text) =>
      openUrl(
        `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`,
      ),
  },
  {
    name: "TikTok",
    Icon: FaTiktok,
    iconColor: "#ffffff",
    bgColor: "#010101",
    onClick: async (url) => {
      try {
        await navigator.clipboard.writeText(url);
        alert("Link copied! Open TikTok and paste it.");
      } catch {}
    },
  },
];

function getInitials(n: string) {
  return n ? n.charAt(0).toUpperCase() : "?";
}

export function ShareSheet({
  open,
  onOpenChange,
  postId,
  caption,
}: ShareSheetProps) {
  const [copied, setCopied] = useState(false);
  const [sentTo, setSentTo] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState<number | null>(null);

  const { user } = useUser();
  const { data: me } = useGetMe({ query: { enabled: !!user && open } });
  const { data: conversations } = useGetConversations({
    query: { enabled: !!user && open },
  });

  const postUrl = `${window.location.origin}/post/${postId}`;
  const ogUrl = `${window.location.origin}/post/${postId}`;
  const shareText = caption
    ? `Check out this post on Squawk: "${caption}"`
    : "Check out this post on Squawk!";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: caption || "Squawk post", url: ogUrl });
      } catch {}
    }
  };

  const handleSendToDM = async (conversationId: number) => {
    if (sending) return;
    setSending(conversationId);
    try {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: postUrl,
          messageType: "shared_post",
          sharedPostId: postId,
        }),
      });
      setSentTo((prev) => new Set([...prev, conversationId]));
    } catch {}
    setSending(null);
  };

  // Determine the "other person" in each DM conversation
  const dmList = (conversations || [])
    .filter((c: any) => !c.isGroup)
    .slice(0, 8)
    .map((c: any) => {
      const other =
        (c.participants || []).find((p: any) => p.id !== (me as any)?.id) ||
        c.participants?.[0];
      return { conv: c, other };
    })
    .filter(({ other }: { other: any }) => !!other);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background border-border pb-safe">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center text-base font-semibold">
            Share post
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 space-y-4">
          {/* Send to friends section */}
          {dmList.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
                Send to friend
              </p>
              <div className="flex gap-4 overflow-x-auto pb-1 no-scrollbar">
                {dmList.map(({ conv, other }: { conv: any; other: any }) => {
                  const alreadySent = sentTo.has(conv.id);
                  const isSending = sending === conv.id;
                  return (
                    <button
                      key={conv.id}
                      onClick={() => !alreadySent && handleSendToDM(conv.id)}
                      className="flex flex-col items-center gap-1.5 shrink-0 group"
                    >
                      <div className="relative">
                        <Avatar
                          className={`w-14 h-14 border-2 transition-all ${alreadySent ? "border-green-500" : "border-border group-hover:border-primary"}`}
                        >
                          <AvatarFallback className="bg-primary/20 text-primary font-bold">
                            {getInitials(other.displayName || other.username)}
                          </AvatarFallback>
                        </Avatar>
                        {alreadySent && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-background">
                            <Check className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                        {isSending && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        {!alreadySent && !isSending && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center border-2 border-background opacity-0 group-hover:opacity-100 transition-opacity">
                            <Send className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground max-w-[56px] truncate text-center leading-tight">
                        {other.username}
                      </span>
                      {alreadySent && (
                        <span className="text-xs text-green-500 font-medium">
                          Sent
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="h-px bg-border mt-4" />
            </div>
          )}

          {/* Platform grid */}
          <div className="grid grid-cols-4 gap-y-5 gap-x-2">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.name}
                onClick={() => {
                  platform.onClick(ogUrl, shareText);
                  if (
                    !["Instagram", "TikTok", "Discord"].includes(platform.name)
                  ) {
                    onOpenChange(false);
                  }
                }}
                className="flex flex-col items-center gap-2 group"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 group-active:scale-95 transition-transform"
                  style={
                    platform.bgColor.startsWith("linear")
                      ? { background: platform.bgColor }
                      : { backgroundColor: platform.bgColor }
                  }
                >
                  <platform.Icon size={26} color={platform.iconColor} />
                </div>
                <span className="text-xs text-muted-foreground leading-tight text-center">
                  {platform.name}
                </span>
              </button>
            ))}

            {typeof navigator !== "undefined" &&
              typeof navigator.share === "function" && (
                <button
                  onClick={() => {
                    handleNativeShare();
                    onOpenChange(false);
                  }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-muted group-hover:scale-105 group-active:scale-95 transition-transform shadow-md">
                    <Share2 size={24} className="text-foreground" />
                  </div>
                  <span className="text-xs text-muted-foreground leading-tight text-center">
                    More
                  </span>
                </button>
              )}
          </div>

          <div className="h-px bg-border" />

          {/* Copy link */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-muted hover:bg-muted/70 active:scale-[0.98] transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-background flex items-center justify-center flex-shrink-0 border border-border">
              {copied ? (
                <Check size={18} className="text-green-500" />
              ) : (
                <Copy size={18} className="text-foreground" />
              )}
            </div>
            <div className="flex flex-col items-start min-w-0">
              <span className="text-sm font-semibold">Copy link</span>
              <span className="text-xs text-muted-foreground truncate w-full">
                {postUrl}
              </span>
            </div>
            {copied && (
              <span className="ml-auto text-xs text-green-500 font-medium flex-shrink-0">
                Copied!
              </span>
            )}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
