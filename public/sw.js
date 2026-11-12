// SearchKraft CRM Service Worker v4
const CACHE = 'sk-crm-v4';
const FONTS_CACHE = 'sk-fonts-v1';

// Assets to precache on install
const PRECACHE = [
  '/',
  '/css/app.css'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== FONTS_CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Skip non-GET and cross-origin Supabase/API requests - always go network
  if (e.request.method !== 'GET') return;
  if (url.hostname.includes('supabase.co') || url.hostname.includes('supabase.io')) return;

  // Google Fonts - cache-first with long TTL
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.open(FONTS_CACHE).then(c =>
        c.match(e.request).then(cached => {
          if (cached) return cached;
          return fetch(e.request).then(res => {
            c.put(e.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // App shell (index.html + css) - network-first with cache fallback
  // This ensures fresh code always loads, with offline fallback
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(cached => cached || caches.match('/')))
  );
});
