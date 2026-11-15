/** Browser Back/Forward for app views; stores interface state, never journal records. */
export function mountViewHistory({root,enabled,capture,restore,key,account=()=>null}){
 const history=window.history;
 let ready=false,restoring=false,pending=false,timer,entry=0,currentEntry;
 const recent=new Map();
 const remember=(id,snapshot)=>{recent.set(id,snapshot);if(recent.size>64)recent.delete(recent.keys().next().value);};
 const read=()=>history.state?.metroViewHistory;
 const write=(replace,snapshot)=>{
  const id=replace?(read()?.entry||++entry):++entry;entry=Math.max(entry,id);currentEntry=id;remember(id,snapshot);
  const state={...(history.state||{}),metroViewHistory:{version:1,account:account(),entry:id,snapshot}};
  history[replace?'replaceState':'pushState'](state,'');
 };
 const sync=()=>{if(!enabled()||restoring||pending)return;write(true,capture());ready=true;};
 const schedule=()=>{clearTimeout(timer);timer=setTimeout(sync,350);};
 const navigate=event=>{
  if(!enabled()||restoring)return;
  const button=event.target.closest('[data-view],[data-action],[data-cocktail-tab],[data-cocktail-action]');
  const action=button?.dataset.action,kind=button?.dataset.cocktailAction;
  const navigation=button&&(button.dataset.view||button.dataset.cocktailTab||['open-rankings','open-journal-item','open-picked-restaurant','new-restaurant','edit-restaurant','use-nearby','select-restaurant-lookup','add-restaurant-review','edit-restaurant-review','new-pizza','edit-pizza','open-recipe-edit'].includes(action)||['new','edit','visit','edit-visit','choose-bar','view-saved-recipe','edit-linked-drink'].includes(kind));
  if(!navigation){schedule();return;}
  clearTimeout(timer);sync();const before=key();pending=true;
  setTimeout(()=>{
   pending=false;if(!enabled()||restoring)return;
   if(key()!==before||['open-journal-item','open-picked-restaurant','view-saved-recipe'].includes(action||kind))write(false,capture());
   else sync();
  },0);
 };
 const pop=event=>{
  const saved=event.state?.metroViewHistory;
  if(!enabled()||saved?.version!==1||saved.account!==account()||!saved.snapshot)return;
  if(currentEntry!=null)remember(currentEntry,capture());
  currentEntry=saved.entry;entry=Math.max(entry,Number(saved.entry)||0);
  clearTimeout(timer);pending=false;restoring=true;
  try{restore(recent.get(saved.entry)||saved.snapshot);ready=true;}finally{restoring=false;}
 };
 document.addEventListener('click',navigate,true);
 root.addEventListener('input',schedule);root.addEventListener('change',schedule);root.addEventListener('toggle',schedule,true);
 window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('popstate',pop);
 const previousScrollRestoration=history.scrollRestoration;history.scrollRestoration='manual';
 return {
  resume(){if(ready||!enabled())return;const saved=read();if(saved?.version===1&&saved.account===account())pop({state:history.state});else sync();},
  destroy(){clearTimeout(timer);document.removeEventListener('click',navigate,true);root.removeEventListener('input',schedule);root.removeEventListener('change',schedule);root.removeEventListener('toggle',schedule,true);window.removeEventListener('scroll',schedule);window.removeEventListener('popstate',pop);history.scrollRestoration=previousScrollRestoration;}
 };
}
