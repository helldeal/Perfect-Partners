import { useEffect, useState } from "react";
import { useAuth } from "../contexts/authContext";
import { hasPushRegistration, listenForPush, pushConfigured, registerPush, supportsPush, unregisterPush } from "../api/firebase/push";

export const usePushNotifications = () => {
  const { currentUser } = useAuth();
  const [supported, setSupported] = useState<boolean | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    const sync = async () => {
      try {
        const available = await supportsPush();
        if (cancelled) return;
        setSupported(available);
        if (!available || !currentUser) { setEnabled(false); return; }
        setPermission(Notification.permission);
        const active = Notification.permission === "granted" && hasPushRegistration(currentUser.uid);
        if (Notification.permission !== "granted" && hasPushRegistration(currentUser.uid)) await unregisterPush();
        setEnabled(active);
        if (active && pushConfigured) {
          await registerPush(currentUser.uid);
          if (!cancelled) { unsubscribe?.(); unsubscribe = listenForPush(currentUser.uid); }
        }
      } catch { if (!cancelled) { setEnabled(false); setError("Impossible de synchroniser les notifications. Réessayez."); } }
    };
    void sync();
    window.addEventListener("focus", sync);
    return () => { cancelled = true; unsubscribe?.(); window.removeEventListener("focus", sync); };
  }, [currentUser, enabled]);

  const toggle = async () => {
    if (!currentUser || busy) return;
    setBusy(true);
    setError("");
    try {
      if (enabled) { await unregisterPush(); setEnabled(false); }
      else {
        // L'autorisation reste directement liée au geste de l'utilisateur.
        const result = await Notification.requestPermission();
        setPermission(result);
        if (result !== "granted") return;
        await registerPush(currentUser.uid);
        setEnabled(true);
      }
    } catch { setError("Impossible de modifier les notifications. Réessayez."); }
    finally { setBusy(false); }
  };

  return { supported, configured: pushConfigured, enabled, permission, busy, error, toggle };
};
