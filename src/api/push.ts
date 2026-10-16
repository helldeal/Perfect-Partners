import { auth } from "../firebase/firebase";

export type PushTarget = { uid: string; notificationId: string };

export const sendActivityPush = async (targets: PushTarget[]) => {
  const url = import.meta.env.VITE_PUSH_WORKER_URL;
  if (!url || !auth.currentUser || targets.length === 0) return;
  try {
    const endpoint = new URL("send", `${url.replace(/\/$/, "")}/`);
    if (endpoint.protocol !== "https:" && endpoint.hostname !== "localhost" && endpoint.hostname !== "127.0.0.1") throw new Error("Le serveur push doit utiliser HTTPS.");
    const token = await auth.currentUser.getIdToken();
    const outcomes = await Promise.allSettled(targets.map(async (target) => {
      const response = await fetch(endpoint, {
        method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(target), signal: AbortSignal.timeout(15000),
      });
      if (!response.ok) throw new Error(`Serveur push indisponible (${response.status}).`);
    }));
    if (outcomes.some((outcome) => outcome.status === "rejected")) throw new Error("Un ou plusieurs envois push ont échoué.");
  } catch (error) {
    // L'activité reste enregistrée et visible dans le panneau si les push échouent.
    console.error("Impossible d'envoyer les notifications push", error instanceof Error ? error.message : "Erreur inconnue");
  }
};
