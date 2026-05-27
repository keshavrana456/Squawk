import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useSocket } from "./SocketContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, VolumeX,
  PhoneCall, PhoneIncoming,
} from "lucide-react";

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" },
  { urls: "stun:stun.cloudflare.com:3478" },
  { urls: "stun:stun.stunprotocol.org:3478" },
  { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443", username: "openrelayproject", credential: "openrelayproject" },
  { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
];

export interface CallUser {
  id: number;
  displayName: string;
  username: string;
  avatarUrl: string | null;
}

interface IncomingCall {
  fromUser: CallUser;
  callType: "voice" | "video";
  offer: RTCSessionDescriptionInit;
}

interface ActiveCall {
  otherUser: CallUser;
  callType: "voice" | "video";
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
  startCall: async (_o, _t, _f) => {},
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

// ─── Provider ──────────────────────────────────────────────────────────────────
export function CallProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();

  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);

  const activeCallRef = useRef<ActiveCall | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endCallRef = useRef<(() => void) | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const cleanup = useCallback(() => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    if (connectionTimeoutRef.current) { clearTimeout(connectionTimeoutRef.current); connectionTimeoutRef.current = null; }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    remoteStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setCallDuration(0);
    pendingCandidatesRef.current = [];
  }, []);

  const createPeerConnection = useCallback((otherUserId: number) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate && socket) {
        socket.emit("ice_candidate", {
          targetUserId: otherUserId,
          candidate: e.candidate.toJSON(),
        });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0] || new MediaStream([e.track]);
      remoteStreamRef.current = stream;
      setRemoteStream(stream);
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
    };

    const markConnected = () => {
      if (connectionTimeoutRef.current) { clearTimeout(connectionTimeoutRef.current); connectionTimeoutRef.current = null; }
      setActiveCall(prev => {
        if (prev && prev.status !== "connected") {
          if (!callTimerRef.current) {
            callTimerRef.current = setInterval(() => {
              setCallDuration(d => d + 1);
            }, 1000);
          }
          return { ...prev, status: "connected", startedAt: Date.now() };
        }
        return prev;
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "connected") {
        markConnected();
      } else if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        endCallRef.current?.();
      }
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === "connected" || pc.iceConnectionState === "completed") {
        markConnected();
      } else if (pc.iceConnectionState === "failed") {
        endCallRef.current?.();
      }
    };

    pcRef.current = pc;
    return pc;
  }, [socket]);

  const getMedia = async (callType: "voice" | "video"): Promise<MediaStream> => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: callType === "video" ? { facingMode: "user", width: 640, height: 480 } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

  const startCall = useCallback(async (otherUser: CallUser, callType: "voice" | "video", fromUser: CallUser) => {
    if (!socket) return;
    cleanup();

    setActiveCall({
      otherUser,
      callType,
      isMuted: false,
      isCameraOff: false,
      isSpeakerOff: false,
      status: "connecting",
      startedAt: null,
    });

    try {
      const stream = await getMedia(callType);
      const pc = createPeerConnection(otherUser.id);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: callType === "video" });
      await pc.setLocalDescription(offer);

      socket.emit("call_invite", {
        targetUserId: otherUser.id,
        callType,
        offer,
        fromUser,
      });
    } catch (e) {
      console.error("Call setup failed", e);
      cleanup();
      setActiveCall(null);
    }
  }, [socket, cleanup, createPeerConnection]);

  const acceptCall = useCallback(async () => {
    if (!socket || !incomingCall) return;
    const { fromUser, callType, offer } = incomingCall;
    setIncomingCall(null);

    setActiveCall({
      otherUser: fromUser,
      callType,
      isMuted: false,
      isCameraOff: false,
      isSpeakerOff: false,
      status: "connecting",
      startedAt: null,
    });

    try {
      const stream = await getMedia(callType);
      const pc = createPeerConnection(fromUser.id);
      stream.getTracks().forEach(t => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      // flush pending ICE candidates
      for (const c of pendingCandidatesRef.current) {
        await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
      }
      pendingCandidatesRef.current = [];

      const answer = await pc.createAnswer({ offerToReceiveAudio: true, offerToReceiveVideo: callType === "video" });
      await pc.setLocalDescription(answer);

      socket.emit("call_accepted", {
        targetUserId: fromUser.id,
        answer,
      });
    } catch (e) {
      console.error("Accept call failed", e);
      cleanup();
      setActiveCall(null);
    }
  }, [socket, incomingCall, cleanup, createPeerConnection]);

  const declineCall = useCallback(() => {
    if (!socket || !incomingCall) return;
    socket.emit("call_declined", { targetUserId: incomingCall.fromUser.id });
    socket.emit("call_missed", {
      otherUserId: incomingCall.fromUser.id,
      isCaller: false,
      callType: incomingCall.callType,
    });
    setIncomingCall(null);
  }, [socket, incomingCall]);

  const endCall = useCallback(() => {
    if (socket && activeCall) {
      socket.emit("call_ended", { targetUserId: activeCall.otherUser.id });
    }
    cleanup();
    setActiveCall(null);
    setIncomingCall(null);
  }, [socket, activeCall, cleanup]);

  // Keep ref always pointing to latest endCall and activeCall
  useEffect(() => { endCallRef.current = endCall; }, [endCall]);
  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);

  // Connection timeout — auto-end if still "connecting" after 30s, emit missed call
  useEffect(() => {
    if (activeCall?.status === "connecting") {
      const capturedSocket = socket;
      connectionTimeoutRef.current = setTimeout(() => {
        const current = activeCallRef.current;
        if (current?.status === "connecting") {
          capturedSocket?.emit("call_missed", {
            otherUserId: current.otherUser.id,
            isCaller: true,
            callType: current.callType,
          });
          endCallRef.current?.();
        }
      }, 30_000);
    }
    return () => {
      if (connectionTimeoutRef.current) { clearTimeout(connectionTimeoutRef.current); connectionTimeoutRef.current = null; }
    };
  }, [activeCall?.status, socket]);

  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    setActiveCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : prev);
  }, []);

  const toggleCamera = useCallback(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    setActiveCall(prev => prev ? { ...prev, isCameraOff: !prev.isCameraOff } : prev);
  }, []);

  const toggleSpeaker = useCallback(() => {
    setActiveCall(prev => prev ? { ...prev, isSpeakerOff: !prev.isSpeakerOff } : prev);
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleCallInvite = (data: { fromUser: CallUser; callType: "voice" | "video"; offer: RTCSessionDescriptionInit }) => {
      if (activeCallRef.current) {
        socket.emit("call_declined", { targetUserId: data.fromUser.id });
        return;
      }
      setIncomingCall({ fromUser: data.fromUser, callType: data.callType, offer: data.offer });
    };

    const handleCallAccepted = async (data: { answer: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        for (const c of pendingCandidatesRef.current) {
          await pc.addIceCandidate(new RTCIceCandidate(c)).catch(() => {});
        }
        pendingCandidatesRef.current = [];
      } catch (e) { console.error(e); }
    };

    const handleCallDeclined = () => {
      cleanup();
      setActiveCall(null);
    };

    const handleCallEnded = () => {
      cleanup();
      setActiveCall(null);
      setIncomingCall(null);
    };

    const handleIceCandidate = async (data: { candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current;
      if (!pc) return;
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(() => {});
      } else {
        pendingCandidatesRef.current.push(data.candidate);
      }
    };

    socket.on("call_invite", handleCallInvite);
    socket.on("call_accepted", handleCallAccepted);
    socket.on("call_declined", handleCallDeclined);
    socket.on("call_ended", handleCallEnded);
    socket.on("ice_candidate", handleIceCandidate);

    return () => {
      socket.off("call_invite", handleCallInvite);
      socket.off("call_accepted", handleCallAccepted);
      socket.off("call_declined", handleCallDeclined);
      socket.off("call_ended", handleCallEnded);
      socket.off("ice_candidate", handleIceCandidate);
    };
  }, [socket, cleanup]);

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

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
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center border-2 border-background"
                      style={{ background: incomingCall.callType === "video" ? "hsl(270,80%,60%)" : "hsl(142,72%,45%)" }}>
                      {incomingCall.callType === "video"
                        ? <Video className="w-2.5 h-2.5 text-white" />
                        : <Phone className="w-2.5 h-2.5 text-white" />
                      }
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

      {/* ── Active Call Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {activeCall && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[190] flex flex-col"
            style={{ background: "linear-gradient(180deg, #0d0d1a 0%, #1a0a2e 50%, #0d0d1a 100%)" }}
          >
            {/* Status */}
            <div className="absolute top-10 left-0 right-0 z-10 flex flex-col items-center">
              <p className="text-white/60 text-sm font-medium">
                {activeCall.status === "connecting"
                  ? "Calling…"
                  : activeCall.status === "connected"
                  ? formatDuration(callDuration)
                  : "Call ended"
                }
              </p>
            </div>

            {/* Video area */}
            {activeCall.callType === "video" ? (
              <div className="flex-1 relative">
                {/* Remote video — full screen */}
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ opacity: remoteStream ? 1 : 0 }}
                />
                {/* Remote video placeholder when not connected yet */}
                {!remoteStream && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <Avatar className="w-32 h-32 border-4 border-primary/30 shadow-2xl mb-4">
                      <AvatarImage src={activeCall.otherUser.avatarUrl || ""} />
                      <AvatarFallback className="bg-primary/20 text-primary text-5xl font-bold">
                        {activeCall.otherUser.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-white text-2xl font-bold mt-2">{activeCall.otherUser.displayName}</p>
                    <p className="text-white/50 text-base mt-1">Connecting…</p>
                  </div>
                )}
                {/* Local video PiP */}
                <div className="absolute top-16 right-4 w-28 h-36 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: "scaleX(-1)", opacity: activeCall.isCameraOff ? 0 : 1 }}
                  />
                  {activeCall.isCameraOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                      <VideoOff className="w-8 h-8 text-white/40" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Voice call UI */
              <div className="flex-1 flex flex-col items-center justify-center">
                <div
                  className="relative w-36 h-36 rounded-full flex items-center justify-center mb-6"
                  style={{
                    background: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)",
                    boxShadow: activeCall.status === "connected"
                      ? "0 0 0 0 rgba(236,72,153,0.4), 0 0 60px 10px rgba(236,72,153,0.2)"
                      : undefined,
                    animation: activeCall.status === "connecting" ? "pulse 2s infinite" : undefined,
                  }}
                >
                  <Avatar className="w-28 h-28 border-4 border-primary/30">
                    <AvatarImage src={activeCall.otherUser.avatarUrl || ""} />
                    <AvatarFallback className="bg-primary/20 text-primary text-5xl font-bold">
                      {activeCall.otherUser.displayName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  {activeCall.status === "connecting" && (
                    <div className="absolute inset-0 rounded-full border-4 border-primary/30 animate-ping" />
                  )}
                </div>
                <p className="text-white text-2xl font-bold">{activeCall.otherUser.displayName}</p>
                <p className="text-white/50 text-base mt-1">
                  {activeCall.status === "connecting" ? "Calling…" : formatDuration(callDuration)}
                </p>
                {/* Audio elements for voice calls */}
                <audio
                  ref={remoteAudioRef}
                  autoPlay
                  playsInline
                  className="hidden"
                />
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="hidden"
                />
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="hidden"
                />
              </div>
            )}

            {/* Controls */}
            <div className="pb-12 pt-6 px-8 bg-gradient-to-t from-black/80 to-transparent">
              {activeCall.callType === "video" ? (
                /* Video call: Mute | Camera | EndCall | Speaker */
                <div className="flex items-center justify-center gap-5">
                  <button
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${activeCall.isMuted ? "bg-white/20 border border-white/30" : "bg-white/10 border border-white/10"}`}
                  >
                    {activeCall.isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                  </button>
                  <button
                    onClick={toggleCamera}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${activeCall.isCameraOff ? "bg-white/20 border border-white/30" : "bg-white/10 border border-white/10"}`}
                  >
                    {activeCall.isCameraOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
                  </button>
                  <button
                    onClick={endCall}
                    className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl"
                    style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 0 20px rgba(239,68,68,0.5)" }}
                  >
                    <PhoneOff className="w-7 h-7 text-white" />
                  </button>
                  <button
                    onClick={toggleSpeaker}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${activeCall.isSpeakerOff ? "bg-white/20 border border-white/30" : "bg-white/10 border border-white/10"}`}
                  >
                    {activeCall.isSpeakerOff ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                  </button>
                </div>
              ) : (
                /* Voice call: Mute | EndCall | Speaker — centered */
                <div className="flex items-center justify-center gap-8">
                  <button
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${activeCall.isMuted ? "bg-white/20 border border-white/30" : "bg-white/10 border border-white/10"}`}
                  >
                    {activeCall.isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                  </button>
                  <button
                    onClick={endCall}
                    className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
                    style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)", boxShadow: "0 0 24px rgba(239,68,68,0.6)" }}
                  >
                    <PhoneOff className="w-8 h-8 text-white" />
                  </button>
                  <button
                    onClick={toggleSpeaker}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${activeCall.isSpeakerOff ? "bg-white/20 border border-white/30" : "bg-white/10 border border-white/10"}`}
                  >
                    {activeCall.isSpeakerOff ? <VolumeX className="w-6 h-6 text-white" /> : <Volume2 className="w-6 h-6 text-white" />}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </CallContext.Provider>
  );
}
