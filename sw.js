const CACHE='metro-eats-v40';
const APP=['./','./index.html','./app.js','./store.js','./styles.css','./manifest.json','./news.json','./icon-180.png','./icon-512.png','./metro-eats-logo.png'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP).catch(()=>{})).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{if(event.request.method!=='GET')return;const u=new URL(event.request.url);if(u.origin!==location.origin)return;event.respondWith(fetch(event.request,{cache:'no-store'}).then(r=>{if(r.ok)caches.open(CACHE).then(c=>c.put(event.request,r.clone())).catch(()=>{});return r}).catch(()=>caches.match(event.request).then(c=>c||Response.error())))});
