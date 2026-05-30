---
name: Push notification deep links
description: Convention for URLs passed to sendPushToUser and emitToUser in all routes
---

## Rule
Every `sendPushToUser(...)` and `emitToUser(...)` "notification" event must include a specific deep-link URL, not the generic `/notifications` fallback.

**Why:** Clicking a push or in-app notification should open the exact content that triggered it — the chirp, the post, or the comment — not just the notifications list page.

**How to apply:**
- Chirp reply → `/chirps/${parentChirpId}?comment=${newChirpId}`
- Chirp like / rechirp / mention → `/chirps/${chirpId}`
- Post comment → `/post/${postId}?comment=${commentId}`
- Post like → `/post/${postId}`
- Post / comment mention → `/post/${postId}`
- `fireBrowserNotif` in SocketContext accepts a 4th `url` arg; always pass it
- `sw.js` notificationclick already navigates to `event.notification.data.url` — this is the downstream handler
