import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MentionUser } from "@/hooks/useMentions";

interface MentionSuggestionsProps {
  suggestions: MentionUser[];
  loading: boolean;
  isOpen: boolean;
  onSelect: (username: string) => void;
  className?: string;
}

export default function MentionSuggestions({
  suggestions,
  loading,
  isOpen,
  onSelect,
  className = "",
}: MentionSuggestionsProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.12 }}
          className={`bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 ${className}`}
        >
          {loading && suggestions.length === 0 ? (
            <div className="flex items-center justify-center py-3">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            suggestions.map((user) => (
              <button
                key={user.id}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect(user.username);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted transition-colors text-left"
              >
                <Avatar className="w-7 h-7 shrink-0 border border-border">
                  <AvatarImage src={user.avatarUrl || ""} />
                  <AvatarFallback className="text-[10px] bg-primary/20 text-primary font-bold">
                    {(user.displayName || user.username)?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate leading-tight">
                    {user.displayName}
                  </p>
                  <p className="text-xs text-muted-foreground truncate leading-tight">
                    @{user.username}
                  </p>
                </div>
              </button>
            ))
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
