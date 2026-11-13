import test from 'node:test';
import assert from 'node:assert/strict';
import {mountViewHistory} from '../src/features/view-history.mjs';
const target=()=>({listeners:new Map(),addEventListener(name,fn){this.listeners.set(name,fn);},removeEventListener(name){this.listeners.delete(name);},fire(name,event={}){this.listeners.get(name)?.(event);}});
const tick=()=>new Promise(resolve=>setTimeout(resolve,10));
test('browser navigation snapshots and restores views without treating ordinary controls as routes',async()=>{
 const previousWindow=globalThis.window,previousDocument=globalThis.document;
 const doc=target(),win=target(),root=target();let current={view:'home',scroll:250,open:new Set(['recent'])},allowed=true,index=-1;const entries=[];
 win.history={scrollRestoration:'auto',get state(){return entries[index];},replaceState(state){if(index<0)index=0;entries[index]=structuredClone(state);},pushState(state){entries.splice(index+1);entries.push(structuredClone(state));index++;}};
 globalThis.window=win;globalThis.document=doc;
 const control=mountViewHistory({root,enabled:()=>allowed,capture:()=>structuredClone(current),restore:snapshot=>{current=structuredClone(snapshot);},key:()=>current.view});
 try{
 control.resume();assert.equal(entries.length,1);assert.equal(win.history.scrollRestoration,'manual');
 const click=dataset=>doc.fire('click',{target:{closest:()=>({dataset})}});
 click({view:'dining'});current={view:'dining',scroll:0,open:new Set()};await tick();assert.equal(entries.length,2);
 current.scroll=640;current.open.add('filters');click({action:'open-rankings'});current={view:'rankings',scroll:0,open:new Set()};await tick();assert.equal(entries.length,3);
 current.scroll=713;index--;win.fire('popstate',{state:entries[index]});assert.equal(current.view,'dining');assert.equal(current.scroll,640);assert.ok(current.open.has('filters'));
 index++;win.fire('popstate',{state:entries[index]});assert.equal(current.view,'rankings');assert.equal(current.scroll,713,'Forward remembers latest position even before throttled replace');
 click({action:'toggle-pizza-favorite'});await tick();assert.equal(entries.length,3,'non-navigation action adds no history');
 allowed=false;click({view:'home'});await tick();assert.equal(entries.length,3,'signed-out UI cannot restore private view state');
 }finally{control.destroy();globalThis.window=previousWindow;globalThis.document=previousDocument;}
 assert.equal(win.history.scrollRestoration,'auto');
});
