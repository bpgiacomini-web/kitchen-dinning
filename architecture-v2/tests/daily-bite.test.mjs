import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {regionalDate,currentBite,publishedBites,millisecondsToNextDate,validateCatalog} from '../src/domain/daily-bite.mjs';
const catalog=JSON.parse(readFileSync(new URL('../content/daily-bites.json',import.meta.url)));
test('starter catalog is sourced and has one distinct approved bite per day',()=>{
  assert.deepEqual(validateCatalog(catalog),[]);
  assert.equal(catalog.entries.length,14);
});
test('Central date changes at local midnight in winter and summer',()=>{
  assert.equal(regionalDate(new Date('2026-11-17T05:59:59Z')),'2026-11-16');
  assert.equal(regionalDate(new Date('2026-11-17T06:00:00Z')),'2026-11-17');
  assert.equal(regionalDate(new Date('2026-07-17T04:59:59Z')),'2026-07-16');
  assert.equal(regionalDate(new Date('2026-07-17T05:00:00Z')),'2026-07-17');
});
test('date boundary accounts for 23-hour and 25-hour daylight saving days',()=>{
  assert.equal(millisecondsToNextDate(new Date('2026-03-08T06:00:00Z')),23*3600000);
  assert.equal(millisecondsToNextDate(new Date('2026-11-01T05:00:00Z')),25*3600000);
});
test('future and draft stories stay out of the archive, and reserve exhaustion keeps the real date',()=>{
  assert.equal(publishedBites(catalog,'greater-st-louis',new Date('2026-11-16T18:00:00Z')).length,1);
  assert.equal(currentBite(catalog,'greater-st-louis',new Date('2026-11-16T18:00:00Z')).isToday,true);
  const latest=currentBite(catalog,'greater-st-louis',new Date('2026-12-16T18:00:00Z'));
  assert.equal(latest.isToday,false);assert.equal(latest.entry.publicationDate,'2026-11-29');
  const copy=structuredClone(catalog);copy.entries[0].status='draft';
  assert.equal(currentBite(copy,'greater-st-louis',new Date('2026-11-16T18:00:00Z')),null);
  assert.equal(currentBite(catalog,'unknown'),null);
  assert.equal(currentBite(catalog,'greater-st-louis',new Date('2026-11-15T18:00:00Z')),null);
});
test('publication, fact and subject duplicates are rejected',()=>{
  const copy=structuredClone(catalog);copy.entries[1]={...copy.entries[0],id:'copy'};
  const errors=validateCatalog(copy).join(' ');
  assert.match(errors,/Duplicate publication/);assert.match(errors,/Duplicate fact/);assert.match(errors,/Subject within 90 days/);assert.match(errors,/Repeated content/);
});
