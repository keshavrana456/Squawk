import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Home, Compass, PlaySquare, PlusSquare, User, Feather } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

export default function BottomNav() {
  const [location] = useLocation();
  const { user } = useUser();
  const { data: me } = useGetMe({ query: { enabled: !!user } });

  const profileHref = me?.username ? `/profile/${me.username}` : "/profile";

  const navItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/chirps", icon: Feather, label: "Chirps" },
    { href: "/reels", icon: PlaySquare, label: "Flow" },
    { href: "/upload", icon: PlusSquare, label: "Create" },
    { href: profileHref, icon: User, label: "Profile" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/80 backdrop-blur-xl pb-safe z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href.startsWith("/profile/") && location.startsWith("/profile/"));
          return (
            <Link key={item.href} href={item.href} data-testid={`mobile-link-${item.label.toLowerCase()}`}>
              <div className="relative p-3 flex items-center justify-center cursor-pointer">
                <item.icon className={`w-6 h-6 transition-all duration-200 ${isActive ? 'text-primary scale-110' : 'text-muted-foreground'}`} />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
