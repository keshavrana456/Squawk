import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useSocket } from "./SocketContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, X, Maximize2, Minimize2 } from "lucide-react";

export interface CallUser {
  id: number;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface IncomingCall {
  fromUser: CallUser;
  callType: "voice" | "video";
  roomId: string;
}

interface ActiveCall {
  otherUser: CallUser;
  callType: "voice" | "video";
  roomId: string;
  isMuted: boolean;
  isCameraOff: boolean;
  isSpeakerOff: boolean;
  status: "connecting" | "connected" | "ended";
  startedAt: number | null;
}

interface CallContextValue {
  incomingCall: IncomingCall | null;
  activeCall: ActiveCall | null;
  startCall: (otherUser: CallUser, callType: "voice" | "video", fromUser: CallUser) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  toggleSpeaker: () => void;
}

const CallContext = createContext<CallContextValue>({
  incomingCall: null,
  activeCall: null,
  startCall: async () => {},
  acceptCall: async () => {},
  declineCall: () => {},
  endCall: () => {},
  toggleMute: () => {},
  toggleCamera: () => {},
  toggleSpeaker: () => {},
});

export function useCall() {
  return useContext(CallContext);
}

function buildRoomId(userId1: number, userId2: number): string {
  const a = Math.min(userId1, userId2);
  const b = Math.max(userId1, userId2);
  return `squawk-${a}-${b}`;
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const connectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const endCall = useCallback(() => {
    if (socket && activeCall) {
      socket.emit("call_ended", { targetUserId: activeCall.otherUser.id });
    }
    if (connectionTimerRef.current) clearTimeout(connectionTimerRef.current);
    setActiveCall(null);
    setIncomingCall(null);
    setIsMinimized(false);
  }, [socket, activeCall]);

  const startCall = useCallback(async (otherUser: CallUser, callType: "voice" | "video", fromUser: CallUser) => {
    if (!socket) return;
    const roomId = buildRoomId(fromUser.id, otherUser.id);
    socket.emit("call_invite", { targetUserId: otherUser.id, callType, roomId, fromUser });
    setActiveCall({
      otherUser,
      callType,
      roomId,
      isMuted: false,
      isCameraOff: false,
      isSpeakerOff: false,
      status: "connecting",
      startedAt: null,
    });
    connectionTimerRef.current = setTimeout(() => {
      setActiveCall(prev => {
        if (prev?.status === "connecting") {
          socket.emit("call_missed", { otherUserId: otherUser.id, isCaller: true, callType });
          return null;
        }
        return prev;
      });
    }, 30_000);
  }, [socket]);

  const acceptCall = useCallback(async () => {
    if (!socket || !incomingCall) return;
    const { fromUser, callType, roomId } = incomingCall;
    setIncomingCall(null);
    socket.emit("call_accepted", { targetUserId: fromUser.id });
    setActiveCall({
      otherUser: fromUser,
      callType,
      roomId,
      isMuted: false,
      isCameraOff: false,
      isSpeakerOff: false,
      status: "connected",
      startedAt: Date.now(),
    });
  }, [socket, incomingCall]);

  const declineCall = useCallback(() => {
    if (!socket || !incomingCall) return;
    socket.emit("call_declined", { targetUserId: incomingCall.fromUser.id });
    socket.emit("call_missed", { otherUserId: incomingCall.fromUser.id, isCaller: false, callType: incomingCall.callType });
    setIncomingCall(null);
  }, [socket, incomingCall]);

  const toggleMute = useCallback(() => setActiveCall(p => p ? { ...p, isMuted: !p.isMuted } : p), []);
  const toggleCamera = useCallback(() => setActiveCall(p => p ? { ...p, isCameraOff: !p.isCameraOff } : p), []);
  const toggleSpeaker = useCallback(() => setActiveCall(p => p ? { ...p, isSpeakerOff: !p.isSpeakerOff } : p), []);

  useEffect(() => {
    if (!socket) return;

    const handleCallInvite = (data: { fromUser: CallUser; callType: "voice" | "video"; roomId: string }) => {
      if (activeCall) { socket.emit("call_declined", { targetUserId: data.fromUser.id }); return; }
      setIncomingCall({ fromUser: data.fromUser, callType: data.callType, roomId: data.roomId });
    };

    const handleCallAccepted = () => {
      if (connectionTimerRef.current) clearTimeout(connectionTimerRef.current);
      setActiveCall(prev => prev ? { ...prev, status: "connected", startedAt: Date.now() } : prev);
    };

    const handleCallDeclined = () => { setActiveCall(null); };
    const handleCallEnded = () => { setActiveCall(null); setIncomingCall(null); };

    socket.on("call_invite", handleCallInvite);
    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_declined", handleCallDeclined);
    socket.on("call_ended", handleCallEnded);

    return () => {
      socket.off("call_invite", handleCallInvite);
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_declined", handleCallDeclined);
      socket.off("call_ended", handleCallEnded);
    };
  }, [socket, activeCall]);

  const jitsiUrl = activeCall
    ? `https://meet.jit.si/${activeCall.roomId}#userInfo.displayName="${encodeURIComponent(activeCall.otherUser.displayName)}"&config.startWithAudioMuted=${activeCall.isMuted}&config.startWithVideoMuted=${activeCall.callType === "voice" || activeCall.isCameraOff}`
    : null;

  return (
    <CallContext.Provider value={{ incomingCall, activeCall, startCall, acceptCall, declineCall, endCall, toggleMute, toggleCamera, toggleSpeaker }}>
      {children}

      {/* ── Incoming Call Banner ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {incomingCall && !activeCall && (
          <motion.div
            initial={{ opacity: 0, y: -80 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -80 }}
            transition={{ type: "spring", damping: 24, stiffness: 280 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm px-4"
          >
            <div
              className="rounded-3xl overflow-hidden shadow-2xl border border-white/10"
              style={{
                background: "linear-gradient(135deg, rgba(26,26,46,0.97) 0%, rgba(15,15,35,0.97) 100%)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 0 40px 8px rgba(236,72,153,0.3), 0 20px 60px rgba(0,0,0,0.6)",
              }}
            >
              <div className="p-5">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-14 h-14 border-2 border-primary/40">
                      <AvatarImage src={incomingCall.fromUser.avatarUrl || ""} />
                      <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                        {incomingCall.fromUser.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background"
                      style={{ background: incomingCall.callType === "video" ? "hsl(270,80%,60%)" : "hsl(142,72%,45%)" }}
                    >
                      {incomingCall.callType === "video" ? <Video className="w-2.5 h-2.5 text-white" /> : <Phone className="w-2.5 h-2.5 text-white" />}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-base truncate">{incomingCall.fromUser.displayName}</p>
                    <p className="text-white/50 text-sm">
                      Incoming {incomingCall.callType === "video" ? "video" : "voice"} call…
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={declineCall}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/30 transition-colors"
                  >
                    <PhoneOff className="w-4 h-4" />
                    Decline
                  </button>
                  <button
                    onClick={acceptCall}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-semibold text-sm text-white transition-colors"
                    style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", boxShadow: "0 0 16px rgba(34,197,94,0.4)" }}
                  >
                    {incomingCall.callType === "video" ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                    Accept
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Active Call — Jitsi iframe ───────────────────────────────────────── */}
      <AnimatePresence>
        {activeCall && jitsiUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed z-[190] flex flex-col bg-black ${isMinimized
              ? "bottom-4 right-4 w-72 h-48 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              : "inset-0"
            }`}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/80 shrink-0 z-10">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8 border border-white/20">
                  <AvatarImage src={activeCall.otherUser.avatarUrl || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">{activeCall.otherUser.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="text-white text-sm font-semibold">{activeCall.otherUser.displayName}</div>
                {activeCall.status === "connecting" && (
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-white/60"
                        animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                      />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(v => !v)}
                  className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={endCall}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  {!isMinimized && "End"}
                </button>
              </div>
            </div>

            {/* Jitsi iframe */}
            <iframe
              src={jitsiUrl}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              className="flex-1 w-full border-0"
              title="Call"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </CallContext.Provider>
  );
}
