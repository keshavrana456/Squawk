import { Link, useLocation } from "wouter";
import { Bell, MessageCircle } from "lucide-react";
import { useGetUnreadNotificationCount, useGetMe } from "@workspace/api-client-react";
import { useUser } from "@clerk/react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function MobileHeader() {
  const [location] = useLocation();
  const { user } = useUser();
  const { data: me } = useGetMe({ query: { enabled: !!user } });
  const { data: unreadData } = useGetUnreadNotificationCount({ query: { enabled: !!user } });
  const unreadCount = unreadData?.count || 0;

  const hiddenPaths = ["/reels", "/messages"];
  if (hiddenPaths.some(p => location.startsWith(p))) return null;

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-background/80 backdrop-blur-xl border-b border-border">
      <img src={`${BASE}/logo.png`} alt="Squawk" className="h-7 w-auto" />
      <div className="flex items-center gap-1">
        <Link href="/messages">
          <div className="relative p-2 rounded-full hover:bg-muted transition-colors">
            <MessageCircle className="w-6 h-6 text-foreground" />
          </div>
        </Link>
        <Link href="/notifications">
          <div className="relative p-2 rounded-full hover:bg-muted transition-colors">
            <Bell className="w-6 h-6 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
            )}
          </div>
        </Link>
      </div>
    </header>
  );
}
