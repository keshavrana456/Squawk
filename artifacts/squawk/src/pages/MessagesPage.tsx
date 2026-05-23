import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useSearch as useRouteSearch } from "wouter";
import {
  Send, Plus, ArrowLeft, MessageCircle, Search, X, Users, UserPlus,
  Image as ImageIcon, Smile, CornerDownRight, Check, CheckCheck, Circle,
} from "lucide-react";
import {
  useGetConversations, useGetMessages, useSendMessage, useCreateConversation,
  useGetMe, useSearch as useApiSearch,
  type Message,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useSocket } from "@/contexts/SocketContext";

const GIPHY_KEY = (import.meta as any).env?.VITE_GIPHY_API_KEY || "dc6zaTOxFJmzC";

// ─── GIF Picker ───────────────────────────────────────────────────────────────
function GifPicker({ onSelect, onClose }: { onSelect: (url: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const endpoint = q.trim()
        ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=18&rating=pg`
        : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=18&rating=pg`;
      const res = await fetch(endpoint);
      const data = await res.json();
      setGifs(data.data || []);
    } catch {
      setGifs([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { search(""); }, [search]);

  useEffect(() => {
    const t = setTimeout(() => { if (query !== undefined) search(query); }, 450);
    return () => clearTimeout(t);
  }, [query, search]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.97 }}
      className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden z-50"
      style={{ maxHeight: "340px" }}
    >
      <div className="flex items-center gap-2 p-2 border-b border-border">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search GIFs…"
          className="border-0 bg-transparent focus-visible:ring-0 shadow-none h-8 text-sm"
          autoFocus
        />
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-y-auto no-scrollbar" style={{ maxHeight: "284px" }}>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : gifs.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-10">No GIFs found</p>
        ) : (
          <div className="grid grid-cols-3 gap-1 p-2">
            {gifs.map((gif: any) => (
              <button
                key={gif.id}
                onClick={() => onSelect(gif.images.original.url)}
                className="aspect-square overflow-hidden rounded-lg hover:opacity-80 transition-opacity bg-muted"
              >
                <img
                  src={gif.images.fixed_height_small?.url || gif.images.preview_gif?.url}
                  alt={gif.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-center text-[10px] text-muted-foreground/40 py-1 border-t border-border">Powered by GIPHY</p>
    </motion.div>
  );
}

type PanelMode = "none" | "dm" | "group";

export default function MessagesPage() {
  const { data: me } = useGetMe();
  const queryClient = useQueryClient();
  const { data: convData, isLoading: isLoadingConvs, refetch: refetchConvs } = useGetConversations();
  const conversations = (convData as any) || [];
  const { socket } = useSocket();

  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [panelMode, setPanelMode] = useState<PanelMode>("none");
  const [showModeMenu, setShowModeMenu] = useState(false);
  const autoOpenedRef = useRef(false);

  const routeSearch = useRouteSearch();
  const createConvMutation = useCreateConversation();

  const [dmQuery, setDmQuery] = useState("");
  const [dmDebounced, setDmDebounced] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDmDebounced(dmQuery), 300);
    return () => clearTimeout(t);
  }, [dmQuery]);

  const [groupName, setGroupName] = useState("");
  const [groupQuery, setGroupQuery] = useState("");
  const [groupDebounced, setGroupDebounced] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<any[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGroupDebounced(groupQuery), 300);
    return () => clearTimeout(t);
  }, [groupQuery]);

  const { data: dmSearchData } = useApiSearch(
    { q: dmDebounced, type: "users" },
    { query: { enabled: dmDebounced.length >= 1 } }
  );
  const dmResults: any[] = (dmSearchData as any)?.users || [];

  const { data: groupSearchData } = useApiSearch(
    { q: groupDebounced, type: "users" },
    { query: { enabled: groupDebounced.length >= 1 } }
  );
  const groupResults: any[] = (groupSearchData as any)?.users?.filter(
    (u: any) => u.id !== me?.id && !selectedMembers.find((m) => m.id === u.id)
  ) || [];

  // Socket: conversation_updated → refetch list
  useEffect(() => {
    if (!socket) return;
    const handler = () => { refetchConvs(); };
    socket.on("conversation_updated", handler);
    return () => { socket.off("conversation_updated", handler); };
  }, [socket, refetchConvs]);

  // Auto-open from route ?username=
  useEffect(() => {
    if (autoOpenedRef.current || isLoadingConvs) return;
    const params = new URLSearchParams(routeSearch);
    const targetUsername = params.get("username");
    if (!targetUsername) return;
    autoOpenedRef.current = true;
    const existing = conversations.find(
      (c: any) => !c.isGroup && c.participants.some((p: any) => p.username === targetUsername)
    );
    if (existing) {
      setSelectedConvId(existing.id);
    } else {
      createConvMutation
        .mutateAsync({ data: { username: targetUsername } } as any)
        .then((conv: any) => setSelectedConvId(conv.id))
        .catch(() => { setDmQuery(targetUsername); setPanelMode("dm"); });
    }
  }, [routeSearch, isLoadingConvs, conversations]);

  const handleSelectDmUser = async (username: string) => {
    const existing = conversations.find(
      (c: any) => !c.isGroup && c.participants.some((p: any) => p.username === username)
    );
    if (existing) { setSelectedConvId(existing.id); closePanels(); return; }
    try {
      const conv: any = await createConvMutation.mutateAsync({ data: { username } } as any);
      setSelectedConvId(conv.id);
      closePanels();
    } catch (e) { console.error(e); }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedMembers.length === 0) return;
    setIsCreatingGroup(true);
    try {
      const res = await fetch("/api/conversations/group", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName.trim(), usernames: selectedMembers.map((m) => m.username) }),
      });
      if (!res.ok) throw new Error("Failed");
      const conv = await res.json();
      await queryClient.invalidateQueries({ queryKey: ["getConversations"] });
      setSelectedConvId(conv.id);
      closePanels();
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  const closePanels = () => {
    setPanelMode("none");
    setDmQuery("");
    setGroupQuery("");
    setGroupName("");
    setSelectedMembers([]);
    setShowModeMenu(false);
  };

  const toggleMember = (user: any) => {
    setSelectedMembers((prev) =>
      prev.find((m) => m.id === user.id) ? prev.filter((m) => m.id !== user.id) : [...prev, user]
    );
  };

  const getInitials = (n: string) => (n ? n.charAt(0).toUpperCase() : "?");
  const { isUserOnline } = useSocket();

  return (
    <div className="absolute inset-0 flex w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <div
        className={`w-full md:w-[320px] lg:w-[380px] shrink-0 border-r border-border bg-background flex flex-col h-full ${
          selectedConvId ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Messages</h1>
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowModeMenu((v) => !v)}
              className="text-primary hover:bg-primary/10"
            >
              {panelMode !== "none" ? (
                <X className="w-5 h-5" onClick={(e) => { e.stopPropagation(); closePanels(); }} />
              ) : (
                <Plus className="w-5 h-5" />
              )}
            </Button>
            <AnimatePresence>
              {showModeMenu && panelMode === "none" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-2xl shadow-xl z-50 overflow-hidden"
                >
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-sm font-medium text-foreground"
                    onClick={() => { setPanelMode("dm"); setShowModeMenu(false); }}
                  >
                    <MessageCircle className="w-4 h-4 text-primary" /> New Message
                  </button>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-sm font-medium text-foreground border-t border-border"
                    onClick={() => { setPanelMode("group"); setShowModeMenu(false); }}
                  >
                    <Users className="w-4 h-4 text-primary" /> New Group
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* DM Search Panel */}
        <AnimatePresence>
          {panelMode === "dm" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-border bg-muted/20 overflow-hidden"
            >
              <div className="p-3">
                <p className="text-xs font-semibold text-primary mb-2 px-1">New Message</p>
                <div className="flex items-center gap-2 bg-background border border-border rounded-2xl px-3 focus-within:ring-1 focus-within:ring-primary">
                  <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Search by name or username..."
                    value={dmQuery}
                    onChange={(e) => setDmQuery(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 shadow-none px-1 h-10"
                    autoFocus
                  />
                  {dmQuery && (
                    <button onClick={() => setDmQuery("")} className="text-muted-foreground hover:text-foreground shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {dmDebounced.length > 0 && (
                  <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
                    {dmResults.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        No users found for "{dmDebounced}"
                      </div>
                    ) : (
                      dmResults.map((u: any) => (
                        <button
                          key={u.id}
                          onClick={() => handleSelectDmUser(u.username)}
                          disabled={createConvMutation.isPending}
                          className="w-full flex items-center gap-3 px-3 py-3 hover:bg-muted/60 transition-colors border-b border-border/50 last:border-0"
                        >
                          <div className="relative shrink-0">
                            <Avatar className="w-9 h-9 border border-border">
                              <AvatarImage src={u.avatarUrl || ""} />
                              <AvatarFallback className="bg-primary/20 text-primary text-sm">
                                {getInitials(u.displayName)}
                              </AvatarFallback>
                            </Avatar>
                            {isUserOnline(u.id) && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-semibold text-sm text-foreground truncate">{u.displayName}</div>
                            <div className="text-xs text-muted-foreground">@{u.username}</div>
                          </div>
                          <span className="text-xs text-primary font-medium shrink-0">Message →</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                {dmDebounced.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2 px-1">Start typing to find someone to message</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Group Creation Panel */}
        <AnimatePresence>
          {panelMode === "group" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-border bg-muted/20 overflow-hidden"
            >
              <div className="p-3 space-y-3">
                <p className="text-xs font-semibold text-primary px-1">New Group Chat</p>
                <Input
                  placeholder="Group name..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="bg-background border-border rounded-2xl h-10"
                />
                {selectedMembers.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {selectedMembers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-1 bg-primary/15 text-primary text-xs font-medium px-2.5 py-1 rounded-full"
                      >
                        {m.displayName}
                        <button onClick={() => toggleMember(m)} className="ml-0.5 hover:text-primary/60">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2 bg-background border border-border rounded-2xl px-3 focus-within:ring-1 focus-within:ring-primary">
                  <UserPlus className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Add people..."
                    value={groupQuery}
                    onChange={(e) => setGroupQuery(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 shadow-none px-1 h-9"
                  />
                </div>
                {groupDebounced.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-xl border border-border bg-background shadow-lg">
                    {groupResults.length === 0 ? (
                      <div className="p-3 text-xs text-muted-foreground text-center">No users found</div>
                    ) : (
                      groupResults.map((u: any) => (
                        <button
                          key={u.id}
                          onClick={() => { toggleMember(u); setGroupQuery(""); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-muted/60 transition-colors border-b border-border/50 last:border-0"
                        >
                          <Avatar className="w-8 h-8 border border-border">
                            <AvatarImage src={u.avatarUrl || ""} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">
                              {getInitials(u.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-semibold text-xs text-foreground truncate">{u.displayName}</div>
                            <div className="text-[11px] text-muted-foreground">@{u.username}</div>
                          </div>
                          <Plus className="w-4 h-4 text-primary shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                )}
                <Button
                  className="w-full rounded-full bg-gradient-to-r from-primary to-[#c084fc] text-white border-0 font-semibold h-10"
                  disabled={!groupName.trim() || selectedMembers.length === 0 || isCreatingGroup}
                  onClick={handleCreateGroup}
                >
                  {isCreatingGroup
                    ? "Creating…"
                    : `Create Group${selectedMembers.length > 0 ? ` (${selectedMembers.length + 1})` : ""}`}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoadingConvs ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-center animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted w-1/2 rounded" />
                    <div className="h-3 bg-muted w-3/4 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground flex flex-col items-center">
              <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
              <p>No messages yet.</p>
              <p className="text-sm mt-1">
                Tap <span className="text-primary font-semibold">+</span> to start chatting.
              </p>
            </div>
          ) : (
            conversations.map((conv: any) => {
              const isGroup = conv.isGroup;
              const otherUser = !isGroup
                ? conv.participants.find((p: any) => p.id !== me?.id) || conv.participants[0]
                : null;
              const displayName = isGroup ? conv.name : otherUser?.displayName;
              const displayAvatar = otherUser?.avatarUrl;
              const isSelected = selectedConvId === conv.id;
              const lastMsgPreview = conv.lastMessage
                ? conv.lastMessage.senderId === me?.id
                  ? `You: ${conv.lastMessage.messageType === "gif" ? "GIF" : conv.lastMessage.content || "📎 Media"}`
                  : conv.lastMessage.messageType === "gif"
                  ? "GIF"
                  : conv.lastMessage.content || "📎 Media"
                : isGroup
                ? `${conv.participants.length} members`
                : "New conversation";

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full p-4 flex items-center gap-3 text-left transition-colors border-b border-border/50 hover:bg-muted/50 ${
                    isSelected ? "bg-muted" : ""
                  }`}
                >
                  <div className="relative shrink-0">
                    {isGroup ? (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-[#c084fc]/20 border border-primary/30 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                    ) : (
                      <Avatar className="w-12 h-12 border border-border">
                        <AvatarImage src={displayAvatar || ""} />
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {getInitials(displayName || "?")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    {!isGroup && otherUser && isUserOnline(otherUser.id) && (
                      <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`font-semibold truncate ${conv.unreadCount > 0 ? "text-foreground" : "text-foreground"}`}>
                        {displayName}
                      </span>
                      {conv.lastMessage && (
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {format(new Date(conv.lastMessage.createdAt), "MMM d")}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-sm truncate ${
                          conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {lastMsgPreview}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main: Chat */}
      <div className={`flex-1 bg-background flex flex-col h-full ${!selectedConvId ? "hidden md:flex" : "flex"}`}>
        {selectedConvId ? (
          <ChatView
            conversationId={selectedConvId}
            onBack={() => setSelectedConvId(null)}
            me={me}
            conversation={conversations.find((c: any) => c.id === selectedConvId)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8">
            <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Your Messages</h2>
            <p>Select a conversation or start a new one.</p>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => { setPanelMode("dm"); setShowModeMenu(false); }}
                className="bg-primary text-white rounded-full px-6"
              >
                New Message
              </Button>
              <Button
                onClick={() => { setPanelMode("group"); setShowModeMenu(false); }}
                variant="outline"
                className="rounded-full px-6"
              >
                <Users className="w-4 h-4 mr-2" /> New Group
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Chat View ─────────────────────────────────────────────────────────────────
function ChatView({ conversationId, onBack, me, conversation }: any) {
  const { data: msgData, isLoading, refetch } = useGetMessages(conversationId, {
    query: { enabled: !!conversationId },
  });
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<any | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [readMessageIds, setReadMessageIds] = useState<Set<number>>(new Set());
  const sendMutation = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { socket, isUserOnline } = useSocket();

  const isGroup = conversation?.isGroup;
  const otherUser = !isGroup
    ? conversation?.participants?.find((p: any) => p.id !== me?.id) || conversation?.participants?.[0]
    : null;
  const displayName = isGroup ? conversation?.name : otherUser?.displayName;
  const memberCount = isGroup ? conversation?.participants?.length : null;

  // Sync server messages → local state
  useEffect(() => {
    const msgs = (msgData as any)?.messages || [];
    setLocalMessages(msgs);
    // Pre-populate read IDs from loaded messages
    const readIds = new Set<number>(
      msgs.filter((m: any) => m.senderId === me?.id && m.isRead).map((m: any) => m.id)
    );
    setReadMessageIds(readIds);
  }, [msgData, me?.id]);

  // Socket: join/leave conversation room
  useEffect(() => {
    if (!socket || !conversationId) return;
    socket.emit("join_conversation", String(conversationId));

    const handleNewMessage = (msg: any) => {
      setLocalMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Re-fetch to mark as read
      refetch();
    };

    const handleTyping = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    };

    const handleStopTyping = ({ userId }: { userId: string }) => {
      setTypingUsers((prev) => prev.filter((u) => u !== userId));
    };

    const handleMessagesRead = ({ conversationId: cId, readBy }: { conversationId: number; readBy: number }) => {
      if (cId !== conversationId) return;
      setReadMessageIds((prev) => {
        const next = new Set(prev);
        localMessages.forEach((m) => { if (m.senderId === me?.id) next.add(m.id); });
        return next;
      });
    };

    socket.on("new_message", handleNewMessage);
    socket.on("typing", handleTyping);
    socket.on("stop_typing", handleStopTyping);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.emit("leave_conversation", String(conversationId));
      socket.off("new_message", handleNewMessage);
      socket.off("typing", handleTyping);
      socket.off("stop_typing", handleStopTyping);
      socket.off("messages_read", handleMessagesRead);
    };
  }, [socket, conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages.length, typingUsers.length]);

  const handleTypingEmit = () => {
    if (!socket || !me) return;
    socket.emit("typing", { conversationId: String(conversationId), userId: String(me.id) });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { conversationId: String(conversationId), userId: String(me.id) });
    }, 1500);
  };

  const handleSend = async (opts?: { gifUrl?: string }) => {
    const isGif = !!opts?.gifUrl;
    if (!isGif && !content.trim()) return;

    const payload: any = {
      content: isGif ? "" : content.trim(),
      messageType: isGif ? "gif" : "text",
      ...(isGif && { gifUrl: opts!.gifUrl }),
      ...(replyingTo && { replyToMessageId: replyingTo.id }),
    };

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (socket && me) socket.emit("stop_typing", { conversationId: String(conversationId), userId: String(me.id) });

    setContent("");
    setReplyingTo(null);
    setShowGifPicker(false);

    try {
      await (sendMutation as any).mutateAsync({ id: conversationId, data: payload });
      refetch();
    } catch (e) {
      console.error(e);
    }
  };

  const formatDayGroup = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  // Find typing participants' names
  const typingNames = typingUsers
    .map((uid) => conversation?.participants?.find((p: any) => String(p.id) === uid)?.displayName)
    .filter(Boolean);

  let lastDayStr = "";

  return (
    <>
      {/* Header */}
      <div className="h-16 border-b border-border bg-background flex items-center px-4 shrink-0 shadow-sm z-10 relative">
        <button onClick={onBack} className="md:hidden mr-3 p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {isGroup ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-[#c084fc]/20 border border-primary/30 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-foreground">{displayName}</div>
              <div className="text-xs text-muted-foreground">{memberCount} members</div>
            </div>
          </div>
        ) : otherUser ? (
          <Link href={`/profile/${otherUser.username}`} className="flex items-center gap-3 group">
            <div className="relative shrink-0">
              <Avatar className="w-10 h-10 border border-border">
                <AvatarImage src={otherUser.avatarUrl || ""} />
                <AvatarFallback>{otherUser.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              {isUserOnline(otherUser.id) && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
            <div>
              <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {otherUser.displayName}
              </div>
              <div className="text-xs text-muted-foreground">
                {isUserOnline(otherUser.id) ? (
                  <span className="text-green-500 font-medium">Active now</span>
                ) : (
                  `@${otherUser.username}`
                )}
              </div>
            </div>
          </Link>
        ) : null}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 no-scrollbar">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {localMessages.map((msg: any) => {
              const isMine = msg.senderId === me?.id;
              const msgDate = new Date(msg.createdAt);
              const dayStr = formatDayGroup(msgDate);
              const showDay = dayStr !== lastDayStr;
              if (showDay) lastDayStr = dayStr;
              const senderName = isGroup && !isMine ? msg.sender?.displayName : null;
              const isRead = isMine && (msg.isRead || readMessageIds.has(msg.id));

              return (
                <div key={msg.id} className="flex flex-col">
                  {showDay && (
                    <div className="flex justify-center my-4">
                      <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full font-medium">
                        {dayStr}
                      </span>
                    </div>
                  )}
                  <div className={`flex flex-col max-w-[75%] mb-1 ${isMine ? "self-end items-end" : "self-start items-start"}`}>
                    {senderName && (
                      <span className="text-[11px] text-muted-foreground mb-1 px-1 font-medium">{senderName}</span>
                    )}

                    {/* Reply-to preview */}
                    {msg.replyTo && (
                      <div
                        className={`flex items-start gap-1.5 mb-1 px-3 py-1.5 rounded-xl text-xs opacity-70 max-w-full ${
                          isMine ? "bg-primary/10 border border-primary/20" : "bg-muted/80 border border-border"
                        }`}
                      >
                        <CornerDownRight className="w-3 h-3 shrink-0 mt-0.5 text-muted-foreground" />
                        <span className="text-muted-foreground font-medium truncate">
                          {msg.replyTo.sender?.username}:{" "}
                          {msg.replyTo.messageType === "gif" ? "GIF" : msg.replyTo.content}
                        </span>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`relative group px-4 py-2.5 rounded-2xl text-[15px] shadow-sm cursor-pointer ${
                        isMine
                          ? "bg-gradient-to-br from-primary to-[#c084fc] text-white rounded-br-sm"
                          : "bg-muted text-foreground border border-border/50 rounded-bl-sm"
                      }`}
                      onDoubleClick={() => setReplyingTo(msg)}
                    >
                      {msg.messageType === "gif" && msg.gifUrl ? (
                        <img
                          src={msg.gifUrl}
                          alt="GIF"
                          className="max-w-[220px] max-h-[180px] rounded-lg object-cover"
                          loading="lazy"
                        />
                      ) : msg.mediaUrl ? (
                        <img
                          src={msg.mediaUrl}
                          alt="Media"
                          className="max-w-[220px] max-h-[200px] rounded-lg object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <span>{msg.content}</span>
                      )}

                      {/* Reply button on hover */}
                      <button
                        onClick={() => setReplyingTo(msg)}
                        className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full bg-background/80 border border-border shadow-sm ${
                          isMine ? "-left-9" : "-right-9"
                        }`}
                      >
                        <CornerDownRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>

                    {/* Timestamp + read status */}
                    <div className="flex items-center gap-1 mt-0.5 px-1">
                      <span className="text-[11px] text-muted-foreground">{format(msgDate, "h:mm a")}</span>
                      {isMine && (
                        isRead
                          ? <CheckCheck className="w-3 h-3 text-primary" />
                          : <Check className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingNames.length > 0 && (
              <div className="self-start flex items-center gap-2 mb-2">
                <div className="bg-muted border border-border/50 rounded-2xl rounded-bl-sm px-4 py-2.5 flex items-center gap-1">
                  <span className="text-xs text-muted-foreground">
                    {typingNames.join(", ")} {typingNames.length === 1 ? "is" : "are"} typing
                  </span>
                  <span className="flex gap-0.5 ml-1">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-border bg-background shrink-0 relative">
        <AnimatePresence>
          {showGifPicker && (
            <GifPicker
              onSelect={(url) => handleSend({ gifUrl: url })}
              onClose={() => setShowGifPicker(false)}
            />
          )}
        </AnimatePresence>

        {/* Reply preview */}
        {replyingTo && (
          <div className="flex items-center gap-2 mb-2 bg-muted/60 border border-border rounded-2xl px-3 py-2 text-xs">
            <CornerDownRight className="w-3.5 h-3.5 text-primary shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-primary font-semibold">{replyingTo.sender?.username || "You"}</span>
              <span className="text-muted-foreground ml-1 truncate">
                {replyingTo.messageType === "gif" ? "GIF" : replyingTo.content}
              </span>
            </div>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-muted-foreground hover:text-foreground shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 bg-muted border border-border rounded-3xl p-1.5 focus-within:ring-1 focus-within:ring-primary">
          {/* GIF button */}
          <button
            onClick={() => setShowGifPicker((v) => !v)}
            className={`p-2 rounded-full transition-colors shrink-0 ${
              showGifPicker ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            }`}
            title="Send GIF"
          >
            <Smile className="w-5 h-5" />
          </button>

          <Input
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              handleTypingEmit();
            }}
            onKeyDown={(e) =>
              e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())
            }
            placeholder="Message..."
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 shadow-none px-2 h-10"
          />

          <Button
            size="icon"
            className="rounded-full shrink-0 w-10 h-10 bg-primary hover:bg-primary/90 text-white"
            onClick={() => handleSend()}
            disabled={(!content.trim() && !showGifPicker) || sendMutation.isPending}
          >
            <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
          </Button>
        </div>
      </div>
    </>
  );
}
