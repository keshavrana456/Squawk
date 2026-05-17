import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { Search, TrendingUp } from "lucide-react";
import { useSearch, useGetTrendingHashtags, useGetSuggestedUsers, useGetTrendingPosts, useGetHashtagPosts, type Post } from "@workspace/api-client-react";
import UserCard from "@/components/UserCard";
import PostGrid from "@/components/PostGrid";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [match, params] = useRoute("/explore/hashtags/:tag");
  const tag = match ? params?.tag : null;

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handler);
  }, [query]);

  // Pass an object with query property based on the API definition
  const { data: searchResults, isLoading: isSearchLoading } = useSearch({ query: debouncedQuery, type: "all" }, { query: { enabled: debouncedQuery.length > 0 } });
  const { data: trendingHashtags } = useGetTrendingHashtags();
  const { data: suggestedUsers } = useGetSuggestedUsers();
  const { data: trendingPosts } = useGetTrendingPosts();
  const { data: hashtagPosts } = useGetHashtagPosts(tag || "", { query: { enabled: !!tag } });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto p-4 md:p-8 dark">
      {!tag && (
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users, hashtags, or posts..." 
            className="w-full bg-card border-border pl-12 h-14 rounded-2xl text-lg focus-visible:ring-primary"
          />
        </div>
      )}

      {tag ? (
        <div>
          <div className="mb-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-bold text-3xl">#</div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">#{tag}</h1>
              <p className="text-muted-foreground">{(hashtagPosts as any)?.items?.length || 0} posts</p>
            </div>
          </div>
          <PostGrid posts={((hashtagPosts as any)?.items as Post[]) || []} />
        </div>
      ) : debouncedQuery ? (
        <div className="space-y-8">
          {(searchResults as any)?.users?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Users</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(searchResults as any).users.map((u: any) => <UserCard key={u.id} user={u} />)}
              </div>
            </div>
          )}
          {(searchResults as any)?.posts?.length > 0 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Posts</h2>
              <PostGrid posts={((searchResults as any).posts as Post[]) || []} />
            </div>
          )}
          {!isSearchLoading && !(searchResults as any)?.users?.length && !(searchResults as any)?.posts?.length && (
            <div className="text-center p-12 text-muted-foreground bg-card rounded-xl border border-border">
              No results found for "{debouncedQuery}"
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          <div>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-foreground">
              <TrendingUp className="w-5 h-5 text-primary" /> Trending Hashtags
            </h2>
            <div className="flex flex-wrap gap-2">
              {trendingHashtags?.map((th: any) => (
                <Link key={th.tag} href={`/explore/hashtags/${th.tag}`}>
                  <span className="px-5 py-2.5 bg-card border border-border rounded-full hover:border-primary hover:text-primary transition-colors cursor-pointer text-sm font-medium">#{th.tag}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-4 text-foreground">Suggested Creators</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {suggestedUsers?.map(user => (
                <div key={user.id} className="min-w-[280px]">
                  <UserCard user={user} />
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold mb-4 text-foreground">Explore Posts</h2>
            <PostGrid posts={((trendingPosts as any)?.items as Post[]) || []} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
