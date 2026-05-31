import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { Home, Compass, PlaySquare, PlusSquare, MessageCircle, Bell, User, Settings, LogOut, Sun, Moon, Bird, LogIn } from "lucide-react";
import { useGetUnreadNotificationCount, useGetMe } from "@workspace/api-client-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { data: me } = useGetMe({ query: { enabled: !!user } });
  const { theme, toggle } = useTheme();

  const { data: unreadData } = useGetUnreadNotificationCount({ query: { enabled: !!user, refetchInterval: 12_000 } });
  const unreadCount = unreadData?.count || 0;

  const { data: unreadMsgData } = useQuery({
    queryKey: ["conversations-unread-count"],
    queryFn: () => fetch("/api/conversations/unread-count", { credentials: "include" }).then(r => r.json()),
    refetchInterval: 12_000,
    enabled: !!user,
  });
  const unreadMsgCount = location === "/messages" ? 0 : (unreadMsgData?.count || 0);

  const profileHref = me?.username ? `/profile/${me.username}` : "/profile";

  const guestNavItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/flows", label: "Flow", icon: PlaySquare },
    { href: "/chirps", label: "Chirps", icon: Bird },
  ];

  const authNavItems = [
    ...guestNavItems,
    { href: "/messages", label: "Messages", icon: MessageCircle, badge: unreadMsgCount },
    { href: "/notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { href: "/upload", label: "Create", icon: PlusSquare },
    { href: profileHref, label: "Profile", icon: User },
  ];

  const navItems = user ? authNavItems : guestNavItems;

  return (
    <aside className="hidden md:flex flex-col border-r border-white/10 bg-card/70 backdrop-blur-2xl h-full sticky top-0 w-16 lg:w-64 p-2 lg:p-4 shrink-0 overflow-hidden shadow-[4px_0_30px_rgba(0,0,0,0.3)]">
      <Link href="/home" className="flex items-center justify-center lg:justify-start gap-3 px-2 lg:px-4 py-4 mb-4 lg:mb-6 shrink-0" data-testid="link-logo">
        <img src={import.meta.env.BASE_URL.replace(/\/$/, "") + "/logo.png"} alt="Squawk Logo" className="h-8 w-auto" />
      </Link>

      {/* Scrollable nav area */}
      <div className="flex-1 overflow-y-auto no-scrollbar min-h-0">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href.startsWith("/profile/") && location.startsWith("/profile/"));
            return (
              <Link key={item.href} href={item.href} className="block" data-testid={`link-${item.label.toLowerCase()}`}>
                <div className={`flex items-center gap-0 lg:gap-4 justify-center lg:justify-start px-2 lg:px-4 py-3 rounded-2xl transition-all duration-200 group cursor-pointer ${isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                  <div className="relative shrink-0">
                    <item.icon className={`w-6 h-6 transition-transform ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                    {(item as any).badge ? (
                      <span className="lg:hidden absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                        {(item as any).badge > 9 ? "9+" : (item as any).badge}
                      </span>
                    ) : null}
                  </div>
                  <span className="hidden lg:block text-lg">{item.label}</span>
                  {(item as any).badge ? (
                    <span className="hidden lg:block ml-auto bg-primary text-primary-foreground text-xs font-black px-2 py-0.5 rounded-full min-w-[22px] text-center">
                      {(item as any).badge > 99 ? "99+" : (item as any).badge}
                    </span>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="space-y-1 shrink-0 pt-2">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="w-full flex items-center justify-center lg:justify-start gap-0 lg:gap-4 px-2 lg:px-4 py-3 rounded-2xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer group"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark"
            ? <Sun className="w-6 h-6 shrink-0 group-hover:text-yellow-400 transition-colors" />
            : <Moon className="w-6 h-6 shrink-0 group-hover:text-primary transition-colors" />
          }
          <span className="hidden lg:block text-lg">{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {user ? (
          <>
            <Link href="/settings" className="block" data-testid="link-settings">
              <div className="flex items-center justify-center lg:justify-start gap-0 lg:gap-4 px-2 lg:px-4 py-3 rounded-2xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer">
                <Settings className="w-6 h-6 shrink-0" />
                <span className="hidden lg:block text-lg">Settings</span>
              </div>
            </Link>
            <button
              onClick={() => signOut({ redirectUrl: "/" })}
              className="w-full flex items-center justify-center lg:justify-start gap-0 lg:gap-4 px-2 lg:px-4 py-3 rounded-2xl text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
              data-testid="button-logout"
            >
              <LogOut className="w-6 h-6 shrink-0" />
              <span className="hidden lg:block text-lg">Log out</span>
            </button>
          </>
        ) : (
          <Link href="/sign-in" className="block">
            <div className="flex items-center justify-center lg:justify-start gap-0 lg:gap-4 px-2 lg:px-4 py-3 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-all cursor-pointer font-semibold">
              <LogIn className="w-6 h-6 shrink-0" />
              <span className="hidden lg:block text-lg">Sign In</span>
            </div>
          </Link>
        )}
      </div>
    </aside>
  );
}
