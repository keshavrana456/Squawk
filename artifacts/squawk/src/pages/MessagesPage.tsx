import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { Send, Plus, ArrowLeft, MessageCircle } from "lucide-react";
import { useGetConversations, useGetMessages, useSendMessage, useCreateConversation, useGetMe, type Conversation, type Message } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, isSameDay, isToday, isYesterday } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

export default function MessagesPage() {
  const { data: me } = useGetMe();
  const { data: convData, isLoading: isLoadingConvs } = useGetConversations();
  const conversations = (convData as any)?.items || [];
  
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [showNewConv, setShowNewConv] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  
  const createConvMutation = useCreateConversation();

  const handleCreateConv = async () => {
    if (!newUsername.trim()) return;
    try {
      const conv = await createConvMutation.mutateAsync({ data: { username: newUsername.trim() } });
      setSelectedConvId(conv.id);
      setShowNewConv(false);
      setNewUsername("");
    } catch (e) {
      console.error(e);
    }
  };

  const getInitials = (n: string) => n ? n.charAt(0).toUpperCase() : '?';

  return (
    <div className="flex h-[100dvh] w-full bg-background dark overflow-hidden relative">
      {/* Sidebar: Conversation List */}
      <div className={`w-full md:w-[320px] lg:w-[380px] shrink-0 border-r border-border bg-card flex flex-col h-full ${selectedConvId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">Messages</h1>
          <Button variant="ghost" size="icon" onClick={() => setShowNewConv(true)} className="text-primary hover:bg-primary/10">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {showNewConv && (
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex gap-2">
              <Input 
                placeholder="Enter username..." 
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                className="bg-background"
                autoFocus
              />
              <Button onClick={handleCreateConv} disabled={createConvMutation.isPending || !newUsername}>
                Start
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => setShowNewConv(false)}>
              Cancel
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto no-scrollbar">
          {isLoadingConvs ? (
            <div className="p-4 space-y-4">
              {[1,2,3].map(i => (
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
              <p className="text-sm mt-1">Start a conversation to connect with others.</p>
            </div>
          ) : (
            conversations.map((conv: Conversation) => {
              const otherUser = conv.participants.find(p => p.id !== me?.id) || conv.participants[0];
              if (!otherUser) return null;
              
              const isSelected = selectedConvId === conv.id;
              
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`w-full p-4 flex items-center gap-3 text-left transition-colors border-b border-border/50 hover:bg-muted/50 ${isSelected ? 'bg-muted' : ''}`}
                >
                  <Avatar className="w-12 h-12 border border-border">
                    <AvatarImage src={otherUser.avatarUrl || ''} />
                    <AvatarFallback className="bg-primary/20 text-primary">{getInitials(otherUser.displayName)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="font-semibold text-foreground truncate">{otherUser.displayName}</span>
                      {conv.lastMessage && (
                        <span className="text-xs text-muted-foreground shrink-0 ml-2">
                          {format(new Date(conv.lastMessage.createdAt), 'MMM d')}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-sm truncate ${conv.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {conv.lastMessage ? (
                          conv.lastMessage.senderId === me?.id ? `You: ${conv.lastMessage.content}` : conv.lastMessage.content
                        ) : 'New conversation'}
                      </span>
                      {conv.unreadCount > 0 && (
                        <span className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-2 shrink-0">
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

      {/* Main Area: Chat View */}
      <div className={`flex-1 bg-background flex flex-col h-full ${!selectedConvId ? 'hidden md:flex' : 'flex'}`}>
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
            <Button onClick={() => setShowNewConv(true)} className="mt-6 bg-primary text-white rounded-full px-8">
              Send Message
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ChatView({ conversationId, onBack, me, conversation }: any) {
  const { data: msgData, isLoading } = useGetMessages(conversationId, { query: { enabled: !!conversationId, refetchInterval: 3000 } });
  const messages = (msgData as any)?.items || [];
  
  const [content, setContent] = useState("");
  const sendMutation = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherUser = conversation?.participants?.find((p: any) => p.id !== me?.id) || conversation?.participants?.[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = () => {
    if (!content.trim()) return;
    sendMutation.mutate({ data: { conversationId, content: content.trim() } }, {
      onSuccess: () => setContent("")
    });
  };

  const formatDayGroup = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMMM d, yyyy");
  };

  let lastDayStr = "";

  return (
    <>
      {/* Chat Header */}
      <div className="h-16 border-b border-border bg-card flex items-center px-4 shrink-0 shadow-sm z-10 relative">
        <button onClick={onBack} className="md:hidden mr-3 p-2 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </button>
        {otherUser && (
          <Link href={`/profile/${otherUser.username}`} className="flex items-center gap-3">
            <Avatar className="w-10 h-10 border border-border">
              <AvatarImage src={otherUser.avatarUrl || ''} />
              <AvatarFallback>{otherUser.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-semibold text-foreground">{otherUser.displayName}</div>
              <div className="text-xs text-muted-foreground">@{otherUser.username}</div>
            </div>
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          [...messages].reverse().map((msg: Message) => {
            const isMe = msg.senderId === me?.id;
            const msgDate = new Date(msg.createdAt);
            const dayStr = formatDayGroup(msgDate);
            const showDay = dayStr !== lastDayStr;
            if (showDay) lastDayStr = dayStr;

            return (
              <div key={msg.id} className="flex flex-col">
                {showDay && (
                  <div className="flex justify-center my-4">
                    <span className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full font-medium">
                      {dayStr}
                    </span>
                  </div>
                )}
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                  <div 
                    className={`px-4 py-2.5 rounded-2xl text-[15px] shadow-sm ${
                      isMe 
                        ? 'bg-gradient-to-br from-primary to-[#c084fc] text-white rounded-br-sm' 
                        : 'bg-muted text-foreground border border-border/50 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[11px] text-muted-foreground mt-1 px-1">
                    {format(msgDate, 'h:mm a')}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card shrink-0">
        <div className="flex items-end gap-2 bg-input border border-border rounded-3xl p-1.5 focus-within:ring-1 focus-within:ring-primary">
          <Input
            value={content}
            onChange={e => setContent(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
            placeholder="Message..."
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 shadow-none px-4 h-10"
          />
          <Button 
            size="icon" 
            className="rounded-full shrink-0 w-10 h-10 bg-primary hover:bg-primary/90 text-white" 
            onClick={handleSend}
            disabled={!content.trim() || sendMutation.isPending}
          >
            <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
          </Button>
        </div>
      </div>
    </>
  );
}
