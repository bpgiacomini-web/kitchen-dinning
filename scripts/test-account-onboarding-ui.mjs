import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from '../test-tools/node_modules/jsdom/lib/api.js';
import {mountAccountOnboarding} from '../architecture-v2/src/features/account-onboarding.mjs';
const html=await readFile(new URL('../architecture-v2/index.html',import.meta.url),'utf8');
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
const session={data:{session:{token:'local-fixture'},user:{id:'test-A',email:'test@example.org'}}};
function fixture(client){
 const dom=new JSDOM(html,{url:'https://preview.example.org/architecture-v2/',runScripts:'outside-only'}),document=dom.window.document;
 const authenticated=[];const controller=mountAccountOnboarding({document,client,onAuthenticated:result=>authenticated.push(result),callbackURL:'https://preview.example.org/architecture-v2/'});
 const get=id=>document.getElementById(id);
 const submit=id=>get(id).dispatchEvent(new dom.window.Event('submit',{bubbles:true,cancelable:true}));
 const fill=()=>{get('metroAuthEmail').value='test@example.org';get('metroAuthName').value='Test';get('metroAuthPassword').value='fixture password';get('metroAuthConfirm').value='fixture password';};
 return {dom,document,authenticated,controller,get,submit,fill};
}

test('signup DOM handles validation, duplicate submits, verification, resend throttling and secret clearing',async()=>{
 let signupCalls=0,resends=0,verifyCalls=0,complete;
 const client={signUp:{email:async()=>{signupCalls++;return await new Promise(resolve=>complete=resolve)}},getSession:async()=>({data:null}),
  emailOtp:{verifyEmail:async()=>{verifyCalls++;return {error:{code:'INVALID_OTP'}}}},sendVerificationEmail:async()=>{resends++;return {data:{success:true}}}};
 const f=fixture(client);try{
 f.get('metroAuthToggle').click();assert.equal(f.controller.getMode(),'signup');assert.equal(f.get('metroAuthName').required,true);assert.equal(f.get('metroAuthPassword').autocomplete,'new-password');
 f.fill();f.get('metroAuthConfirm').value='mismatch';f.submit('metroAuthForm');await tick();assert.equal(signupCalls,0);assert.match(f.get('metroAuthStatus').textContent,/do not match/);
 f.fill();f.submit('metroAuthForm');f.submit('metroAuthForm');await tick();assert.equal(signupCalls,1);assert.equal(f.get('metroAuthToggle').disabled,true);
 complete({data:{user:{id:'pending-user',emailVerified:false}}});await tick();await tick();
 assert.equal(f.authenticated.length,0);assert.equal(f.get('metroVerifyForm').hidden,false);assert.equal(f.get('metroAuthForm').hidden,true);assert.equal(f.get('metroAuthPassword').value,'');assert.equal(f.get('metroAuthConfirm').value,'');
 f.get('metroVerifyCode').value='bad';f.submit('metroVerifyForm');await tick();assert.equal(verifyCalls,0);
 f.get('metroVerifyCode').value='123456';f.submit('metroVerifyForm');await tick();assert.equal(verifyCalls,1);assert.match(f.get('metroAuthStatus').textContent,/invalid or expired/);assert.equal(f.get('metroVerifyCode').value,'');
 f.get('metroVerifyResend').click();await tick();f.get('metroVerifyResend').click();await tick();assert.equal(resends,1);
 client.emailOtp.verifyEmail=async()=>({data:{success:true}});client.getSession=async()=>session;
 f.get('metroVerifyCode').value='123456';f.submit('metroVerifyForm');await tick();assert.equal(f.authenticated.length,1);
 }finally{f.dom.window.close();}
});

test('sign-in errors stay on the form, restore controls and never display provider secrets',async()=>{
 const f=fixture({signIn:{email:async()=>({error:{message:'do-not-echo-password',code:'INVALID_EMAIL_OR_PASSWORD'}})},getSession:async()=>({data:null})});
 try{f.fill();f.submit('metroAuthForm');await tick();assert.equal(f.authenticated.length,0);assert.equal(f.get('metroAuthSubmit').disabled,false);assert.equal(f.get('metroAuthPassword').value,'');assert.match(f.get('metroAuthStatus').textContent,/Check your email and password/);assert.ok(!f.get('metroAuthStatus').textContent.includes('do-not-echo'));}finally{f.dom.window.close();}
});

test('real auth bootstrap ignores a late restore after signup starts and never unlocks from a user object alone',async()=>{
 const dom=new JSDOM(html,{url:'https://preview.example.org/architecture-v2/',runScripts:'outside-only'});
 const {window}=dom;let restore,signups=0,calls=0;
 window.fetch=async()=>({ok:true,json:async()=>({authUrl:window.location.origin})});
 window.__client={getSession:async()=>{calls++;return calls===1?await new Promise(resolve=>restore=resolve):session},signUp:{email:async()=>{signups++;return {data:{user:{id:'test-A',emailVerified:true}}}}}};
 window.__mount={mountAccountOnboarding};
 const inline=[...window.document.scripts].find(script=>script.textContent.includes('async function setupAuth')).textContent
  .replace("await import('https://esm.sh/@neondatabase/auth@0.7.0-beta')",'({createAuthClient:()=>window.__client})')
  .replace("await import('./src/features/account-onboarding.mjs?v=1')",'window.__mount');
 try{
 window.eval(inline);await tick();await tick();window.document.getElementById('metroAuthContinue').click();window.document.getElementById('metroAuthToggle').click();
 for(const [id,value] of [['metroAuthEmail','test@example.org'],['metroAuthName','Test'],['metroAuthPassword','fixture password'],['metroAuthConfirm','fixture password']])window.document.getElementById(id).value=value;
 window.document.getElementById('metroAuthForm').dispatchEvent(new window.Event('submit',{cancelable:true}));await tick();await tick();assert.equal(signups,1);assert.equal(window.document.body.classList.contains('metro-authenticated'),true);
 restore({data:null});await tick();assert.equal(window.document.body.classList.contains('metro-authenticated'),true);assert.equal(window.metroAccountId,'test-A');
 }finally{window.close();}
 const unverified=new JSDOM(html,{url:'https://preview.example.org/architecture-v2/',runScripts:'outside-only'});
 try{unverified.window.fetch=async()=>({ok:true,json:async()=>({authUrl:unverified.window.location.origin})});unverified.window.__client={getSession:async()=>({data:{user:{id:'user-only'}}})};unverified.window.__mount={mountAccountOnboarding};unverified.window.eval(inline);await tick();await tick();assert.equal(unverified.window.document.body.classList.contains('metro-authenticated'),false);}finally{unverified.window.close();}
});
