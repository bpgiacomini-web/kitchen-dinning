// Distinguish the keyboard from browser chrome changes and pinch zoom.
export function keyboardIsOpen({editing,mobile,baseline,layoutHeight,viewportHeight,scale=1}){
 return Boolean(editing&&mobile&&scale<=1.05&&Math.max(baseline,layoutHeight)-viewportHeight>120);
}

export function mountKeyboardNavigation({win=window,doc=document}={}){
 const viewport=win.visualViewport;
 let baseline=Math.max(win.innerHeight,viewport?.height||0),lastWidth=win.innerWidth,timer;
 const update=()=>{
  if(win.innerWidth!==lastWidth){baseline=Math.max(win.innerHeight,viewport?.height||0,baseline*lastWidth/win.innerWidth);lastWidth=win.innerWidth;}
  const field=doc.activeElement;
  const editing=Boolean(field?.matches('textarea,[contenteditable="true"],input:not([type=button]):not([type=submit]):not([type=reset]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]):not([type=color]):not([type=hidden])')&&!field.disabled&&!field.readOnly);
  if(!editing)baseline=Math.max(baseline,win.innerHeight,viewport?.height||0);
  const mobile=(win.matchMedia?.('(max-width:760px)')?.matches||win.innerWidth<=760)&&(win.matchMedia?.('(pointer:coarse)')?.matches||win.navigator.maxTouchPoints>0);
  doc.body.classList.toggle('metro-keyboard-open',keyboardIsOpen({editing,mobile,baseline,layoutHeight:win.innerHeight,viewportHeight:viewport?.height||win.innerHeight,scale:viewport?.scale||1}));
 };
 const focus=()=>{clearTimeout(timer);update();timer=setTimeout(update,50);};
 const rotate=()=>focus();
 doc.addEventListener('focusin',focus);doc.addEventListener('focusout',focus);
 viewport?.addEventListener('resize',update);win.addEventListener('resize',update);win.addEventListener('orientationchange',rotate);
 update();
 return()=>{clearTimeout(timer);doc.removeEventListener('focusin',focus);doc.removeEventListener('focusout',focus);viewport?.removeEventListener('resize',update);win.removeEventListener('resize',update);win.removeEventListener('orientationchange',rotate);doc.body.classList.remove('metro-keyboard-open');};
}
