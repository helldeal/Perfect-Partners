import { createDatabase, getAccess, HttpError, sendMessage, verifyUser } from "./firebase.js";
import { buildMessage } from "./message.js";

const validKey = (value) => typeof value === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(value);

export const handleRequest = async (request, env, services = {}) => {
  const origin = request.headers.get("Origin");
  const allowedOrigins = (env.ALLOWED_ORIGINS ?? env.ALLOWED_ORIGIN ?? "")
    .split(",").map((value) => value.trim()).filter(Boolean);
  if (!origin || !allowedOrigins.includes(origin)) return new Response("Origin refused", { status: 403 });
  const headers = {
    "Access-Control-Allow-Origin": origin, Vary: "Origin", "Cache-Control": "no-store",
    "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Authorization, Content-Type",
  };
  const json = (value, status = 200) => Response.json(value, { status, headers });
  if (new URL(request.url).pathname !== "/send") return json({ error: "Route inconnue." }, 404);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return json({ error: "Méthode refusée." }, 405);
  try {
    const bearer = request.headers.get("Authorization")?.match(/^Bearer (\S+)$/)?.[1];
    if (!bearer) throw new HttpError(401, "Connexion requise.");
    const caller = await (services.verifyUser ?? verifyUser)(bearer, env.FIREBASE_PROJECT_ID);
    const bodyText = await request.text();
    if (bodyText.length > 2048) throw new HttpError(413, "Requête trop volumineuse.");
    let body;
    try { body = JSON.parse(bodyText); } catch { throw new HttpError(400, "Requête invalide."); }
    if (!body || !validKey(body.uid) || !validKey(body.notificationId)) throw new HttpError(400, "Identifiants invalides.");
    const access = services.database ? null : await getAccess(env);
    const database = services.database ?? createDatabase(env, access);
    const allowed = await database.get("allowedUsers");
    if (!Object.hasOwn(allowed ?? {}, caller) || allowed[caller] !== true || !Object.hasOwn(allowed ?? {}, body.uid) || allowed[body.uid] !== true) throw new HttpError(403, "Compte non autorisé.");
    const notification = await database.get(`notifications/${body.uid}/${body.notificationId}`);
    if (!notification) throw new HttpError(404, "Notification introuvable.");
    const system = notification.actorId === "system" && notification.action === "new_season" && body.notificationId.startsWith("system-");
    if (!system && notification.actorId !== caller) throw new HttpError(403, "Vous n'êtes pas l'auteur de cette activité.");
    const age = Date.now() - notification.createdAt;
    if (!Number.isFinite(age) || age < -60000 || age > 600000) throw new HttpError(410, "Notification trop ancienne.");
    const data = buildMessage(notification, body.uid, body.notificationId);
    if (!data) return json({ status: "ignored" });
    const deliveries = `pushDeliveries/${body.uid}/${body.notificationId}`;
    const claim = await database.claim(deliveries);
    if (claim === "sent") return json({ status: "already-sent" });
    if (claim === "busy") return json({ error: "Envoi déjà en cours." }, 409);
    try {
      const tokens = await database.get(`pushTokens/${body.uid}`);
      const devices = Object.entries(tokens ?? {}).filter(([key, device]) => /^[a-f0-9]{64}$/.test(key) && typeof device?.token === "string" && device.token.length > 0 && device.token.length < 4096);
      if (devices.length > 20) throw new HttpError(409, "Trop d'appareils enregistrés.");
      // Sérialisation pour limiter les sous-requêtes du Worker et nettoyer les jetons invalides.
      for (const [key, device] of devices) {
        const result = await (services.send ?? ((token, message) => sendMessage(env, access, token, message)))(device.token, data);
        if (result === "invalid") await database.remove(`pushTokens/${body.uid}/${key}`);
      }
      await database.put(deliveries, { status: "sent", updatedAt: Date.now() });
      return json({ status: "sent" });
    } catch (error) {
      await database.remove(deliveries).catch(() => {});
      throw error;
    }
  } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    // Ne pas exposer les jetons, messages privés ou erreurs de services au navigateur.
    console.error("Push request failed", { type: error?.name || "Error" });
    return json({ error: "Envoi push indisponible." }, 503);
  }
};

export default { fetch: handleRequest };
