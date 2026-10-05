import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {cases} from '../src/data.js';
import {screenshotById} from '../src/screenshots.js';
import {taxonomy, classifyCase, filterByTaxonomy, categoryFromSearch} from '../src/taxonomy.js';
import {filterByLanguage,createFavoritesStore} from '../src/library-state.js';
const evidence=JSON.parse(await readFile('research/games-discovery.json','utf8'));
const byId=new Map(cases.map(c=>[c.id,c]));
const hash=b=>createHash('sha256').update(b).digest('hex');
test('games expansion preserves all existing entries, order, IDs and local favorites',()=>{
 const ids=evidence.originalCases.map(c=>c.id);
 assert.equal(ids.length,183);
 assert.deepEqual(cases.filter(c=>ids.includes(c.id)).map(c=>c.id),ids);
 for(const old of evidence.originalCases)assert.equal(hash(JSON.stringify(byId.get(old.id))),old.sha256,old.id);
 let raw='["linear","oil-home","unknown"]';
 const store=createFavoritesStore(()=>({getItem:()=>raw,setItem:(key,value)=>{raw=value;}}));
 assert.deepEqual(store.current().ids,['linear','oil-home','unknown']);
 const id=evidence.approved[0].case.id;store.toggle(id);
 assert.deepEqual(store.current().ids,['linear','oil-home','unknown',id]);
});
test('games have clear official versus browser links and all three coherent subcategories',()=>{
 const group=taxonomy.find(g=>g.id==='games');
 assert.equal(group.label,'游戏');
 assert.equal(group.children.length,3);
 const games=filterByTaxonomy(cases,categoryFromSearch('?category=games'));
 assert.equal(games.length,evidence.approvedCount);
 assert.ok(games.length>=12);
 assert.equal(filterByLanguage(games,'zh').length,evidence.approvedChineseCount);
 for(const child of group.children)assert.ok(filterByTaxonomy(games,child.id).length>0,child.id);
 for(const game of games){
  assert.ok(['official','browser'].includes(game.gameType));
  assert.equal(game.isConcept,false);
  assert.equal(game.sourceUrl,game.url);
  assert.equal(classifyCase(game).child,game.subcategory);
  assert.equal(game.subcategory==='games-browser',game.gameType==='browser');
  assert.equal(game.tags.length,3);assert.ok(game.note.length>=40);
 }
});
test('every published game image has reviewed local bytes and official source attribution',async()=>{
 const hashes=new Set();
 for(const r of evidence.approved){
  const {screenshot:s,case:c}=r;const b=await readFile(s.src);
  assert.equal(s.review,'approved');assert.equal(s.sourceUrl,c.url);
  assert.ok(s.width>=500&&s.height>=300);assert.equal(hash(b),s.sha256);assert.equal(b.length,s.bytes);
  assert.ok(!hashes.has(s.sha256));hashes.add(s.sha256);
  assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
  assert.deepEqual(screenshotById[c.id],Object.fromEntries(['src','retrievedAt','sourceUrl','captureProvider'].map(k=>[k,s[k]])));
  assert.ok(!Object.hasOwn(s,'capturedAt'));
 }
});
test('game links distinguish playable pages from official marketing pages in the interface',async()=>{
 const app=await readFile('src/app.js','utf8');
 for(const text of ['网页可玩','游戏官网','打开网页游戏','不代表可在网页直接游玩'])assert.ok(app.includes(text));
 for(const excluded of evidence.excluded){assert.ok(excluded.reason);assert.ok(!byId.has(excluded.id));}
});
