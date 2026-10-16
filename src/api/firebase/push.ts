import { deleteToken, getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { ref, remove, set } from "firebase/database";
import { app, auth, db } from "../../firebase/firebase";

const STORAGE_KEY = "perfect_partners_push";
type PushRegistration = { uid: string; key: string };

export const pushConfigured = Boolean(import.meta.env.VITE_FIREBASE_VAPID_KEY && import.meta.env.VITE_PUSH_WORKER_URL);
export const supportsPush = async () => window.isSecureContext && await isSupported();

const readRegistration = (): PushRegistration | null => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"); }
  catch { return null; }
};

export const hasPushRegistration = (uid: string) => readRegistration()?.uid === uid;

const getWorker = async () => {
  const url = new URL(`${import.meta.env.BASE_URL}firebase-messaging-sw.js`, window.location.origin);
  url.searchParams.set("config", JSON.stringify(app.options));
  const registration = await navigator.serviceWorker.register(url.href, { scope: import.meta.env.BASE_URL });
  if (!registration.active) {
    const worker = registration.installing ?? registration.waiting;
    if (!worker) throw new Error("Le service de notifications est indisponible.");
    await new Promise<void>((resolve, reject) => {
      const check = () => {
        if (worker.state === "activated") { worker.removeEventListener("statechange", check); resolve(); }
        if (worker.state === "redundant") { worker.removeEventListener("statechange", check); reject(new Error("Le service de notifications n'a pas pu démarrer.")); }
      };
      worker.addEventListener("statechange", check);
      check();
    });
  }
  return registration;
};

export const registerPush = async (uid: string) => {
  if (!pushConfigured || Notification.permission !== "granted") throw new Error("Les notifications ne sont pas autorisées.");
  const registration = await getWorker();
  const token = await getToken(getMessaging(app), {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  if (!token) throw new Error("Impossible d'activer les notifications sur cet appareil.");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const key = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  const previous = readRegistration();
  if (auth.currentUser?.uid !== uid) throw new Error("La session a changé. Réessayez.");
  if (previous?.uid === uid && previous.key !== key) await remove(ref(db, `pushTokens/${uid}/${previous.key}`));
  await set(ref(db, `pushTokens/${uid}/${key}`), { token, updatedAt: Date.now() });
  if (auth.currentUser?.uid !== uid) {
    await deleteToken(getMessaging(app));
    throw new Error("La session a changé. Réessayez.");
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ uid, key }));
};

export const unregisterPush = async () => {
  const current = readRegistration();
  if (!current) return;
  await remove(ref(db, `pushTokens/${current.uid}/${current.key}`));
  localStorage.removeItem(STORAGE_KEY);
  if (await supportsPush()) await deleteToken(getMessaging(app));
};

export const listenForPush = (uid: string) => onMessage(getMessaging(app), async (payload) => {
  if (!hasPushRegistration(uid) || Notification.permission !== "granted") return;
  const data = payload.data;
  if (!data || data.uid !== uid) return;
  const registration = await getWorker();
  await registration.showNotification(data.title || "Perfect Partners", {
    body: data.body,
    tag: data.notificationId,
    icon: `${import.meta.env.BASE_URL}push-icon.png`,
    data: { url: new URL(`${import.meta.env.BASE_URL}${data.category === "games" ? "games" : "movies"}`, location.origin).href },
  });
});
