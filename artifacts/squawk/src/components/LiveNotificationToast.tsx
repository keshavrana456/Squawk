import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { X, Heart, MessageCircle, UserPlus, Repeat2, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";
import { useSocket } from "@/contexts/SocketContext";
import { useGetMe } from "@workspace/api-client-react";
import { useActiveChat } from "@/contexts/ActiveChatContext";

interface ToastItem {
  id: string;
  type: "notification" | "dm";
  title: string;
  body?: string;
  avatarUrl?: string | null;
  href: string;
  notifType?: string;
}

const NOTIF_ICONS: Record<string, React.ReactNode> = {
  like: <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500 shrink-0" />,
  comment: <MessageCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />,
  follow: <UserPlus className="w-3.5 h-3.5 text-green-400 shrink-0" />,
  repost: <Repeat2 className="w-3.5 h-3.5 text-green-400 shrink-0" />,
  dm: <MessageCircle className="w-3.5 h-3.5 text-primary shrink-0" />,
};

const NOTIF_LABELS: Record<string, string> = {
  like: "liked your chirp",
  comment: "replied to your chirp",
  follow: "started following you",
  repost: "reposted your chirp",
};

export default function LiveNotificationToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const { socket } = useSocket();
  const { data: me } = useGetMe();
  const { activeConversationId } = useActiveChat();

  const addToast = useCallback((item: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts(prev => [{ ...item, id }, ...prev].slice(0, 3));
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onNotification = (notif: any) => {
      const name = notif.actorDisplayName || notif.actorUsername || "Someone";
      const label = NOTIF_LABELS[notif.type] ?? "interacted with you";
      addToast({
        type: "notification",
        title: `${name} ${label}`,
        body: notif.message?.slice(0, 90),
        avatarUrl: notif.actorAvatarUrl,
        notifType: notif.type,
        href: notif.type === "follow" ? `/profile/${notif.actorUsername}` : "/notifications",
      });
    };

    const onNewMessage = (msg: any) => {
      if (msg.messageType === "missed_call") return;
      // Don't show popup for messages the current user sent
      if (me && (msg.senderId === me.id || msg.sender?.id === me.id)) return;
      // Suppress toast when user is actively viewing this conversation
      if (activeConversationId && msg.conversationId === activeConversationId) return;
      const name = msg.sender?.displayName || msg.sender?.username || "Someone";
      const body = msg.messageType === "gif" ? "Sent a GIF" : (msg.content?.slice(0, 90) || "Sent a message");
      addToast({
        type: "dm",
        title: name,
        body,
        avatarUrl: msg.sender?.avatarUrl,
        notifType: "dm",
        href: "/messages",
      });
    };

    socket.on("notification", onNotification);
    socket.on("new_message", onNewMessage);

    return () => {
      socket.off("notification", onNotification);
      socket.off("new_message", onNewMessage);
    };
  }, [socket, addToast, activeConversationId]);

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none"
      style={{ WebkitTapHighlightColor: "transparent" }}
    >
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <ToastBanner key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastBanner({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const initials = toast.title.charAt(0).toUpperCase();
  const icon = NOTIF_ICONS[toast.notifType ?? ""] ?? <Bell className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 70 || info.offset.y < -50) {
      onDismiss();
    }
  };

  const inner = (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-background/90 backdrop-blur-xl border border-border shadow-2xl w-full">
      <Avatar className="w-10 h-10 shrink-0 border border-white/10">
        <AvatarImage src={toast.avatarUrl || ""} />
        <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          {icon}
          <p className="text-sm font-semibold text-foreground truncate leading-tight">{toast.title}</p>
        </div>
        {toast.body && (
          <p className="text-xs text-muted-foreground truncate mt-0.5 leading-tight">{toast.body}</p>
        )}
      </div>
      <button
        onClick={e => { e.preventDefault(); e.stopPropagation(); onDismiss(); }}
        className="shrink-0 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors pointer-events-auto"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.92, transition: { duration: 0.18 } }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0.3, right: 0.3 }}
      onDragEnd={handleDragEnd}
      whileDrag={{ scale: 0.97 }}
      className="pointer-events-auto w-full cursor-grab active:cursor-grabbing"
      style={{ touchAction: "pan-y" }}
    >
      <Link href={toast.href} className="block">
        {inner}
      </Link>
    </motion.div>
  );
}
