import { Link, useLocation } from "wouter";
import { Bell, MessageCircle, PlusSquare, LogIn } from "lucide-react";
import { useGetUnreadNotificationCount, useGetMe } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function MobileHeader() {
  const [location] = useLocation();
  const { user } = useUser();
  const { data: me } = useGetMe({ query: { enabled: !!user } });
  const { data: unreadData } = useGetUnreadNotificationCount({ query: { enabled: !!user, refetchInterval: 12_000 } });
  const unreadCount = unreadData?.count || 0;

  const { data: unreadMsgData } = useQuery({
    queryKey: ["conversations-unread-count"],
    queryFn: () => fetch("/api/conversations/unread-count", { credentials: "include" }).then(r => r.json()),
    refetchInterval: 12_000,
    enabled: !!user,
  });
  const unreadMsgCount = location === "/messages" ? 0 : (unreadMsgData?.count || 0);

  const hiddenPaths = ["/flows", "/messages"];
  if (hiddenPaths.some((p) => location.startsWith(p))) return null;

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-2 py-2 bg-background/75 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
      {/* Left: create post (signed-in only) */}
      {user ? (
        <Link href="/upload">
          <div className="p-2.5 rounded-full hover:bg-muted transition-colors">
            <PlusSquare className="w-6 h-6 text-foreground" />
          </div>
        </Link>
      ) : (
        <div className="w-11" />
      )}

      {/* Center: logo */}
      <Link href="/home" className="flex items-center">
        <img src={`${BASE}/logo.png`} alt="Squawk" className="h-8 w-auto" />
      </Link>

      {/* Right: auth actions or Sign In */}
      {user ? (
        <div className="flex items-center gap-0.5">
          <Link href="/notifications">
            <div className="relative p-2.5 rounded-full hover:bg-muted transition-colors">
              <Bell className="w-6 h-6 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full border-2 border-background" />
              )}
            </div>
          </Link>
          <Link href="/messages">
            <div className="relative p-2.5 rounded-full hover:bg-muted transition-colors">
              <MessageCircle className="w-6 h-6 text-foreground" />
              {unreadMsgCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 bg-primary text-primary-foreground text-[9px] font-black rounded-full flex items-center justify-center px-0.5 border border-background">
                  {unreadMsgCount > 9 ? "9+" : unreadMsgCount}
                </span>
              )}
            </div>
          </Link>
        </div>
      ) : (
        <Link href="/sign-in">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold text-sm">
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </div>
        </Link>
      )}
    </header>
  );
}
