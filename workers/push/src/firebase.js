import { createRemoteJWKSet, importPKCS8, jwtVerify, SignJWT } from "jose";

const keys = createRemoteJWKSet(new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"));
let cachedAccess;
let pendingAccess;

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export const verifyUser = async (token, projectId, keySet = keys) => {
  try {
    const { payload } = await jwtVerify(token, keySet, {
      algorithms: ["RS256"], audience: projectId, issuer: `https://securetoken.google.com/${projectId}`,
      requiredClaims: ["exp", "iat", "auth_time", "sub"],
    });
    const now = Math.floor(Date.now() / 1000);
    if (!payload.sub || payload.sub.length > 128 || payload.iat > now || typeof payload.auth_time !== "number" || payload.auth_time > now) throw new Error("Invalid claims");
    return payload.sub;
  } catch { throw new HttpError(401, "Session invalide ou expirée."); }
};

const exchangeAccess = async (env) => {
  const service = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT);
  if (service.project_id !== env.FIREBASE_PROJECT_ID || !service.client_email || !service.private_key) throw new Error("Invalid server configuration");
  const privateKey = await importPKCS8(service.private_key, "RS256");
  const assertion = await new SignJWT({
    scope: "https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email",
  }).setProtectedHeader({ alg: "RS256", typ: "JWT" }).setIssuer(service.client_email)
    .setAudience("https://oauth2.googleapis.com/token").setIssuedAt().setExpirationTime("1h").sign(privateKey);
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`OAuth failed: ${response.status}`);
  const result = await response.json();
  if (typeof result.access_token !== "string" || typeof result.expires_in !== "number") throw new Error("Invalid OAuth response");
  return { token: result.access_token, expires: Date.now() + result.expires_in * 1000, credential: env.FIREBASE_SERVICE_ACCOUNT };
};

export const getAccess = async (env) => {
  if (cachedAccess?.credential === env.FIREBASE_SERVICE_ACCOUNT && cachedAccess.expires > Date.now() + 60000) return cachedAccess.token;
  pendingAccess ??= exchangeAccess(env);
  try { cachedAccess = await pendingAccess; return cachedAccess.token; }
  finally { pendingAccess = undefined; }
};

export const createDatabase = (env, access) => {
  const base = new URL(env.FIREBASE_DATABASE_URL);
  if (base.protocol !== "https:" || !/\.(firebaseio\.com|firebasedatabase\.app)$/.test(base.hostname) || base.pathname !== "/" || base.search || base.username || base.password) throw new Error("Invalid database URL");
  const request = async (path, options = {}) => {
    const url = new URL(`${path.split("/").map(encodeURIComponent).join("/")}.json`, base);
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${access}`);
    headers.set("Content-Type", "application/json");
    const response = await fetch(url, { ...options, headers, signal: AbortSignal.timeout(10000) });
    if (!response.ok && response.status !== 412) throw new Error(`Database failed: ${response.status}`);
    return response;
  };
  return {
    get: async (path) => (await request(path)).json(),
    put: async (path, value) => request(path, { method: "PUT", body: JSON.stringify(value) }),
    remove: async (path) => request(path, { method: "DELETE" }),
    claim: async (path) => {
      const response = await request(path, { headers: { "X-Firebase-ETag": "true" } });
      const existing = await response.json();
      if (existing?.status === "sent") return "sent";
      if (existing?.status === "pending" && existing.updatedAt > Date.now() - 60000) return "busy";
      const etag = response.headers.get("ETag");
      if (!etag) throw new Error("Database ETag missing");
      const claimed = await request(path, { method: "PUT", headers: { "If-Match": etag }, body: JSON.stringify({ status: "pending", updatedAt: Date.now() }) });
      return claimed.status === 412 ? "busy" : "claimed";
    },
  };
};

export const sendMessage = async (env, access, token, data) => {
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${encodeURIComponent(env.FIREBASE_PROJECT_ID)}/messages:send`, {
    method: "POST", headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json" },
    body: JSON.stringify({ message: { token, data, webpush: { headers: { TTL: "3600", Urgency: "normal" } } } }),
    signal: AbortSignal.timeout(10000),
  });
  if (response.ok) return "sent";
  const result = await response.json().catch(() => ({}));
  const invalid = result.error?.details?.some((detail) => detail["@type"] === "type.googleapis.com/google.firebase.fcm.v1.FcmError" && ["UNREGISTERED", "INVALID_ARGUMENT"].includes(detail.errorCode));
  if (invalid) return "invalid";
  throw new Error(`FCM failed: ${response.status}`);
};
