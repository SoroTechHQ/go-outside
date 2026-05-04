self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  event.waitUntil(
    self.registration.showNotification(data.title ?? "GoOutside", {
      body:  data.body  ?? "You have a new message",
      icon:  "/favicon-icon.png",
      badge: "/favicon-icon.png",
      data:  { url: data.url ?? "/dashboard/messages" },
      actions: [
        { action: "open",   title: "Open" },
        { action: "ignore", title: "Dismiss" },
      ],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "ignore") return;

  const url = event.notification.data?.url ?? "/dashboard/messages";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes("/dashboard") && "focus" in client) {
          return client.focus().then(() => client.navigate(url));
        }
      }
      return clients.openWindow(url);
    })
  );
});
