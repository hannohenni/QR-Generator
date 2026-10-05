const CACHE = 'qr-generator-v1';

const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './qrcode.min.js',
    './manifest.webmanifest',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png',
    './icons/apple-touch-icon.png'
];

// Installation: alle Dateien vorab in den Cache legen
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Aktivierung: alte Cache-Versionen löschen
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
            .then(() => self.clients.claim())
    );
});

// Abruf: sofort aus dem Cache antworten, im Hintergrund aktualisieren (stale-while-revalidate)
self.addEventListener('fetch', event => {
    const req = event.request;
    if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

    // Seitenaufrufe immer mit der App-Shell beantworten
    const key = req.mode === 'navigate' ? './index.html' : req;

    event.respondWith((async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(key, { ignoreSearch: true });

        const update = fetch(key, { cache: 'no-cache' })
            .then(res => {
                if (res.ok) cache.put(key, res.clone());
                return res;
            })
            .catch(() => null);

        if (cached) {
            event.waitUntil(update);
            return cached;
        }
        return (await update) || Response.error();
    })());
});
