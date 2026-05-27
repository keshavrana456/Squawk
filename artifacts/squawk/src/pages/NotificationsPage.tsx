import { useState, useEffect } from "react";
import { useGetNotifications, useMarkAllNotificationsRead, getGetUnreadNotificationCountQueryKey, type Notification } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, UserPlus, AtSign, CheckCheck, Repeat2, Sparkles, BadgeCheck, Users, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { useUser } from "@clerk/react";

const TABS = ["All", "Likes", "Comments", "Reposts", "Stories", "Follows"] as const;
type Tab = typeof TABS[number];

function BellIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  );
}

// ─── Suggested Users Strip ────────────────────────────────────────────────────
function getDismissedKey(clerkId: string) {
  return `squawk-dismissed-suggestions-${clerkId}`;
}
function loadDismissed(clerkId: string): Set<number> {
  try {
    const raw = localStorage.getItem(getDismissedKey(clerkId));
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as number[]);
  } catch { return new Set(); }
}
function saveDismissed(clerkId: string, ids: Set<number>) {
  try {
    localStorage.setItem(getDismissedKey(clerkId), JSON.stringify([...ids]));
  } catch {}
}

function SuggestedUsers() {
  const { user } = useUser();
  const clerkId = user?.id ?? "";
  const [users, setUsers] = useState<any[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!clerkId) return;
    setDismissedIds(loadDismissed(clerkId));
  }, [clerkId]);

  useEffect(() => {
    fetch("/api/users/suggested", { credentials: "include" })
      .then(r => r.ok ? r.json() : [])
      .then(d => setUsers(Array.isArray(d) ? d : (d.users || [])))
      .catch(() => setUsers([]));
  }, []);

  const dismiss = (id: number) => {
    setDismissedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      if (clerkId) saveDismissed(clerkId, next);
      return next;
    });
  };

  const handleFollow = async (u: any) => {
    if (togglingId === u.id) return;
    setTogglingId(u.id);
    try {
      await fetch(`/api/users/${u.username}/follow`, { method: "POST", credentials: "include" });
      // After following, permanently dismiss this suggestion
      dismiss(u.id);
    } catch {}
    finally { setTogglingId(null); }
  };

  const visible = users.filter(u => !dismissedIds.has(u.id));
  if (visible.length === 0) return null;

  const shown = expanded ? visible : visible.slice(0, 5);

  return (
    <div className="border-b border-border/50 px-4 py-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">Suggested for You</span>
        </div>
        {visible.length > 5 && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors"
          >
            {expanded ? "Show less" : `See all ${visible.length}`}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {shown.map((u: any) => (
          <motion.div
            key={u.id}
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-3 group"
          >
            <Link href={`/profile/${u.username}`} className="shrink-0">
              <Avatar className="w-9 h-9 border border-border group-hover:border-primary/50 transition-colors">
                <AvatarImage src={u.avatarUrl || ""} />
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                  {u.displayName?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Link href={`/profile/${u.username}`} className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                {u.isFounderVerified && <BadgeCheck className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                <span className="font-semibold text-sm text-foreground truncate">{u.displayName}</span>
                {u.isFounder && <BadgeCheck className="w-3.5 h-3.5 text-pink-500 shrink-0" />}
                {u.isVerified && !u.isFounder && !u.isFounderVerified && <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
            </Link>
            <button
              onClick={() => handleFollow(u)}
              disabled={togglingId === u.id}
              className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold border border-primary/50 text-primary hover:bg-primary/10 transition-all duration-200"
            >
              {togglingId === u.id
                ? <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />
                : "Follow"
              }
            </button>
            <button
              onClick={() => dismiss(u.id)}
              className="shrink-0 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const queryClient = useQueryClient();

  const { data: notifData, isLoading } = useGetNotifications({ query: { refetchInterval: 15_000, refetchOnWindowFocus: true } });
  const notifications = Array.isArray(notifData) ? notifData : [];

  const markReadMutation = useMarkAllNotificationsRead({
    mutation: {
      onMutate: () => {
        // Instantly clear the badge — optimistic update
        queryClient.setQueryData(getGetUnreadNotificationCountQueryKey(), { count: 0 });
        // Also mark all local notifications as read
        queryClient.setQueryData(["getNotifications"], (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map((n: any) => ({ ...n, isRead: true }));
        });
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["getNotifications"] });
      },
    },
  });

  const filteredNotifs = notifications.filter((n: Notification) => {
    if (activeTab === "All") return true;
    if (activeTab === "Likes") return n.type === "like";
    if (activeTab === "Comments") return n.type === "comment";
    if (activeTab === "Reposts") return n.type === "repost";
    if (activeTab === "Stories") return n.type === "story";
    if (activeTab === "Follows") return n.type === "follow";
    return true;
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "like":    return <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />;
      case "comment": return <MessageCircle className="w-4 h-4 text-violet-400" />;
      case "follow":  return <UserPlus className="w-4 h-4 text-green-400" />;
      case "mention": return <AtSign className="w-4 h-4 text-purple-400" />;
      case "repost":  return <Repeat2 className="w-4 h-4 text-green-400" />;
      case "story":   return <Sparkles className="w-4 h-4 text-yellow-400" />;
      default:        return <BellIcon className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getMessage = (n: Notification) => {
    switch (n.type) {
      case "like":    return "liked your post.";
      case "comment": return n.message ? `replied: "${n.message}"` : "commented on your post.";
      case "follow":  return "started following you.";
      case "mention": return "mentioned you.";
      case "repost":  return n.message ? `reposted your chirp: "${n.message}"` : "reposted your chirp.";
      case "story":   return "posted a new story.";
      default:        return "interacted with you.";
    }
  };

  const getInitials = (name: string) => (name ? name.charAt(0).toUpperCase() : "?");

  const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto w-full min-h-[100dvh] bg-background border-x border-border flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          <Button
            variant="ghost" size="sm"
            onClick={() => markReadMutation.mutate()}
            disabled={markReadMutation.isPending || unreadCount === 0}
            className="text-primary hover:text-primary hover:bg-primary/10 gap-2 disabled:opacity-40"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 px-2 pb-0 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm border-b-2 whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested for You — shown on All tab */}
      {activeTab === "All" && <SuggestedUsers />}

      {/* Content */}
      <div className="flex-1 p-2 md:p-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl border border-border animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-full shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 bg-muted w-3/4 rounded" />
                  <div className="h-3 bg-muted w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div className="text-center p-12 text-muted-foreground mt-12">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <BellIcon className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">All caught up</h3>
            <p>No {activeTab === "All" ? "" : activeTab.toLowerCase() + " "}notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotifs.map((n: Notification) => {
              const unreadStyle = !n.isRead
                ? "bg-primary/5 border-primary/20"
                : "bg-background border-border/40";

              const href = n.postId ? `/post/${n.postId}` : n.actor ? `/profile/${n.actor.username}` : undefined;
              const Wrapper = href ? Link : "div";
              const wrapperProps = href ? { href } : {};

              return (
                <Wrapper
                  key={n.id}
                  {...(wrapperProps as any)}
                  className={`flex gap-4 p-4 rounded-2xl border transition-colors hover:bg-muted/50 cursor-pointer relative overflow-hidden group ${unreadStyle}`}
                >
                  {!n.isRead && <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-pink-500 rounded-l-2xl" />}

                  {n.actor ? (
                    <Link href={`/profile/${n.actor.username}`} onClick={e => e.stopPropagation()} className="shrink-0 relative">
                      <Avatar className="w-12 h-12 border border-border group-hover:border-primary/50 transition-colors">
                        <AvatarImage src={n.actor.avatarUrl || ""} />
                        <AvatarFallback className="bg-muted text-foreground font-bold">
                          {getInitials(n.actor.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-card rounded-full flex items-center justify-center border border-border shadow-sm">
                        {getIcon(n.type)}
                      </div>
                    </Link>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <BellIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 pt-1 min-w-0">
                    <div className="text-[15px] text-foreground leading-snug">
                      {n.actor && (
                        <span className="font-semibold mr-1">{n.actor.username}</span>
                      )}
                      <span className="text-muted-foreground">{getMessage(n)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1.5 font-medium">
                      {formatDistanceToNow(new Date(n.createdAt))} ago
                    </div>
                  </div>
                </Wrapper>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
