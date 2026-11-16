import {readFileSync} from 'node:fs';
import {validateCatalog,regionalDate} from '../architecture-v2/src/domain/daily-bite.mjs';
const catalog=JSON.parse(readFileSync(new URL('../architecture-v2/content/daily-bites.json',import.meta.url)));
const errors=validateCatalog(catalog);
// Free similarity screening assists editorial review; it is not semantic fact verification.
const tokens=entry=>new Set(`${entry.title} ${entry.summary} ${entry.body}`.toLowerCase().match(/[a-z]{4,}/g));
const warnings=[];
for(let i=0;i<catalog.entries.length;i++)for(let j=i+1;j<catalog.entries.length;j++){
  const a=catalog.entries[i],b=catalog.entries[j];if(a.regionId!==b.regionId)continue;
  const left=tokens(a),right=tokens(b),common=[...left].filter(word=>right.has(word)).length;
  if(common/(left.size+right.size-common)>.45)warnings.push(`Review similar content: ${a.id}, ${b.id}`);
}
for(const region of catalog.regions){
  const today=regionalDate(new Date(),region.timeZone);
  const reserve=catalog.entries.filter(entry=>entry.regionId===region.id&&entry.status==='approved'&&entry.publicationDate>today).length;
  console.log(`${region.id}: ${reserve} approved future bites${reserve<30?' — below 30-entry reserve; replenish before schedule runs out':''}`);
}
for(const warning of warnings)console.warn(warning);
for(const error of errors)console.error(error);
if(errors.length)process.exitCode=1;
else console.log(`${catalog.entries.length} sourced entries validated.`);
