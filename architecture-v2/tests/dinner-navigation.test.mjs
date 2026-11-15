import test from 'node:test';
import assert from 'node:assert/strict';
import {pickCandidates,renderTonightPick} from '../src/features/personal-home.mjs';
test('dinner selections only use nearby places and offer address navigation',()=>{
 const data={restaurants:[{id:'reviewed',name:'Reviewed Cafe',rating:8,address:'123 Main St'},{id:'wanted',name:'Next Cafe',wantToTry:true,address:'456 Main St'}]};
 const nearby=[{name:'Nearby Cafe',address:'789 Main St',lat:38.9,lon:-90.2,distance:1000},{name:'Too Far',address:'Other city',distance:90000}];
 assert.equal(pickCandidates(data,'all',nearby).length,1);
 assert.equal(pickCandidates(data,'all',[]).length,0);
 for(const pick of pickCandidates(data,'all',nearby)){
  const html=renderTonightPick(data,'all',pick.id,nearby);
  for(const app of ['Apple Maps','Google Maps','Waze'])assert.ok(html.includes(app));
  const destination=pick.lat!=null?'38.9%2C-90.2':encodeURIComponent([pick.name,pick.address].join(', ')).replace(/%20/g,'+');
  assert.ok(html.includes('destination='+destination));
  assert.ok(html.includes('Choose a map app for '+pick.name));
  assert.ok(html.includes('More info'));assert.ok(html.includes(pick.address));assert.ok(!html.includes('Around Me'));
 }
 const empty=renderTonightPick(data);
 assert.ok(!empty.includes('pickNavigationOptions'));
});
