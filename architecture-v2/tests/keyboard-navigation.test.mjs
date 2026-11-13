import test from 'node:test';
import assert from 'node:assert/strict';
import {keyboardIsOpen,mountKeyboardNavigation} from '../src/features/keyboard-navigation.mjs';
const target=()=>({listeners:new Map(),addEventListener(name,fn){this.listeners.set(name,fn);},removeEventListener(name){this.listeners.delete(name);},fire(name){this.listeners.get(name)?.();}});
test('keyboard detection requires a focused editable field, mobile input and substantial viewport loss',()=>{
 const state={editing:true,mobile:true,baseline:800,layoutHeight:800,viewportHeight:470,scale:1};assert.equal(keyboardIsOpen(state),true);
 for(const change of [{editing:false},{mobile:false},{viewportHeight:740},{scale:2},{viewportHeight:800}])assert.equal(keyboardIsOpen({...state,...change}),false);
 assert.equal(keyboardIsOpen({...state,layoutHeight:470}),true,'resized Android layout uses saved baseline');
});
test('keyboard resize hides navigation and dismissal restores it even if input retains focus',()=>{
 const classes=new Set(),win=target(),viewport=Object.assign(target(),{height:800,scale:1});
 Object.assign(win,{innerHeight:800,innerWidth:390,visualViewport:viewport,navigator:{maxTouchPoints:5},matchMedia:()=>({matches:true})});
 const doc=Object.assign(target(),{activeElement:null,body:{classList:{toggle(name,on){on?classes.add(name):classes.delete(name);},remove(name){classes.delete(name);}}}});
 const cleanup=mountKeyboardNavigation({win,doc});
 try{
 doc.activeElement={matches:()=>true,disabled:false,readOnly:false};doc.fire('focusin');assert.equal(classes.has('metro-keyboard-open'),false,'focus with hardware keyboard does not hide navigation');
 viewport.height=460;viewport.fire('resize');assert.equal(classes.has('metro-keyboard-open'),true);
 viewport.height=800;viewport.fire('resize');assert.equal(classes.has('metro-keyboard-open'),false,'Done restores navigation while input retains focus');
 viewport.height=460;viewport.scale=2;viewport.fire('resize');assert.equal(classes.has('metro-keyboard-open'),false,'pinch zoom is not treated as keyboard');
 viewport.scale=1;viewport.fire('resize');assert.equal(classes.has('metro-keyboard-open'),true);
 doc.activeElement={matches:()=>false};doc.fire('focusout');assert.equal(classes.has('metro-keyboard-open'),false);
 }finally{cleanup();}
 assert.equal(classes.size,0);assert.equal(viewport.listeners.has('resize'),false);
});
