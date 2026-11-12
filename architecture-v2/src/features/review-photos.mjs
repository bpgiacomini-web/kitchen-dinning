import {optimizePhoto} from './journal-photos.mjs';
const base64=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob);});
export function mountReviewPhotos({container,restaurantId,initial=[]}) {
 let refs=[...initial],busy=false;const draftId='draft-'+crypto.randomUUID();
 container.innerHTML='<button class="btn" type="button" data-add-review-photos aria-expanded="false">Add Photos</button><div class="reviewPhotoChoices" hidden><button class="btn" type="button" data-review-upload>Upload Photo</button><button class="btn" type="button" data-review-camera>Take Photo</button></div><input data-review-photo-file type="file" accept="image/*" multiple hidden><input data-review-photo-camera type="file" accept="image/*" capture="environment" hidden><div class="reviewPhotoDrafts"></div><p class="hint" role="status" aria-live="polite"></p>';
 const feedback=container.querySelector('[role="status"]');
 function renderRefs(){const list=container.querySelector('.reviewPhotoDrafts');list.replaceChildren();refs.forEach((ref,index)=>{const row=document.createElement('div');row.className='reviewPhotoDraft';row.innerHTML='<span>Photo '+(index+1)+' ready</span><button class="btn" type="button" aria-label="Remove photo '+(index+1)+'">Remove</button>';row.querySelector('button').onclick=()=>{refs.splice(index,1);renderRefs();};list.append(row);});}
 renderRefs();
 container.querySelector('[data-add-review-photos]').onclick=()=>{const choices=container.querySelector('.reviewPhotoChoices');choices.hidden=!choices.hidden;container.querySelector("[data-add-review-photos]").setAttribute("aria-expanded",String(!choices.hidden));};
 for(const [button,input] of [['[data-review-upload]','[data-review-photo-file]'],['[data-review-camera]','[data-review-photo-camera]']]){
  container.querySelector(button).onclick=()=>container.querySelector(input).click();
  container.querySelector(input).onchange=async event=>{
   const files=Array.from(event.target.files||[]);if(!files.length)return;if(files.length+refs.length>4){feedback.textContent='Choose up to '+(4-refs.length)+' photos.';return;}
   busy=true;feedback.textContent='Preparing photo…';container.querySelectorAll('.reviewPhotoChoices button').forEach(button=>button.disabled=true);
   try{for(const file of files){const optimized=await optimizePhoto(file);if(!container.isConnected)return;const token=await globalThis.metroGetAccessToken?.();if(!token)throw Error('Sign in again to add a photo.');const response=await fetch('/api/user-data?mode=photo-upload',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({collection:'restaurants',id:restaurantId||draftId,draft:!restaurantId,image:await base64(optimized.blob),width:optimized.width,height:optimized.height})});const payload=await response.json();if(!response.ok)throw Error(payload.error||'Photo upload failed.');if(!container.isConnected)return;refs.push(payload.photo);renderRefs();feedback.textContent='Photos ready. Save your review to keep them.';}}
   catch(error){if(container.isConnected)feedback.textContent=error.message;}
   finally{busy=false;if(container.isConnected)container.querySelectorAll('.reviewPhotoChoices button').forEach(button=>button.disabled=false);}
  };
 }
 return {getRefs:()=>[...refs],isBusy:()=>busy};
}
