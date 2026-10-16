/* global firebase */
// Le gestionnaire de clic doit être installé avant Firebase Messaging.
self.addEventListener("notificationclick", (event) => {
  event.stopImmediatePropagation();
  event.notification.close();
  const fallback = new URL("movies", self.registration.scope);
  const target = new URL(event.notification.data?.url || fallback.href, self.registration.scope);
  if (target.origin !== self.location.origin || !target.href.startsWith(self.registration.scope)) return;
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(async (windows) => {
    const existing = windows.find((client) => client.url.startsWith(self.registration.scope));
    if (existing) {
      try {
        // Donner le focus avant une navigation qui pourrait invalider le client.
        await existing.focus();
        if (existing.url !== target.href) await existing.navigate(target.href);
        return;
      } catch {
        // Réessayer avec une fenêtre ouverte directement depuis le clic.
      }
    }
    const opened = await clients.openWindow(target.href);
    if (opened) await opened.focus().catch(() => {});
  }));
});

importScripts("https://www.gstatic.com/firebasejs/13.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging-compat.js");
const config = JSON.parse(new URL(self.location.href).searchParams.get("config"));
firebase.initializeApp(config);
firebase.messaging().onBackgroundMessage((payload) => {
  const data = payload.data;
  if (!data) return;
  return self.registration.showNotification(data.title || "Perfect Partners", {
    body: data.body,
    tag: data.notificationId,
    icon: new URL("push-icon.png", self.registration.scope).href,
    data: { url: new URL(data.category === "games" ? "games" : "movies", self.registration.scope).href },
  });
});
