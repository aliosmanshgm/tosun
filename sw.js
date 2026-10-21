const CACHE='t10x-battery-v0.12.0-coverage';
const ASSETS=['./','./index.html','./app.css','./weather.js','./soc-model.js','./consumption-model.js','./soh-model.js','./range-model.js','./seasonal-range.js','./maintenance-model.js','./coverage-model.js','./app.js','./firebase-sync.js','./firebase-config.js','./manifest.webmanifest'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin)return; // Never cache Firebase/identity/weather endpoints.
  e.respondWith(fetch(e.request).then(r=>{if(!r.ok||r.type!=='basic')return r;const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return r;}).catch(()=>caches.match(e.request)));
});
