import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  CallingState,
  useCallStateHooks,
  User,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { useSocket } from "./SocketContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, X, Minimize2, Maximize2 } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

export interface CallUser {
  id: number;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface IncomingCall {
  fromUser: CallUser;
  callType: "voice" | "video";
  callId: string;
}

interface CallContextValue {
  incomingCall: IncomingCall | null;
  activeCall: { otherUser: CallUser; callType: "voice" | "video" } | null;
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

function buildCallId(userId1: number, userId2: number): string {
  const a = Math.min(userId1, userId2);
  const b = Math.max(userId1, userId2);
  return `squawk-${a}-${b}-${Date.now()}`;
}

async function fetchStreamToken(): Promise<{ token: string; apiKey: string; userId: string } | null> {
  try {
    const res = await fetch("/api/stream/token", { credentials: "include" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const { data: me } = useGetMe();

  const [streamClient, setStreamClient] = useState<StreamVideoClient | null>(null);
  const [streamCall, setStreamCall] = useState<ReturnType<StreamVideoClient["call"]> | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCallMeta, setActiveCallMeta] = useState<{ otherUser: CallUser; callType: "voice" | "video" } | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const clientRef = useRef<StreamVideoClient | null>(null);

  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    (async () => {
      const creds = await fetchStreamToken();
      if (!creds || cancelled) return;
      const user: User = {
        id: creds.userId,
        name: (me as any).displayName || (me as any).username || creds.userId,
        image: (me as any).avatarUrl || undefined,
      };
      const client = StreamVideoClient.getOrCreateInstance({
        apiKey: creds.apiKey,
        user,
        token: creds.token,
      });
      clientRef.current = client;
      if (!cancelled) setStreamClient(client);
    })();
    return () => {
      cancelled = true;
    };
  }, [me?.id]);

  const endCall = useCallback(async () => {
    if (streamCall) {
      try { await streamCall.leave(); } catch {}
      try { await streamCall.endCall(); } catch {}
    }
    setStreamCall(null);
    setActiveCallMeta(null);
    setIncomingCall(null);
    setIsMinimized(false);
  }, [streamCall]);

  const startCall = useCallback(async (otherUser: CallUser, callType: "voice" | "video", fromUser: CallUser) => {
    if (!streamClient || !socket) return;
    const callId = buildCallId(fromUser.id, otherUser.id);
    const call = streamClient.call("default", callId);
    try {
      await call.getOrCreate({ ring: true, data: { members: [{ user_id: String(fromUser.id) }, { user_id: String(otherUser.id) }] } });
      await call.join({ create: false });
    } catch {
      try { await call.join({ create: true }); } catch {}
    }
    if (callType === "voice") {
      try { await call.camera.disable(); } catch {}
    }
    setStreamCall(call as any);
    setActiveCallMeta({ otherUser, callType });
    socket.emit("call_invite", { targetUserId: otherUser.id, callType, roomId: callId, fromUser });
  }, [streamClient, socket]);

  const acceptCall = useCallback(async () => {
    if (!streamClient || !incomingCall || !socket) return;
    const call = streamClient.call("default", incomingCall.callId);
    try {
      await call.join({ create: false });
    } catch {
      try { await call.join({ create: true }); } catch {}
    }
    if (incomingCall.callType === "voice") {
      try { await call.camera.disable(); } catch {}
    }
    setStreamCall(call as any);
    setActiveCallMeta({ otherUser: incomingCall.fromUser, callType: incomingCall.callType });
    socket.emit("call_accepted", { targetUserId: incomingCall.fromUser.id });
    setIncomingCall(null);
  }, [streamClient, incomingCall, socket]);

  const declineCall = useCallback(() => {
    if (!socket || !incomingCall) return;
    socket.emit("call_declined", { targetUserId: incomingCall.fromUser.id });
    socket.emit("call_missed", { otherUserId: incomingCall.fromUser.id, isCaller: false, callType: incomingCall.callType });
    setIncomingCall(null);
  }, [socket, incomingCall]);

  const toggleMute = useCallback(() => {
    if (!streamCall) return;
    const mic = (streamCall as any).microphone;
    if (mic) { mic.enabled ? mic.disable() : mic.enable(); }
  }, [streamCall]);

  const toggleCamera = useCallback(() => {
    if (!streamCall) return;
    const cam = (streamCall as any).camera;
    if (cam) { cam.enabled ? cam.disable() : cam.enable(); }
  }, [streamCall]);

  const toggleSpeaker = useCallback(() => {}, []);

  useEffect(() => {
    if (!socket) return;
    const handleCallInvite = (data: { fromUser: CallUser; callType: "voice" | "video"; roomId: string }) => {
      if (activeCallMeta) { socket.emit("call_declined", { targetUserId: data.fromUser.id }); return; }
      setIncomingCall({ fromUser: data.fromUser, callType: data.callType, callId: data.roomId });
    };
    const handleCallDeclined = () => { endCall(); };
    const handleCallEnded = () => { endCall(); };

    socket.on("call_invite", handleCallInvite);
    socket.on("call_declined", handleCallDeclined);
    socket.on("call_ended", handleCallEnded);
    return () => {
      socket.off("call_invite", handleCallInvite);
      socket.off("call_declined", handleCallDeclined);
      socket.off("call_ended", handleCallEnded);
    };
  }, [socket, activeCallMeta, endCall]);

  // Listen for actions posted from the service worker (e.g. "Decline" tapped on push notification)
  useEffect(() => {
    const handleSwMessage = (event: MessageEvent) => {
      if (event.data?.type === "call_action" && event.data?.action === "decline") {
        declineCall();
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleSwMessage);
    return () => navigator.serviceWorker?.removeEventListener("message", handleSwMessage);
  }, [declineCall]);

  return (
    <CallContext.Provider value={{ incomingCall, activeCall: activeCallMeta, startCall, acceptCall, declineCall, endCall, toggleMute, toggleCamera, toggleSpeaker }}>
      {children}

      {/* ── Incoming Call Banner ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {incomingCall && !activeCallMeta && (
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

      {/* ── Active Call — Stream Video ───────────────────────────────────────── */}
      <AnimatePresence>
        {activeCallMeta && streamCall && streamClient && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed z-[190] flex flex-col bg-black ${
              isMinimized
                ? "bottom-4 right-4 w-72 h-48 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
                : "inset-0"
            }`}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-black/80 shrink-0 z-10">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8 border border-white/20">
                  <AvatarImage src={activeCallMeta.otherUser.avatarUrl || ""} />
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    {activeCallMeta.otherUser.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-white text-sm font-semibold">{activeCallMeta.otherUser.displayName}</div>
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

            {/* Stream Video UI */}
            <div className="flex-1 min-h-0 overflow-hidden">
              <StreamVideo client={streamClient}>
                <StreamCall call={streamCall as any}>
                  <StreamCallUI isMinimized={isMinimized} onEnd={endCall} />
                </StreamCall>
              </StreamVideo>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CallContext.Provider>
  );
}

function StreamCallUI({ isMinimized, onEnd }: { isMinimized: boolean; onEnd: () => void }) {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  useEffect(() => {
    if (callingState === CallingState.LEFT || callingState === CallingState.IDLE) {
      onEnd();
    }
  }, [callingState, onEnd]);

  if (isMinimized) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <SpeakerLayout />
      </div>
    );
  }

  return (
    <div className="str-video w-full h-full flex flex-col">
      <div className="flex-1 min-h-0">
        <SpeakerLayout />
      </div>
      <CallControls onLeave={onEnd} />
    </div>
  );
}
