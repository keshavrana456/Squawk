import { useState } from "react";
import { Heart, MessageCircle, Play, MoreHorizontal, Trash2, Copy } from "lucide-react";
import type { Post } from "@workspace/api-client-react";
import { useDeletePost, useGetMe, getGetUserPostsQueryKey, getGetFeedQueryKey, getListPostsQueryKey } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PostGridProps {
  posts: Post[];
}

export default function PostGrid({ posts }: PostGridProps) {
  const [, navigate] = useLocation();
  const { data: me } = useGetMe();
  const deleteMutation = useDeletePost();
  const queryClient = useQueryClient();
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const handleDelete = (postId: number) => {
    const post = posts.find(p => p.id === postId);
    deleteMutation.mutate({ id: postId }, {
      onSuccess: () => {
        if (post) {
          queryClient.invalidateQueries({ queryKey: getGetUserPostsQueryKey(post.author.username) });
          queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
          queryClient.invalidateQueries({ queryKey: getListPostsQueryKey() });
        }
      },
    });
    setConfirmDeleteId(null);
  };

  const handleCopyLink = (postId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`).catch(() => {});
  };

  if (!posts?.length) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        No posts yet.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-0.5 md:gap-1">
        {posts.map((post) => {
          const isOwner = me && (me as any).id === post.author.id;
          return (
            <div
              key={post.id}
              className="relative aspect-square bg-muted overflow-hidden group cursor-pointer"
              data-testid={`post-grid-item-${post.id}`}
              onClick={() => navigate(`/post/${post.id}`)}
            >
              {post.mediaType === "video" ? (
                <video
                  src={post.mediaUrl}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
              ) : (
                <img
                  src={post.thumbnailUrl || post.mediaUrl}
                  alt={post.caption || "Post"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              )}

              {post.mediaType === "video" && (
                <div className="absolute top-2 right-2 text-white drop-shadow-md">
                  <Play className="w-4 h-4 fill-white" />
                </div>
              )}

              {/* Hover overlay with likes/comments */}
              <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white">
                <div className="flex items-center gap-1 font-bold text-sm">
                  <Heart className="w-4 h-4 fill-white" />
                  <span>{post.likesCount}</span>
                </div>
                <div className="flex items-center gap-1 font-bold text-sm">
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>{post.commentsCount}</span>
                </div>
              </div>

              {/* Three-dots menu — top-right, only shown on hover */}
              <div
                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                onClick={e => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition-colors backdrop-blur-sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    {isOwner && (
                      <>
                        <DropdownMenuItem
                          onClick={() => setConfirmDeleteId(post.id)}
                          className="text-destructive focus:text-destructive cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete post
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={e => handleCopyLink(post.id, e)} className="cursor-pointer">
                      <Copy className="w-4 h-4 mr-2" />
                      Copy link
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={confirmDeleteId !== null} onOpenChange={open => { if (!open) setConfirmDeleteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your post and all its likes and comments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmDeleteId !== null && handleDelete(confirmDeleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
