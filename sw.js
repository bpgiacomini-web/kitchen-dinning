const CACHE='metro-eats-v33';
const APP=['./','./index.html','./app.js','./styles.css','./manifest.json','./news.json','./icon-180.png','./icon-512.png','./metro-eats-logo.png'];
const SHELL=new Set(['/','/index.html','/app.js','/styles.css']);
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(APP).catch(()=>{})).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const u=new URL(event.request.url);
 if(u.origin!==location.origin)return;
 if(SHELL.has(u.pathname)){
   event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{
     if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone())).catch(()=>{});
     return response;
   }).catch(()=>caches.match(event.request).then(cached=>cached||Response.error())));
   return;
 }
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
   if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone())).catch(()=>{});
   return response;
 })));
});
