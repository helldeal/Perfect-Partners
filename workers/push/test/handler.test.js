import { test } from "node:test";
import assert from "node:assert/strict";
import { handleRequest } from "../src/index.js";
import { HttpError } from "../src/firebase.js";

const env = { ALLOWED_ORIGIN: "https://example.com", FIREBASE_PROJECT_ID: "project" };
const key = "a".repeat(64);
const notification = { actorId: "actor", actorName: "Alex", action: "added", category: "games", itemName: "Portal", createdAt: Date.now(), read: false };
const request = (body = { uid: "recipient", notificationId: "event" }, headers = {}) => new Request("https://worker.example/send", {
  method: "POST", headers: { Origin: env.ALLOWED_ORIGIN, Authorization: "Bearer token", "Content-Type": "application/json", ...headers }, body: JSON.stringify(body),
});
const setup = (overrides = {}) => {
  const records = {
    allowedUsers: { actor: true, recipient: true },
    "notifications/recipient/event": { ...notification, createdAt: Date.now() },
    "pushTokens/recipient": { [key]: { token: "server-token" } },
    ...overrides,
  };
  const sent = [];
  const removed = [];
  return {
    records, sent, removed,
    services: {
      verifyUser: async () => "actor",
      database: {
        get: async (path) => records[path] ?? null,
        put: async (path, value) => { records[path] = value; },
        remove: async (path) => { removed.push(path); delete records[path]; },
        claim: async (path) => {
          if (records[path]?.status === "sent") return "sent";
          if (records[path]?.status === "pending") return "busy";
          records[path] = { status: "pending" };
          return "claimed";
        },
      },
      send: async (token, data) => { sent.push({ token, data }); return "sent"; },
    },
  };
};

test("refuse une origine externe et une session absente", async () => {
  const { services } = setup();
  assert.equal((await handleRequest(request(undefined, { Origin: "https://other.example" }), env, services)).status, 403);
  assert.equal((await handleRequest(request(undefined, { Authorization: "" }), env, services)).status, 401);
});
test("autorise localhost uniquement lorsqu'il figure dans la liste et renvoie le bon CORS", async () => {
  const localEnv = { ...env, ALLOWED_ORIGINS: "https://example.com, http://localhost:5173" };
  const { services } = setup();
  const preflight = new Request("https://worker.example/send", { method: "OPTIONS", headers: { Origin: "http://localhost:5173" } });
  const response = await handleRequest(preflight, localEnv, services);
  assert.equal(response.status, 204);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "http://localhost:5173");
  assert.equal((await handleRequest(request(undefined, { Origin: "http://localhost:5173" }), localEnv, services)).status, 200);
  assert.equal((await handleRequest(request(undefined, { Origin: "http://localhost:5174" }), localEnv, services)).status, 403);
});
test("refuse un jeton invalide", async () => {
  const { services } = setup();
  services.verifyUser = async () => { throw new HttpError(401, "Invalid token"); };
  assert.equal((await handleRequest(request(), env, services)).status, 401);
});
test("refuse les chemins injectés et les comptes non autorisés", async () => {
  const { services, sent } = setup({ allowedUsers: { actor: true } });
  assert.equal((await handleRequest(request({ uid: "../recipient", notificationId: "event" }), env, services)).status, 400);
  assert.equal((await handleRequest(request(), env, services)).status, 403);
  assert.equal(sent.length, 0);
});
test("refuse l'usurpation de l'auteur et les notifications anciennes", async () => {
  const fake = setup({ "notifications/recipient/event": { ...notification, actorId: "someone-else" } });
  assert.equal((await handleRequest(request(), env, fake.services)).status, 403);
  const old = setup({ "notifications/recipient/event": { ...notification, createdAt: Date.now() - 700000 } });
  assert.equal((await handleRequest(request(), env, old.services)).status, 410);
});
test("utilise le texte et le jeton en base, jamais ceux fournis par le client", async () => {
  const state = setup();
  const response = await handleRequest(request({ uid: "recipient", notificationId: "event", token: "attacker-token", body: "Injected" }), env, state.services);
  assert.equal(response.status, 200);
  assert.equal(state.sent[0].token, "server-token");
  assert.equal(state.sent[0].data.body, "Alex a ajouté Portal");
});
test("ne renvoie pas une activité déjà livrée", async () => {
  const state = setup();
  await handleRequest(request(), env, state.services);
  const response = await handleRequest(request(), env, state.services);
  assert.equal((await response.json()).status, "already-sent");
  assert.equal(state.sent.length, 1);
});
test("supprime les jetons invalides", async () => {
  const state = setup();
  state.services.send = async () => "invalid";
  assert.equal((await handleRequest(request(), env, state.services)).status, 200);
  assert.ok(state.removed.includes(`pushTokens/recipient/${key}`));
});
test("ignore les notifications lues et celles de l'auteur", async () => {
  const read = setup({ "notifications/recipient/event": { ...notification, read: true } });
  assert.equal((await (await handleRequest(request(), env, read.services)).json()).status, "ignored");
  const own = setup({ "notifications/actor/event": { ...notification, createdAt: Date.now() } });
  assert.equal((await (await handleRequest(request({ uid: "actor", notificationId: "event" }), env, own.services)).json()).status, "ignored");
  assert.equal(own.sent.length, 0);
});
test("couvre les nouvelles saisons système", async () => {
  const state = setup({ "notifications/recipient/system-season": { ...notification, actorId: "system", actorName: "Perfect Partners", action: "new_season", createdAt: Date.now() } });
  assert.equal((await handleRequest(request({ uid: "recipient", notificationId: "system-season" }), env, state.services)).status, 200);
  assert.equal(state.sent.length, 1);
});
