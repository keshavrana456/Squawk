import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_BASE = BASE || "";

export interface PushNotification {
  type: "like" | "comment" | "follow" | "repost";
  actorUsername: string;
  actorDisplayName: string;
  actorAvatarUrl: string | null;
  message: string | null;
  createdAt: string;
}

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  onlineUserIds: Set<number>;
  isUserOnline: (userId: number) => boolean;
}

const SocketContext = createContext<SocketContextValue>({
  socket: null,
  connected: false,
  onlineUserIds: new Set(),
  isUserOnline: () => false,
});

const NOTIF_LABELS: Record<string, string> = {
  like: "liked your chirp",
  comment: "replied to your chirp",
  follow: "started following you",
  repost: "reposted your chirp",
};

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
  const qc = useQueryClient();

  useEffect(() => {
    if (!isLoaded || !user) return;

    const socket = io(window.location.origin, {
      path: `${API_BASE}/api/socket.io`,
      query: { userId: user.id },
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("user_presence", ({ userId, isOnline }: { userId: number; isOnline: boolean }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (isOnline) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    socket.on("notification", (notif: PushNotification) => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications-unread-count"] });

      const label = NOTIF_LABELS[notif.type] ?? "interacted with you";
      const name = notif.actorDisplayName || notif.actorUsername;

      toast(
        `${name} ${label}`,
        {
          description: notif.message ? notif.message.slice(0, 80) : undefined,
          duration: 4000,
        }
      );
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isLoaded, user?.id]);

  const isUserOnline = useCallback(
    (userId: number) => onlineUserIds.has(userId),
    [onlineUserIds]
  );

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, connected, onlineUserIds, isUserOnline }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
