import test from 'node:test';
import assert from 'node:assert/strict';
import {authenticateAccount,verifyAccount,validateAccountInput,accountError} from '../src/features/account-onboarding.mjs';
const input={mode:'signup',email:'test@example.org',name:'Test Cook',password:'long test password',confirmation:'long test password',callbackURL:'https://example.org/architecture-v2/'};
const authenticated={data:{session:{token:'fixture-token'},user:{id:'fixture-user',email:input.email}}};

test('signup validates matching passwords before sending and forwards only provider fields',async()=>{
 let calls=0;
 const client={signUp:{email:async body=>{calls++;assert.deepEqual(body,{email:input.email,name:input.name,password:input.password,callbackURL:input.callbackURL});return {data:{user:{id:'u',emailVerified:true}}}}},getSession:async()=>authenticated};
 await assert.rejects(authenticateAccount(client,{...input,confirmation:'other'}),/do not match/);assert.equal(calls,0);
 const result=await authenticateAccount(client,input);assert.equal(result.kind,'authenticated');assert.equal(calls,1);
 for(const change of [{name:''},{password:'short',confirmation:'short'},{email:'invalid'},{password:'x'.repeat(129),confirmation:'x'.repeat(129)}])assert.throws(()=>validateAccountInput({...input,...change}));
});

test('signup user object alone never unlocks the app; verification is explicit',async()=>{
 const client={signUp:{email:async()=>({data:{user:{id:'u',emailVerified:false}}})},getSession:async()=>({data:null})};
 assert.equal((await authenticateAccount(client,input)).kind,'verify');
 client.signUp.email=async()=>({data:{user:{id:'u',emailVerified:true}}});
 assert.equal((await authenticateAccount(client,input)).kind,'signin');
 client.signUp.email=async()=>({data:{user:{id:'u',emailVerified:false}}});client.getSession=async()=>authenticated;
 assert.equal((await authenticateAccount(client,input)).kind,'authenticated','existing provider policy may allow an unverified email with a real session');
});

test('existing sign-in requires a server session; short existing passwords are not blocked locally',async()=>{
 const client={signIn:{email:async body=>{assert.equal(body.password,'old');return {data:{user:{id:'u'}}}}},getSession:async()=>({data:null})};
 await assert.rejects(authenticateAccount(client,{...input,mode:'signin',password:'old'}),/No verified session/);
 client.getSession=async()=>authenticated;assert.equal((await authenticateAccount(client,{...input,mode:'signin',password:'old'})).kind,'authenticated');
 client.signIn.email=async()=>({error:{code:'EMAIL_NOT_VERIFIED'}});assert.equal((await authenticateAccount(client,{...input,mode:'signin'})).kind,'verify');
});

test('verification validates codes, preserves provider error and requires a session for automatic sign-in',async()=>{
 let calls=0;
 const client={emailOtp:{verifyEmail:async body=>{calls++;assert.deepEqual(body,{email:input.email,otp:'123456'});return {data:{success:true}}}},getSession:async()=>({data:null})};
 await assert.rejects(verifyAccount(client,{email:input.email,code:'bad'}),/six-digit/);assert.equal(calls,0);
 assert.equal((await verifyAccount(client,{email:input.email,code:'123456'})).kind,'signin');
 client.getSession=async()=>authenticated;assert.equal((await verifyAccount(client,{email:input.email,code:'123456'})).kind,'authenticated');
 client.emailOtp.verifyEmail=async()=>({error:{code:'INVALID_OTP'}});await assert.rejects(verifyAccount(client,{email:input.email,code:'123456'}),e=>e.code==='INVALID_OTP');
});

test('error messages never echo provider text or credentials',()=>{
 assert.match(accountError({code:'RATE_LIMITED'}),/wait/);
 assert.match(accountError({code:'USER_ALREADY_EXISTS'},'signup'),/sign in instead/);
 assert.match(accountError({code:'OTP_EXPIRED'},'verify'),/expired/);
 assert.ok(!accountError({message:'private credential response'}).includes('private credential'));
});
