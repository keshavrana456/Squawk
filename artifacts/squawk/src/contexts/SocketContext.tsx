import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useUser } from "@clerk/react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const API_BASE = BASE || "";

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

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());

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
