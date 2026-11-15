export function validateAccountInput({mode,email,password,name,confirmation}) {
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw Error('Enter a valid email address.');
 if(!password)throw Error('Enter your password.');
 if(mode==='signup'){
  if(!name||name.length>100)throw Error('Enter a name of up to 100 characters.');
  if(password.length<8||password.length>128)throw Error('Choose a password between 8 and 128 characters.');
  if(password!==confirmation)throw Error('The passwords do not match.');
 }
}

export function accountError(error,mode='signin') {
 const code=String(error?.code||'');
 if(code==='EMAIL_NOT_VERIFIED')return 'Verify your email before signing in.';
 if(/TOO_MANY|RATE_LIMIT/.test(code)||Number(error?.status)===429)return 'Too many attempts. Please wait before trying again.';
 if(/USER_ALREADY_EXISTS|EMAIL_ALREADY|INVALID_EMAIL_OR_PASSWORD|INVALID_CREDENTIALS/.test(code))return mode==='signup'?'Could not create this account. If you already have an account, sign in instead.':'Check your email and password and try again.';
 if(/INVALID_OTP|OTP_EXPIRED|INVALID_TOKEN/.test(code))return 'That code is invalid or expired. Check it or request a new email.';
 return mode==='signup'?'Could not create the account. Please try again or sign in if you already registered.':mode==='verify'?'Could not verify your email. Check the code or request a new email.':'Could not sign in. Please try again.';
}

async function checkedSession(client,result) {
 let verified;
 try{verified=await client.getSession();}catch{/* The auth operation may already include a server-issued session. */}
 const session=verified?.data?.session||(!verified?.error&&result?.data?.session);
 const user=verified?.data?.user||session?.user||result?.data?.user;
 // A signup response can contain a user without a session. Never unlock the
 // journal just because an account object exists.
 return session&&typeof user?.id==='string'&&user.id?{kind:'authenticated',session,user}:null;
}

export async function authenticateAccount(client,input) {
 validateAccountInput(input);
 const {mode,email,password,name,callbackURL}=input;
 const result=mode==='signup'?await client.signUp.email({email,password,name,callbackURL}):await client.signIn.email({email,password});
 if(result?.error){
  if(result.error.code==='EMAIL_NOT_VERIFIED')return {kind:'verify',email};
  throw result.error;
 }
 const authenticated=await checkedSession(client,result);
 if(authenticated)return authenticated;
 if(mode==='signup')return result?.data?.user?.emailVerified===false?{kind:'verify',email}:{kind:'signin',message:'Account created. Sign in to open your journal.'};
 throw Error('No verified session');
}

export async function verifyAccount(client,{email,code}) {
 if(!/^\d{6}$/.test(code))throw Error('Enter the six-digit code from your email.');
 const result=await client.emailOtp.verifyEmail({email,otp:code});
 if(result?.error)throw result.error;
 return await checkedSession(client,result)||{kind:'signin',message:'Email verified. Sign in to open your journal.'};
}

export function mountAccountOnboarding({document,client,onAuthenticated,onBusy=()=>{},onError=()=>{},callbackURL}) {
 const get=id=>document.getElementById(id);
 const form=get('metroAuthForm'),verifyForm=get('metroVerifyForm'),status=get('metroAuthStatus');
 const toggle=get('metroAuthToggle'),submit=get('metroAuthSubmit'),verifySubmit=get('metroVerifySubmit'),resend=get('metroVerifyResend');
 const password=get('metroAuthPassword'),confirmation=get('metroAuthConfirm'),email=get('metroAuthEmail'),name=get('metroAuthName'),code=get('metroVerifyCode');
 let mode='signin',busy=false,resendAfter=0;
 function setBusy(value){busy=value;onBusy(value);for(const button of [toggle,submit,verifySubmit,resend])button.disabled=value;}
 function setMode(next,message=''){
  mode=next;form.hidden=next==='verify';verifyForm.hidden=next!=='verify';
  get('metroAuthNameGroup').hidden=next!=='signup';get('metroAuthConfirmGroup').hidden=next!=='signup';
  name.required=next==='signup';confirmation.required=next==='signup';password.autocomplete=next==='signup'?'new-password':'current-password';
  password.minLength=next==='signup'?8:0;
  get('metroAuthDescription').textContent=next==='signup'?'Create your own private Metro Eats journal.':next==='verify'?'Check your inbox. Enter the code, or follow the verification link if your email contains one.':'Sign in to open your private journal.';
  get('metroVerifyEmail').textContent=email.value.trim();submit.textContent=next==='signup'?'Create account':'Sign in';
  toggle.textContent=next==='signin'?'Create account':'Back to sign in';password.value='';confirmation.value='';code.value='';status.textContent=message;
 }
 function accept(result){
  if(result.kind==='authenticated'){password.value='';confirmation.value='';code.value='';onAuthenticated(result);return;}
  if(result.kind==='verify'){setMode('verify','Check your email for verification instructions.');code.focus();}
  else{setMode('signin',result.message);password.focus();}
 }
 toggle.addEventListener('click',()=>{if(busy)return;setMode(mode==='signin'?'signup':'signin');(mode==='signup'?name:email).focus();});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  const input={mode,email:email.value.trim(),password:password.value,confirmation:confirmation.value,name:name.value.trim(),callbackURL};
  try{validateAccountInput(input);}catch(error){status.textContent=error.message;return;}
  setBusy(true);status.textContent=mode==='signup'?'Creating your account…':'Signing in…';
  try{accept(await authenticateAccount(client,input));}
  catch(error){onError();status.textContent=accountError(error,mode);}
  finally{password.value='';confirmation.value='';setBusy(false);}
 });
 verifyForm.addEventListener('submit',async event=>{
  event.preventDefault();if(busy)return;
  if(!/^\d{6}$/.test(code.value.trim())){status.textContent='Enter the six-digit code from your email.';return;}
  setBusy(true);status.textContent='Verifying your email…';
  try{accept(await verifyAccount(client,{email:email.value.trim(),code:code.value.trim()}));}
  catch(error){onError();status.textContent=accountError(error,'verify');}
  finally{code.value='';setBusy(false);}
 });
 resend.addEventListener('click',async()=>{
  if(busy)return;
  if(Date.now()<resendAfter){status.textContent='Please wait a minute before requesting another email.';return;}
  resendAfter=Date.now()+60000;setBusy(true);status.textContent='Requesting a verification email…';
  try{const result=await client.sendVerificationEmail({email:email.value.trim(),callbackURL});if(result?.error)throw result.error;status.textContent='Verification email requested. Check your inbox.';}
  catch(error){status.textContent=accountError(error,'verify');}
  finally{setBusy(false);}
 });
 setBusy(false);setMode('signin','Sign in or create an account to begin.');
 return {reset(){setMode('signin','You have signed out.');},getMode:()=>mode};
}
