import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { Home, Compass, PlaySquare, PlusSquare, MessageCircle, Bell, User, Settings, LogOut } from "lucide-react";
import { useGetUnreadNotificationCount } from "@workspace/api-client-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { signOut } = useClerk();
  
  const { data: unreadData } = useGetUnreadNotificationCount({ query: { enabled: !!user } });
  const unreadCount = unreadData?.count || 0;

  const navItems = [
    { href: "/home", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/reels", label: "Reels", icon: PlaySquare },
    { href: "/messages", label: "Messages", icon: MessageCircle },
    { href: "/notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { href: "/upload", label: "Create", icon: PlusSquare },
    { href: `/profile/${user?.username || ''}`, label: "Profile", icon: User },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-border bg-card/50 backdrop-blur-xl h-full p-4 justify-between sticky top-0">
      <div>
        <Link href="/home" className="flex items-center gap-3 px-4 py-4 mb-8" data-testid="link-logo">
          <img src={import.meta.env.BASE_URL.replace(/\/$/, "") + "/logo.png"} alt="Squawk Logo" className="h-9 w-auto" />
        </Link>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href.startsWith("/profile/") && location.startsWith("/profile/"));
            return (
              <Link key={item.href} href={item.href} className="block" data-testid={`link-${item.label.toLowerCase()}`}>
                <div className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group cursor-pointer ${isActive ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                  <item.icon className={`w-6 h-6 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  <span className="text-lg">{item.label}</span>
                  {item.badge ? (
                    <span className="ml-auto bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  ) : null}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>
      <div className="space-y-2">
        <Link href="/settings" className="block" data-testid="link-settings">
          <div className="flex items-center gap-4 px-4 py-3 rounded-2xl text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer">
            <Settings className="w-6 h-6" />
            <span className="text-lg">Settings</span>
          </div>
        </Link>
        <button 
          onClick={() => signOut({ redirectUrl: "/" })}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
          data-testid="button-logout"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-lg">Log out</span>
        </button>
      </div>
    </aside>
  );
}
