const {createHash,randomUUID}=require('node:crypto');
const LIMIT_BYTES=900_000_000,MAX_PHOTO_BYTES=200_000,MONTH=30*24*60*60;
function ownerPrefix(userId){return 'journal-photos/'+createHash('sha256').update(userId).digest('hex')+'/';}
function validWebp(bytes){
 if(bytes.length<30 || bytes.toString('ascii',0,4)!=='RIFF' || bytes.toString('ascii',8,12)!=='WEBP')return false;
 // The client emits VP8 or VP8L WebP. Validate dimensions, not only the MIME label.
 const kind=bytes.toString('ascii',12,16);let width,height;
 if(kind==='VP8 ' && bytes[23]===0x9d && bytes[24]===1 && bytes[25]===0x2a){width=bytes.readUInt16LE(26)&0x3fff;height=bytes.readUInt16LE(28)&0x3fff;}
 else if(kind==='VP8L' && bytes[20]===0x2f){const bits=bytes.readUInt32LE(21);width=(bits&0x3fff)+1;height=((bits>>>14)&0x3fff)+1;}
 else if(kind==='VP8X'){width=1+bytes.readUIntLE(24,3);height=1+bytes.readUIntLE(27,3);if(bytes[20]&2)return false;}
 else return false;
 return width>0 && height>0 && width<=1200 && height<=1200;
}
async function handlePhotos(req,res,{userId,sql,limit,blob}) {
 const mode=req.query?.mode;
 const sdk=blob || await import('@vercel/blob');
 const quota=async(scope,count)=>{const result=await limit({scope,accountId:'metro-eats-photo-store',limit:count,windowSeconds:MONTH});if(!result.allowed){res.setHeader('Retry-After',String(result.retryAfterSeconds));res.status(429).json({error:'Free photo allowance reached. Try again after the allowance resets.'});return false;}return true;};
 const inventory=async()=>{const result=await sdk.list({limit:1000});if(result.hasMore)throw Error('Storage inventory is too large to verify safely.');return result.blobs.reduce((total,item)=>total+item.size,0);};
 if(mode==='photo-usage' && req.method==='GET'){
  if(!await quota('photo-inventory',200))return;
  const used=await inventory();return res.status(200).json({used,limit:LIMIT_BYTES,maxPhotoBytes:MAX_PHOTO_BYTES,warning:used>=LIMIT_BYTES*.8,uploadLimitPerMonth:200});
 }
 if(mode==='photo-read' && req.method==='GET'){
  const path=String(req.query.path||'');if(!path.startsWith(ownerPrefix(userId)) || !/^journal-photos\/[a-f0-9]{64}\/[a-f0-9-]+\.webp$/.test(path))return res.status(404).json({error:'Photo not found.'});
  if(!await quota('photo-reads',5000))return;
  const result=await sdk.get(path,{access:'private'});if(result?.statusCode!==200)return res.status(404).json({error:'Photo not found.'});
  const buffer=Buffer.from(await new Response(result.stream).arrayBuffer());if(buffer.length>MAX_PHOTO_BYTES)return res.status(413).json({error:'Photo too large.'});
  res.setHeader('Content-Type','image/webp');res.setHeader('Cache-Control','private, max-age=3600');return res.status(200).send(buffer);
 }
 if(mode==='photo-upload' && req.method==='POST'){
  const body=req.body||{},collection=body.collection,id=String(body.id||'');
  if(!['recipes','restaurants','pizzas','bars','drinks','cocktailRecipes'].includes(collection)||id.length>200)return res.status(400).json({error:'Choose a saved journal entry.'});
  const draft=body.draft===true && collection==='restaurants' && /^draft-[a-f0-9-]{36}$/.test(id);
  const rows=draft?[]:await sql`SELECT payload FROM metro_eats_user_datasets WHERE user_id = ${userId} LIMIT 1`;
  if(!draft && !rows[0]?.payload?.[collection]?.some(item=>String(item.id)===id))return res.status(404).json({error:'Save the entry before adding a photo.'});
  if(typeof body.image!=='string' || body.image.length>270000 || !/^[A-Za-z0-9+/]+={0,2}$/.test(body.image))return res.status(400).json({error:'Choose a valid optimized photograph.'});
  const bytes=Buffer.from(body.image,'base64');if(bytes.length>MAX_PHOTO_BYTES || !validWebp(bytes))return res.status(400).json({error:'Use a WebP photo up to 1,200 pixels and 200 KB.'});
  if(!await quota('photo-uploads',200))return;
  const used=await inventory();if(used+bytes.length>LIMIT_BYTES)return res.status(413).json({error:'Photo storage is full. Upload stopped to keep Metro Eats free.'});
  const path=ownerPrefix(userId)+randomUUID()+'.webp';
  const result=await sdk.put(path,bytes,{access:'private',contentType:'image/webp',addRandomSuffix:false});
  if(!result.url?.includes('.private.blob.vercel-storage.com/'))throw Error('Private storage required.');
  return res.status(200).json({photo:{path:result.pathname,bytes:bytes.length,width:body.width,height:body.height},used:used+bytes.length,limit:LIMIT_BYTES});
 }
 return res.status(405).json({error:'Unsupported photo action.'});
}
module.exports={handlePhotos,validWebp,ownerPrefix,LIMIT_BYTES};
