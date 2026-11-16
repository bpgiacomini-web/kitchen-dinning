const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function websiteImageMarkup(restaurant){const image=restaurant.websiteImage;if(restaurant.hideWebsiteImage||!image?.url)return '<span class="restaurantImageFallback" aria-label="Restaurant">🍽</span>';try{const u=new URL(image.url);if(u.protocol!=='https:'||u.username||u.password)return '';const source=new URL(image.sourceUrl);if(!['https:','http:'].includes(source.protocol)||source.username||source.password)return '';const logo=image.imageType==='logo'||/logo/i.test(u.pathname);return '<figure class="restaurantWebsiteImage'+(logo?' restaurantWebsiteLogo':'')+'"><img src="'+esc(u.href)+'" alt="'+esc(restaurant.name)+' website image" loading="lazy" referrerpolicy="no-referrer"></figure>';}catch{return '';}}
export async function findRestaurantImage(website,{strict=false,fetcher=fetch,getToken=()=>globalThis.metroGetAccessToken?.()}={}){
 const token=await getToken();
 if(!token||!website){if(strict)throw Error(!website?'Add the restaurant website in Edit Restaurant Information first.':'Your sign-in needs to be refreshed. Sign out and back in, then try again.');return null;}
 const response=await fetcher('/api/restaurant-lookup',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:JSON.stringify({mode:'website-image',url:website})});
 if(!response.ok){if(strict)throw Error(response.status===401?'Your sign-in needs to be refreshed. Sign out and back in, then try again.':response.status===429?'The image lookup limit has been reached. Please try again later.':response.status===422?'The website could not provide a usable image this time. Please try again later or add your own photo.':'The image lookup did not finish. Please try again.');return null;}
 return (await response.json()).image||null;
}
export function mountWebsiteImageFallback(root){
root.querySelectorAll('.restaurantWebsiteImage img').forEach(image=>{
 const fallback=()=>{const figure=image.closest('figure');const status=root.querySelector('[data-website-image-status]');if(status)status.textContent='A website image was saved, but your browser could not load it. You can retry or add your own photo.';if(figure)figure.outerHTML='<span class="restaurantImageFallback" aria-label="Restaurant">🍽</span>';};
 if(image.complete&&!image.naturalWidth)fallback();else image.addEventListener('error',fallback,{once:true});
});}
