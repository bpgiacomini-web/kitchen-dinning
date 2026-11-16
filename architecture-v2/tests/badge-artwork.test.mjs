import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {BADGES,badgeArtwork} from '../src/domain/badges.mjs';
import {updateAccountBadge} from '../src/features/badges.mjs';
import {restaurantFallbackMarkup} from '../src/features/restaurant-image.mjs';
test('badge art is local and distinct for all ten milestones',async()=>{
 const arts=await Promise.all(BADGES.map(b=>readFile(new URL('../'+badgeArtwork(b).slice(2),import.meta.url),'utf8')));
 assert.equal(new Set(arts).size,10);for(const art of arts){assert.match(art,/<svg/);assert.doesNotMatch(art,/<script|(?:href|src)=["']https?:|onload=/);}
});
test('account badge restores original person icon while signing out or changing accounts',()=>{
 const classes=new Set();const button={innerHTML:'<svg>person</svg>',classList:{toggle(name,on){on?classes.add(name):classes.delete(name)}}};
 updateAccountBadge(button,{achievements:{'restaurants-50':'2026-11-16'}});assert.match(button.innerHTML,/restaurants-50.svg/);
 updateAccountBadge(button,null);assert.equal(button.innerHTML,'<svg>person</svg>');assert.equal(classes.size,0);
 updateAccountBadge(button,{});assert.match(button.innerHTML,/welcome.svg/);assert.doesNotMatch(button.innerHTML,/restaurants-50/);
});
test('restaurant fallback uses the local branded mark',()=>{assert.match(restaurantFallbackMarkup(),/metro-eats-restaurant-mark.svg/);assert.doesNotMatch(restaurantFallbackMarkup(),/🍽|https?:/);});
