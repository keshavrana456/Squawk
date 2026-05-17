import { Link } from "wouter";
import { useState } from "react";
import { BadgeCheck } from "lucide-react";
import { useFollowUser, useUnfollowUser, type UserSummary } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface UserCardProps {
  user: UserSummary;
}

export default function UserCard({ user }: UserCardProps) {
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const [isFollowing, setIsFollowing] = useState(user.isFollowing);

  const getInitials = (name: string) => name ? name.charAt(0).toUpperCase() : '?';
  const avatarColor = `hsl(${user.username.length * 50 % 360}, 70%, 50%)`;

  const handleFollowToggle = () => {
    const newFollowing = !isFollowing;
    setIsFollowing(newFollowing);
    
    if (newFollowing) {
      followMutation.mutate({ username: user.username }, {
        onError: () => setIsFollowing(false)
      });
    } else {
      unfollowMutation.mutate({ username: user.username }, {
        onError: () => setIsFollowing(true)
      });
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl w-full min-w-[280px] max-w-sm dark" data-testid={`user-card-${user.username}`}>
      <Link href={`/profile/${user.username}`} className="flex items-center gap-3 overflow-hidden" data-testid={`link-profile-${user.username}`}>
        <Avatar className="w-12 h-12 border border-border">
          <AvatarImage src={user.avatarUrl || ''} />
          <AvatarFallback style={{ backgroundColor: avatarColor, color: 'white' }}>
            {getInitials(user.displayName)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col overflow-hidden">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-foreground truncate">{user.username}</span>
            {user.isVerified && <BadgeCheck className="w-4 h-4 text-primary shrink-0" />}
          </div>
          <span className="text-sm text-muted-foreground truncate">{user.displayName}</span>
          {user.bio && <span className="text-xs text-muted-foreground truncate mt-0.5">{user.bio}</span>}
        </div>
      </Link>
      
      <Button 
        variant={isFollowing ? "secondary" : "default"} 
        size="sm" 
        onClick={handleFollowToggle}
        className={!isFollowing ? "bg-gradient-to-r from-primary to-[#06b6d4] text-white border-0 hover:opacity-90" : ""}
        data-testid={`button-follow-${user.username}`}
      >
        {isFollowing ? "Following" : "Follow"}
      </Button>
    </div>
  );
}
