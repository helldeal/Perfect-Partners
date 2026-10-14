const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");

function worker(windows = []) {
  const events = {};
  const shown = [];
  const opened = [];
  let receive;
  const scope = "https://example.com/Perfect-Partners/";
  const context = {
    URL,
    importScripts() {},
    firebase: { initializeApp() {}, messaging: () => ({ onBackgroundMessage: (handler) => { receive = handler; } }) },
    self: {
      location: { origin: "https://example.com", href: `${scope}firebase-messaging-sw.js?config=%7B%7D` },
      registration: { scope, showNotification: async (title, options) => shown.push({ title, ...options }) },
      addEventListener: (name, handler) => { events[name] = handler; },
    },
    clients: { matchAll: async () => windows, openWindow: async (url) => { opened.push(url); return null; } },
  };
  vm.runInNewContext(readFileSync(require.resolve("../../../public/firebase-messaging-sw.js"), "utf8"), context);
  return { events, shown, opened, receive };
}

test("le push utilise une URL GitHub Pages et regroupe les doublons par identifiant", async () => {
  const sw = worker();
  await sw.receive({ data: { title: "Perfect Partners", body: "Nouveau jeu", category: "games", notificationId: "event" } });
  assert.equal(sw.shown[0].data.url, "https://example.com/Perfect-Partners/games");
  assert.equal(sw.shown[0].tag, "event");
  assert.equal(sw.shown[0].icon, "https://example.com/Perfect-Partners/push-icon.png");
});
test("un clic ouvre la rubrique et refuse une URL externe", async () => {
  const sw = worker();
  let completion;
  const click = (url) => sw.events.notificationclick({ stopImmediatePropagation() {}, notification: { close() {}, data: { url } }, waitUntil: (promise) => { completion = promise; } });
  click("https://example.com/Perfect-Partners/movies");
  await completion;
  assert.equal(sw.opened[0], "https://example.com/Perfect-Partners/movies");
  click("https://other.example/");
  assert.equal(sw.opened.length, 1);
});
test("remet l'onglet au premier plan avant de naviguer", async () => {
  const calls = [];
  const sw = worker([{ url: "https://example.com/Perfect-Partners/movies", focus: async () => calls.push("focus"), navigate: async () => calls.push("navigate") }]);
  let completion;
  sw.events.notificationclick({ stopImmediatePropagation() {}, notification: { close() {}, data: { url: "https://example.com/Perfect-Partners/games" } }, waitUntil: (promise) => { completion = promise; } });
  await completion;
  assert.deepEqual(calls, ["focus", "navigate"]);
  assert.equal(sw.opened.length, 0);
});
test("ouvre une fenêtre si le focus de l'onglet existant échoue", async () => {
  const sw = worker([{ url: "https://example.com/Perfect-Partners/movies", focus: async () => { throw new Error("Focus refused"); } }]);
  let completion;
  sw.events.notificationclick({ stopImmediatePropagation() {}, notification: { close() {}, data: { url: "https://example.com/Perfect-Partners/games" } }, waitUntil: (promise) => { completion = promise; } });
  await completion;
  assert.equal(sw.opened[0], "https://example.com/Perfect-Partners/games");
});
