self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: "Squawk", body: event.data.text(), url: "/" };
  }

  const title = data.title || "Squawk";

  // Call notifications get special treatment: persistent, with actions
  const isCall = !!data.isCall;
  const options = {
    body: data.body || "",
    icon: data.icon || "/logo.png",
    badge: data.badge || "/logo.png",
    data: { url: data.url || "/" },
    vibrate: isCall ? [300, 100, 300, 100, 300] : [100, 50, 100],
    tag: data.tag || `squawk-${Date.now()}`,
    requireInteraction: data.requireInteraction ?? isCall,
    renotify: data.renotify ?? true,
    actions: isCall
      ? [
          { action: "accept", title: "Accept" },
          { action: "decline", title: "Decline" },
        ]
      : (data.actions || []),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  const action = event.action;

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // For call notifications, send the action to the open app window
        if (action === "decline") {
          for (const client of clientList) {
            client.postMessage({ type: "call_action", action: "decline" });
            if ("focus" in client) return client.focus();
          }
          return;
        }

        // Accept or regular click — navigate to the URL
        for (const client of clientList) {
          if ("focus" in client) {
            client.navigate(url);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(url);
      })
  );
});
