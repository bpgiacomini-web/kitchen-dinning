import {createHash} from 'node:crypto';
const DAY=86400000;
let ready;
export function areaIdentity(location,kind){
 const key=`20mi-v3-100:${kind}:${Math.floor(location.lat/.02)}:${Math.floor(location.lon/.02)}`;
 // Fixed slots bound storage even when many different areas are requested.
 return {key,slot:createHash('sha256').update(key).digest().readUInt16BE(0)%512};
}
async function database(){
 if(!process.env.DATABASE_URL)return null;
 const {neon}=await import('@neondatabase/serverless');const sql=neon(process.env.DATABASE_URL);
 if(!ready)ready=sql`CREATE TABLE IF NOT EXISTS metro_eats_nearby_cache (slot integer PRIMARY KEY, area_key text NOT NULL, places jsonb NOT NULL DEFAULT '[]', updated_at timestamptz, attempted_at timestamptz NOT NULL DEFAULT now(), used_at timestamptz NOT NULL DEFAULT now())`.catch(error=>{ready=null;throw error;});
 await ready;return sql;
}
export async function nearbyCache(location,kind){
 const identity=areaIdentity(location,kind);let sql;
 try{sql=await database();if(!sql)return null;
 await sql`DELETE FROM metro_eats_nearby_cache WHERE used_at < now()-interval '90 days'`;
 const rows=await sql`SELECT places,updated_at,attempted_at FROM metro_eats_nearby_cache WHERE slot=${identity.slot} AND area_key=${identity.key}`;
 const row=rows[0];
 if(row)await sql`UPDATE metro_eats_nearby_cache SET used_at=now() WHERE slot=${identity.slot} AND area_key=${identity.key}`;
 const age=row?.updated_at?Date.now()-Date.parse(row.updated_at):Infinity;
 const places=Array.isArray(row?.places)?row.places:[];
 const fresh=age<DAY,throttled=row && Date.now()-Date.parse(row.attempted_at)<900000;
 const claim=await sql`INSERT INTO metro_eats_nearby_cache AS c (slot,area_key,attempted_at) VALUES (${identity.slot},${identity.key},now()) ON CONFLICT (slot) DO UPDATE SET area_key=EXCLUDED.area_key,places=CASE WHEN c.area_key=EXCLUDED.area_key THEN c.places ELSE '[]'::jsonb END,updated_at=CASE WHEN c.area_key=EXCLUDED.area_key THEN c.updated_at ELSE NULL END,attempted_at=now(),used_at=now() WHERE c.area_key<>EXCLUDED.area_key OR c.attempted_at < now()-interval '15 minutes' RETURNING slot`;
 return {places,updatedAt:row?.updated_at,fresh,skipRefresh:fresh||throttled||!claim.length,async save(found){if(!found.length)return;const data=JSON.stringify(found.slice(0,100));if(data.length>64000)return;await sql`UPDATE metro_eats_nearby_cache SET places=${data}::jsonb,updated_at=now(),used_at=now() WHERE slot=${identity.slot} AND area_key=${identity.key}`;}};
 }catch{return null;}
}
