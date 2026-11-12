// Share one permission request; retain precise coordinates only in this tab for 15 minutes.
export function createLocationService({geo=globalThis.navigator?.geolocation,storage,now=Date.now}={}){
 const key='metro-eats-location-v1',ttl=15*60*1000;let flight=null,memory=null;
 function read(){try{return memory||JSON.parse(storage?.getItem(key)||'null');}catch{return memory;}}
 function valid(value){return value && Number.isFinite(value.lat)&&Math.abs(value.lat)<=90&&Number.isFinite(value.lon)&&Math.abs(value.lon)<=180&&now()-value.time>=0&&now()-value.time<ttl;}
 return function position(success,failure,options={}){
  const saved=read();
  if(options.maximumAge!==0 && valid(saved)){queueMicrotask(()=>success({coords:{latitude:saved.lat,longitude:saved.lon},timestamp:saved.time}));return;}
  if(!geo){queueMicrotask(()=>failure?.({code:2,message:'Location unavailable.'}));return;}
  if(!flight)flight=new Promise((resolve,reject)=>geo.getCurrentPosition(resolve,reject,{enableHighAccuracy:true,timeout:12000,maximumAge:300000,...options})).then(result=>{
   const value={lat:result.coords.latitude,lon:result.coords.longitude,time:now()};memory=value;try{storage?.setItem(key,JSON.stringify(value));}catch{}return result;
  }).finally(()=>{flight=null;});
  flight.then(success,error=>failure?.(error));
 };
}
// Access to session storage can be blocked by browser privacy settings.
let tabStorage;try{tabStorage=globalThis.sessionStorage;}catch{}
export const sharedPosition=createLocationService({storage:tabStorage});
