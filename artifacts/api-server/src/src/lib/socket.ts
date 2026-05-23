import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

let io: SocketIOServer | null = null;

// In-memory presence: dbUserId -> set of socket IDs
const onlineUsers = new Map<number, Set<string>>();

export function isUserOnline(userId: number): boolean {
  return (onlineUsers.get(userId)?.size ?? 0) > 0;
}

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket.io",
  });

  io.on("connection", async (socket) => {
    const clerkId = socket.handshake.query.userId as string | undefined;
    let dbUserId: number | undefined;

    if (clerkId) {
      socket.join(`clerk:${clerkId}`);
      try {
        const [user] = await db
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(eq(usersTable.clerkId, clerkId));
        if (user) {
          dbUserId = user.id;
          socket.join(`user:${user.id}`);
          if (!onlineUsers.has(user.id)) onlineUsers.set(user.id, new Set());
          onlineUsers.get(user.id)!.add(socket.id);
          io!.emit("user_presence", { userId: user.id, isOnline: true });
        }
      } catch {
        // user may not exist yet during onboarding
      }
    }

    socket.on("join_conversation", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on("typing", ({ conversationId, userId: typingUserId }: { conversationId: string; userId: string }) => {
      socket.to(`conversation:${conversationId}`).emit("typing", { userId: typingUserId });
    });

    socket.on("stop_typing", ({ conversationId, userId: typingUserId }: { conversationId: string; userId: string }) => {
      socket.to(`conversation:${conversationId}`).emit("stop_typing", { userId: typingUserId });
    });

    // ── WebRTC Call Signaling ──────────────────────────────────────────────────
    // call_invite: caller → callee  (includes offer SDP + caller info)
    socket.on("call_invite", (data: {
      targetUserId: number;
      callType: "voice" | "video";
      offer: RTCSessionDescriptionInit;
      fromUser: { id: number; displayName: string; username: string; avatarUrl: string | null };
    }) => {
      io!.to(`user:${data.targetUserId}`).emit("call_invite", {
        fromUser: data.fromUser,
        callType: data.callType,
        offer: data.offer,
      });
    });

    // call_accepted: callee → caller  (includes answer SDP)
    socket.on("call_accepted", (data: { targetUserId: number; answer: RTCSessionDescriptionInit }) => {
      io!.to(`user:${data.targetUserId}`).emit("call_accepted", { answer: data.answer });
    });

    // call_declined: callee → caller
    socket.on("call_declined", (data: { targetUserId: number }) => {
      io!.to(`user:${data.targetUserId}`).emit("call_declined", {});
    });

    // call_ended: either party → other
    socket.on("call_ended", (data: { targetUserId: number }) => {
      io!.to(`user:${data.targetUserId}`).emit("call_ended", {});
    });

    // ice_candidate: exchange between peers
    socket.on("ice_candidate", (data: { targetUserId: number; candidate: RTCIceCandidateInit }) => {
      io!.to(`user:${data.targetUserId}`).emit("ice_candidate", { candidate: data.candidate });
    });

    socket.on("disconnect", () => {
      if (dbUserId !== undefined) {
        const sockets = onlineUsers.get(dbUserId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlineUsers.delete(dbUserId);
            io!.emit("user_presence", {
              userId: dbUserId,
              isOnline: false,
              lastSeen: new Date().toISOString(),
            });
          }
        }
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

export function emitToUser(userId: string, event: string, data: unknown) {
  try {
    getIO().to(`user:${userId}`).emit(event, data);
  } catch {}
}

export function emitToConversation(conversationId: string, event: string, data: unknown) {
  try {
    getIO().to(`conversation:${conversationId}`).emit(event, data);
  } catch {}
}
