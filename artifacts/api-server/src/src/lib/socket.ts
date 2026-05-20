import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket.io",
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId as string | undefined;
    if (userId) {
      socket.join(`user:${userId}`);
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

    socket.on("disconnect", () => {});
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
