import { Link, useLocation } from "wouter";
import { useUser } from "@clerk/react";
import { Home, Compass, Bird, PlaySquare, User } from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";

export default function BottomNav() {
  const [location] = useLocation();
  const { user } = useUser();
  const { data: me } = useGetMe({ query: { enabled: !!user } });

  const profileHref = me?.username ? `/profile/${me.username}` : "/profile";

  const navItems = [
    { href: "/home", icon: Home, label: "Home" },
    { href: "/explore", icon: Compass, label: "Explore" },
    { href: "/chirps", icon: Bird, label: "Chirps" },
    { href: "/reels", icon: PlaySquare, label: "Flow" },
    { href: profileHref, icon: User, label: "Profile" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-card/80 backdrop-blur-xl z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around px-1 py-2">
        {navItems.map((item) => {
          const isActive =
            location === item.href ||
            (item.href.startsWith("/profile/") && location.startsWith("/profile/")) ||
            (item.href === profileHref && location.startsWith("/profile/"));
          return (
            <Link key={item.href} href={item.href} data-testid={`mobile-link-${item.label.toLowerCase()}`}>
              <div className="relative flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 cursor-pointer min-w-[56px]">
                <item.icon
                  className={`w-6 h-6 transition-all duration-200 ${
                    isActive ? "text-primary scale-110" : "text-muted-foreground"
                  }`}
                />
                <span className={`text-[10px] font-medium leading-none transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
