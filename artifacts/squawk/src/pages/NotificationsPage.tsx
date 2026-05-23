import { useState } from "react";
import { useGetNotifications, useMarkAllNotificationsRead, getGetUnreadNotificationCountQueryKey, type Notification } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, UserPlus, AtSign, CheckCheck, Repeat2, Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";

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

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const queryClient = useQueryClient();

  const { data: notifData, isLoading } = useGetNotifications({ query: { refetchInterval: 15_000, refetchOnWindowFocus: true } });
  const notifications = Array.isArray(notifData) ? notifData : [];
  const markReadMutation = useMarkAllNotificationsRead({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
        queryClient.invalidateQueries({ queryKey: ["conversations-unread-count"] });
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
            className="text-primary hover:text-primary hover:bg-primary/10 gap-2"
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
