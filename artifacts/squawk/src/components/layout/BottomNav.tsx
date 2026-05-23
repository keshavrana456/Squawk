import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Home, Compass, PlusSquare, User, MessageCircle, Bell } from "lucide-react";
import { useGetMe, useGetUnreadNotificationCount, useGetConversations } from "@workspace/api-client-react";

export default function BottomNav() {
  const [location] = useLocation();
  const { user } = useUser();
  const { data: me } = useGetMe({ query: { enabled: !!user } });
  const { data: unreadData } = useGetUnreadNotificationCount({
    query: { enabled: !!user, refetchInterval: 30000 },
  });
  const { data: conversations } = useGetConversations({
    query: { enabled: !!user, refetchInterval: 15000 },
  });

  const unreadNotifications = unreadData?.count || 0;
  const unreadMessages = Array.isArray(conversations)
    ? conversations.reduce((sum, c) => sum + ((c as any).unreadCount || 0), 0)
    : 0;

  const profileHref = me?.username ? `/profile/${me.username}` : "/profile";

  const navItems = [
    { href: "/home", icon: Home, label: "Home", badge: 0 },
    { href: "/explore", icon: Compass, label: "Explore", badge: 0 },
    { href: "/upload", icon: PlusSquare, label: "Create", badge: 0 },
    { href: "/messages", icon: MessageCircle, label: "Messages", badge: unreadMessages },
    { href: "/notifications", icon: Bell, label: "Notifications", badge: unreadNotifications },
    { href: profileHref, icon: User, label: "Profile", badge: 0 },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/80 backdrop-blur-xl pb-safe z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href.startsWith("/profile/") && location.startsWith("/profile/"));
          return (
            <Link key={item.href} href={item.href} data-testid={`mobile-link-${item.label.toLowerCase()}`}>
              <div className="relative p-3 flex items-center justify-center cursor-pointer">
                <item.icon
                  className={`w-6 h-6 transition-all duration-200 ${
                    isActive ? "text-primary scale-110" : "text-muted-foreground"
                  }`}
                />
                {item.badge > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-primary text-primary-foreground text-[9px] font-black min-w-[16px] h-4 px-0.5 flex items-center justify-center rounded-full leading-none">
                    {item.badge > 99 ? "99+" : item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
