import test from 'node:test';
import assert from 'node:assert/strict';
import {collapseInPlace} from '../src/features/compact-browse.mjs';
test('bottom collapse keeps the heading at the control position without smooth scrolling',()=>{
 const previous={document:globalThis.document,window:globalThis.window,requestAnimationFrame:globalThis.requestAnimationFrame};
 try{
  const frames=[],calls=[],style={overflowAnchor:'auto',scrollBehavior:'smooth'};
  globalThis.document={documentElement:{style}};
  globalThis.window={scrollY:2000,scrollTo(options){calls.push(options);this.scrollY=options.top;}};
  globalThis.requestAnimationFrame=fn=>frames.push(fn);
  let focused=false;
  const summary={focus(options){focused=options.preventScroll;},getBoundingClientRect:()=>({top:500-window.scrollY})};
  const panel={open:true,querySelector:()=>summary};
  collapseInPlace(panel,{getBoundingClientRect:()=>({top:400})});
  assert.equal(panel.open,false);assert.equal(focused,true);
  assert.equal(summary.getBoundingClientRect().top,400);
  frames.forEach(fn=>fn());
  assert.ok(calls.every(call=>call.behavior==='auto'));
  assert.equal(style.scrollBehavior,'smooth');assert.equal(style.overflowAnchor,'auto');
 }finally{Object.assign(globalThis,previous);}
});
