import test from 'node:test';
import assert from 'node:assert/strict';
import {barVisitRatingStatus} from '../src/domain/cocktails.mjs';
test('four bar dimensions count as rated without a legacy overall score',()=>{
 const visit={atmosphere:10,drinkQuality:10,bartenders:10,restrooms:9,overallRating:null};
 assert.equal(barVisitRatingStatus(visit),'Rated');
 assert.equal(visit.overallRating,null);
 assert.equal(barVisitRatingStatus({atmosphere:8}),'1 of 4 rated');
 assert.equal(barVisitRatingStatus({overallRating:8}),'Rated');
 assert.equal(barVisitRatingStatus({}),'Unrated');
 assert.equal(barVisitRatingStatus({atmosphere:'',drinkQuality:99}),'Unrated');
});
