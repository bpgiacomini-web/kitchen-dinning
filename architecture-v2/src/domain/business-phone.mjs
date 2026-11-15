export function businessPhone(value){
 const label=String(value||'').trim().slice(0,80).split(';')[0].trim();
 if(!/^[+\d\s()./-]+$/.test(label))return null;
 const digits=label.replace(/\D/g,'');
 if(digits.length<7||digits.length>15)return null;
 return {label,href:'tel:'+(label.startsWith('+')?'+':'')+digits};
}
