/* Metro Eats live news feed. Fail visibly rather than presenting stale sample headlines. */
(function(){
  function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function formatDate(value){var d=new Date(value);return Number.isNaN(d.getTime())?'':d.toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});}
  function render(items,grid){
    if(!items.length){grid.innerHTML='<article class="newsCard"><div class="newsSource">News feed</div><h4>Current stories are temporarily unavailable.</h4><p class="hint">Please try again shortly.</p><button class="btn" type="button" id="retryNews">Refresh stories</button></article>';var retry=document.getElementById('retryNews');if(retry)retry.addEventListener('click',load);return;}
    grid.innerHTML=items.map(function(item){var url=/^https?:\/\//i.test(item.url||'')?item.url:'#';return '<article class="newsCard"><div class="newsSource">'+esc(item.source)+'</div><h4><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(item.title)+'</a></h4>'+(item.description?'<p class="hint">'+esc(item.description)+'</p>':'')+'<a class="newsMore" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Read Full Story →</a><div class="newsDate">'+esc(formatDate(item.publishedAt))+'</div></article>';}).join('');
  }
  async function load(){
    var grid=document.getElementById('newsGrid'),updated=document.getElementById('newsUpdated');if(!grid)return;
    if(updated)updated.textContent='Refreshing…';
    try{
      var response=await fetch('/api/news',{headers:{'accept':'application/json'},cache:'no-store'});
      if(!response.ok)throw new Error('News request failed');
      var data=await response.json();render(Array.isArray(data.items)?data.items:[],grid);
      if(updated)updated.textContent=data.items&&data.items.length?'Updated '+new Date(data.updatedAt||Date.now()).toLocaleTimeString(undefined,{hour:'numeric',minute:'2-digit'}):'No current stories available';
    }catch(e){
      render([],grid);if(updated)updated.textContent='Unable to refresh';
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load);else load();
  window.metroEatsRefreshNews=load;
})();
