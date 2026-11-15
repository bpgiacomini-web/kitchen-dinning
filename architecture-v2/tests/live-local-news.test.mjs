import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {parseLocalNews,readLiveLocalNews}=createRequire(import.meta.url)('../../api/_lib/live-local-news.cjs');
const item=(title,id='story')=>`<item><title>${title}</title><link>https://news.google.com/rss/articles/${id}</link><source url="https://www.stlmag.com">St. Louis Magazine</source><pubDate>Fri, 13 Nov 2026 13:00:00 GMT</pubDate></item>`;
test('local dinner coverage and openings mentioning another city are retained',()=>{
 const xml='<rss><channel>'+item('Where can a family go for holiday dinner in St. Louis?','dinner')+item('Coming soon to St. Louis: a Portland-based bar franchise','local')+item('Portland restaurants for your vacation','other')+'</channel></rss>';
 assert.deepEqual(parseLocalNews(xml).map(row=>row.url.split('/').pop()),['dinner','local']);
});
test('live reads use fixed feeds, deduplicate, and cache refresh work',async()=>{
 let calls=0;const fetcher=async url=>{assert.equal(new URL(url).hostname,'news.google.com');calls++;return {ok:true,text:async()=>'<rss><channel>'+item('Holiday dinner in St. Louis')+'</channel></rss>'};};
 const first=await readLiveLocalNews(fetcher),second=await readLiveLocalNews(fetcher);assert.equal(first.items.length,1);assert.equal(second.items.length,1);assert.equal(calls,3);
});
