// Minimal service worker: activate new version quickly. No fetch handler —
// an empty fetch listener triggers Chrome’s “no-op fetch handler” warning.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
    