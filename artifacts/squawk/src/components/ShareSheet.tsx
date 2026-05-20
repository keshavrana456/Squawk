import { useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Check, Copy, Share2 } from "lucide-react";
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
      openUrl(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`),
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
      openUrl(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`),
  },
  {
    name: "Discord",
    Icon: FaDiscord,
    iconColor: "#ffffff",
    bgColor: "#5865F2",
    onClick: (url) =>
      openUrl(`https://discord.com/channels/@me`),
  },
  {
    name: "Instagram",
    Icon: FaInstagram,
    iconColor: "#ffffff",
    bgColor: "linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)",
    onClick: async (url) => {
      try {
        await navigator.clipboard.writeText(url);
        alert("Link copied! Open Instagram and paste it in your story or bio.");
      } catch {}
    },
  },
  {
    name: "Snapchat",
    Icon: FaSnapchat,
    iconColor: "#000000",
    bgColor: "#FFFC00",
    onClick: (url) =>
      openUrl(`https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(url)}`),
  },
  {
    name: "Facebook",
    Icon: FaFacebook,
    iconColor: "#ffffff",
    bgColor: "#1877F2",
    onClick: (url) =>
      openUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`),
  },
  {
    name: "Reddit",
    Icon: FaReddit,
    iconColor: "#ffffff",
    bgColor: "#FF4500",
    onClick: (url, text) =>
      openUrl(`https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`),
  },
  {
    name: "Threads",
    Icon: FaThreads,
    iconColor: "#ffffff",
    bgColor: "#000000",
    onClick: (url, text) =>
      openUrl(`https://www.threads.net/intent/post?text=${encodeURIComponent(text + " " + url)}`),
  },
  {
    name: "LinkedIn",
    Icon: FaLinkedin,
    iconColor: "#ffffff",
    bgColor: "#0A66C2",
    onClick: (url) =>
      openUrl(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`),
  },
  {
    name: "Pinterest",
    Icon: FaPinterest,
    iconColor: "#ffffff",
    bgColor: "#E60023",
    onClick: (url, text) =>
      openUrl(`https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&description=${encodeURIComponent(text)}`),
  },
  {
    name: "TikTok",
    Icon: FaTiktok,
    iconColor: "#ffffff",
    bgColor: "#010101",
    onClick: async (url) => {
      try {
        await navigator.clipboard.writeText(url);
        alert("Link copied! Open TikTok and paste it in your bio or DMs.");
      } catch {}
    },
  },
];

export function ShareSheet({ open, onOpenChange, postId, caption }: ShareSheetProps) {
  const [copied, setCopied] = useState(false);

  const postUrl = `${window.location.origin}/post/${postId}`;
  const shareText = caption ? `Check out this post on Squawk: "${caption}"` : "Check out this post on Squawk!";

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
        await navigator.share({ title: caption || "Squawk post", url: postUrl });
      } catch {}
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-background border-border pb-safe">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-center text-base font-semibold">Share post</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6">
          {/* Platform grid */}
          <div className="grid grid-cols-4 gap-y-5 gap-x-2 mb-6">
            {PLATFORMS.map((platform) => (
              <button
                key={platform.name}
                onClick={() => {
                  platform.onClick(postUrl, shareText);
                  if (platform.name !== "Instagram" && platform.name !== "TikTok" && platform.name !== "Discord") {
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
                  <platform.Icon
                    size={26}
                    color={platform.iconColor}
                  />
                </div>
                <span className="text-xs text-muted-foreground leading-tight text-center">
                  {platform.name}
                </span>
              </button>
            ))}

            {/* Native share — only if browser supports it */}
            {typeof navigator !== "undefined" && navigator.share && (
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
                <span className="text-xs text-muted-foreground leading-tight text-center">More</span>
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="h-px bg-border mb-4" />

          {/* Copy link row */}
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
              <span className="text-xs text-muted-foreground truncate w-full">{postUrl}</span>
            </div>
            {copied && (
              <span className="ml-auto text-xs text-green-500 font-medium flex-shrink-0">Copied!</span>
            )}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
