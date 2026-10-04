const CACHE='metro-eats-v3';
const APP=['./','./index.html','./manifest.json','./news.json','./icon-180.png','./icon-512.png','./metro-eats-logo.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP).catch(()=>{})).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;event.respondWith(caches.match(event.request).then(cached=>{const fresh=fetch(event.request).then(r=>{if(r.ok&&new URL(event.request.url).origin===location.origin){caches.open(CACHE).then(c=>c.put(event.request,r.clone()))}return r}).catch(()=>cached);return cached||fresh}))});
