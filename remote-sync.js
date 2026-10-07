(function(){
  const KEY='metro_eats_v2';
  const originalSetItem=Storage.prototype.setItem;
  let ready=false;
  let syncing=false;
  let timer=null;

  function localData(){
    try{return JSON.parse(localStorage.getItem(KEY)||'{"recipes":[],"restaurants":[]}')}catch(e){return {recipes:[],restaurants:[]}}
  }
  function mergeRows(localRows,remoteRows){
    const map=new Map();
    (remoteRows||[]).forEach(r=>{if(r&&r.id)map.set(String(r.id),r)});
    (localRows||[]).forEach(r=>{if(r&&r.id&&!map.has(String(r.id)))map.set(String(r.id),r)});
    return Array.from(map.values());
  }
  function merged(local,remote){
    return {
      recipes:mergeRows(local.recipes,remote.recipes),
      restaurants:mergeRows(local.restaurants,remote.restaurants)
    };
  }
  async function push(){
    if(!ready||syncing)return;
    syncing=true;
    try{
      const data=localData();
      const response=await fetch('/api/data',{
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
      });
      if(!response.ok)throw new Error('Remote save failed: '+response.status);
    }catch(e){console.warn('Metro Eats remote sync failed',e)}
    finally{syncing=false}
  }
  Storage.prototype.setItem=function(key,value){
    originalSetItem.call(this,key,value);
    if(this===localStorage&&key===KEY&&ready){
      clearTimeout(timer);
      timer=setTimeout(push,600);
    }
  };

  async function hydrate(){
    try{
      const response=await fetch('/api/data',{cache:'no-store'});
      if(!response.ok)throw new Error('Remote load failed: '+response.status);
      const remote=await response.json();
      const local=localData();
      const combined=merged(local,remote);
      const localCount=(local.recipes?.length||0)+(local.restaurants?.length||0);
      const remoteCount=(remote.recipes?.length||0)+(remote.restaurants?.length||0);
      const combinedCount=combined.recipes.length+combined.restaurants.length;
      const changed=combinedCount!==localCount || JSON.stringify(combined)!==JSON.stringify(local);
      if(changed){
        ready=false;
        originalSetItem.call(localStorage,KEY,JSON.stringify(combined));
      }
      ready=true;
      if(localCount||remoteCount)await push();
    }catch(e){
      console.warn('Metro Eats remote data unavailable; local data remains available',e);
      ready=true;
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hydrate,{once:true});
  else hydrate();
})();