const CACHE='metro-eats-v31';
const APP=[
 './','./index.html','./app.js','./styles.css','./manifest.json',
 './news.json','./icon-180.png','./icon-512.png','./metro-eats-logo.png'
];

self.addEventListener('install',event=>{
 event.waitUntil(
  caches.open(CACHE)
   .then(c=>c.addAll(APP).catch(()=>{}))
   .then(()=>self.skipWaiting())
 );
});

self.addEventListener('activate',event=>{
 event.waitUntil(
  caches.keys()
   .then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
   .then(()=>self.clients.claim())
 );
});

self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET') return;
 const url=new URL(event.request.url);
 if(url.origin!==location.origin) return;

 event.respondWith(
  fetch(event.request,{cache:'no-store'})
   .then(response=>{
    if(response.ok){
     const copy=response.clone();
     caches.open(CACHE).then(c=>c.put(event.request,copy)).catch(()=>{});
    }
    return response;
   })
   .catch(()=>caches.match(event.request).then(cached=>cached||Response.error()))
 );
});