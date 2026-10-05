import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {cases} from '../src/data.js';
import {screenshotById} from '../src/screenshots.js';
import {classifyCase,taxonomy,categoryFromSearch} from '../src/taxonomy.js';
import {createFavoritesStore,filterByLanguage} from '../src/library-state.js';
const evidence=JSON.parse(await readFile('research/distinctive-expansion.json','utf8'));
const byId=new Map(cases.map(c=>[c.id,c]));
const hash=b=>createHash('sha256').update(b).digest('hex');
test('creative expansion preserves all 203 original records, order, and saved IDs',()=>{
 const ids=evidence.originalCases.map(c=>c.id);
 assert.equal(ids.length,203);
 assert.deepEqual(cases.filter(c=>ids.includes(c.id)).map(c=>c.id),ids);
 for(const old of evidence.originalCases)assert.equal(hash(JSON.stringify(byId.get(old.id))),old.sha256,old.id);
 let raw='["linear","oil-home","games-cocoon","unknown"]';
 const store=createFavoritesStore(()=>({getItem:()=>raw,setItem:(k,v)=>{raw=v;}}));
 const id=evidence.approved[0].case.id;store.toggle(id);
 assert.deepEqual(store.current().ids,['linear','oil-home','games-cocoon','unknown',id]);
});
test('creative expansion reports additional visible cases separately from the baseline',()=>{
 assert.equal(evidence.baselineVisible,194);
 assert.equal(evidence.targetAdditional,300);
 assert.equal(evidence.approved.length,evidence.approvedCount);
 assert.ok(evidence.approvedCount>=300);
 assert.equal(cases.filter(c=>!c.id.startsWith('threeui-')).length,203+evidence.approvedCount);
 assert.equal(Object.keys(screenshotById).filter(id=>!id.startsWith('threeui-')).length,194+evidence.approvedCount);
 assert.equal(filterByLanguage(evidence.approved.map(r=>r.case),'zh').length,evidence.approvedChineseCount);
 const hosts=new Set();
 for(const r of evidence.approved){
  const c=r.case;assert.deepEqual(byId.get(c.id),c);
  assert.equal(classifyCase(c).child,c.subcategory,c.id);
  assert.equal(c.tags.length,3);assert.ok(c.note.length>=40,c.id);
  assert.ok(c.sourceName&&c.sourceUrl.startsWith('https://'),c.id);
  assert.equal(new URL(c.url).protocol,'https:');
  const host=r.canonicalHost||new URL(c.url).hostname.replace(/^www\./,'');
  assert.ok(!hosts.has(host),`Duplicate canonical host ${host}`);hosts.add(host);
  assert.ok(r.targetCheck&&r.sourceVerification&&r.interactionEvidence&&r.rights,c.id);
  for(const key of ['url','sourceUrl','directoryUrl'])if(r.sourceVerification[key])assert.equal(new URL(r.sourceVerification[key]).protocol,'https:',`${c.id} ${key}`);
  if(c.category==='游戏')assert.ok(['browser','official'].includes(c.gameType),c.id);
 }
});
test('all new creative screenshots match individually reviewed optimized local files',async()=>{
 const hashes=new Set();
 for(const r of evidence.approved){
  const c=r.case,s=r.screenshot,b=await readFile(s.src);
  assert.equal(s.review,'approved');assert.equal(s.sourceUrl,c.url);
  assert.ok(s.width>=500&&s.height>=300,c.id);assert.equal(hash(b),s.sha256);assert.equal(b.length,s.bytes);
  assert.ok(b.length<700000,c.id);assert.ok(!hashes.has(s.sha256));hashes.add(s.sha256);
  assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
  assert.deepEqual(screenshotById[c.id],Object.fromEntries(['src','retrievedAt','sourceUrl','captureProvider'].map(k=>[k,s[k]])));
  assert.ok(!Object.hasOwn(s,'capturedAt'));
 }
});
test('creative subcategories stay inside the compact subject taxonomy and support deep links',()=>{
 assert.equal(taxonomy.length,10);
 for(const id of ['creative-interactive','brand-experience'])assert.equal(categoryFromSearch(`?category=${id}`),id);
 assert.equal(taxonomy.find(g=>g.id==='creative').children.find(c=>c.id==='creative-interactive').label,'互动与实验');
 assert.equal(taxonomy.find(g=>g.id==='brand').children.find(c=>c.id==='brand-experience').label,'品牌互动体验');
});

test('detail previews preserve complete screenshot frames without changing gallery crops',async()=>{
 const css=await readFile('src/styles.css','utf8');
 assert.ok(css.includes('.detail-image{aspect-ratio:auto}'));
 assert.ok(css.includes('.detail-image .screenshot{height:auto;object-fit:contain}'));
 assert.ok(css.indexOf('.detail-image{aspect-ratio:auto}')>css.indexOf('@media(max-width:650px)'));
 assert.match(css,/\.screenshot-link\{[^}]*aspect-ratio:1\.6/);
});

test('verified bilingual and Traditional Chinese pages are included in the Chinese filter',async()=>{
 const fixes=JSON.parse(await readFile('research/distinctive-language-review.json','utf8')).fixes;
 assert.equal(fixes.length,5);
 for(const fix of fixes){
  assert.equal(byId.get(fix.id).language,fix.to,fix.id);
  assert.equal(filterByLanguage([byId.get(fix.id)],'zh').length,1,fix.id);
  assert.ok(fix.evidence.length>30);assert.equal(new URL(fix.url).protocol,'https:');
 }
});


test('independent tributes preserve real-project status and explicit creator attribution',async()=>{
 for(const id of ['narrative-amy-winehouse','narrative-opl-jrr-tolkien-the-life-story']){
 const c=byId.get(id);assert.equal(c.isUnofficial,true);assert.equal(c.isConcept,false);assert.ok(c.creatorName);assert.ok(c.creatorSourceUrl.startsWith('https://'));
 }
 const app=await readFile('src/app.js','utf8');assert.ok(app.includes('c.isUnofficial'));assert.ok(app.includes('c.creatorName'));assert.ok(app.includes('c.isConcept ? "案例" : "网站"'));
});
