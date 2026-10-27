const CACHE_NAME = "amal-shell-v5";
const SHELL_FILES = ["./", "./index.html", "./main-style.css", "./login_Patient.html", "./doctor_login.html", "./login_style.css", "./Patient_booking_page.html", "./booking-style.css", "./doctor_dashboard.html", "./dashboard-style.css", "./amal-core.js", "./booking-store.js", "./amal-ui.js", "./amal-accessibility.css", "./manifest.json", "./icon.svg", "./index-page.js", "./index-i18n.js", "./pwa.js", "./patient-data.js", "./booking-page.js", "./booking-i18n.js", "./reminder-popups.js", "./emergency-contacts.js", "./doctor-dashboard.js", "./doctor-i18n.js", "./doctor-auth.js", "./doctor-login-i18n.js", "./patient-auth.js", "./patient-i18n.js"];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL_FILES))); self.skipWaiting(); });
self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith("amal-shell-") && key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  const relative = "./" + url.pathname.slice(new URL(self.registration.scope).pathname.length);
  if (!SHELL_FILES.includes(relative)) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) { const copy = response.clone(); event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy))); }
    return response;
  }).catch(async () => (await caches.match(event.request)) || (await caches.match(relative)) || Response.error()));
});
