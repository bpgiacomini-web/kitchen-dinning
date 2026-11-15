import test from 'node:test';
import assert from 'node:assert/strict';
import {businessPhone} from '../src/domain/business-phone.mjs';
import {renderTonightPick,pickCandidates} from '../src/features/personal-home.mjs';
test('business phone links retain readable formatting and only dial a valid number',()=>{
 assert.deepEqual(businessPhone('+1 (618) 555-0123'),{label:'+1 (618) 555-0123',href:'tel:+16185550123'});
 for(const value of ['', '123', 'javascript:alert(1)', '<script>6185550123</script>'])assert.equal(businessPhone(value),null);
 const nearby=[{name:'Cafe',address:'123 Main',phone:'618-555-0123'}];
 const pick=pickCandidates({},'all',nearby)[0];const html=renderTonightPick({},'all',pick.id,nearby);
 assert.ok(html.includes('href="tel:6185550123"'));assert.ok(html.includes('Call Cafe'));
 const noPhone=[{name:'Cafe',address:'123 Main'}];assert.ok(!renderTonightPick({},'all',pick.id,noPhone).includes('tel:'));
});
