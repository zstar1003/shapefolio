import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {cases} from '../src/data.js';
import {screenshotById} from '../src/screenshots.js';
import {classifyCase} from '../src/taxonomy.js';
const evidence=JSON.parse(await readFile('research/curated-directories.json','utf8'));
const byId=new Map(cases.map(c=>[c.id,c]));
const hash=b=>createHash('sha256').update(b).digest('hex');
test('sidebar curation preserves every previous record and its relative order',()=>{
 const ids=evidence.originalCases.map(c=>c.id);
 assert.equal(ids.length,158);
 assert.deepEqual(cases.filter(c=>ids.includes(c.id)).map(c=>c.id),ids);
 for(const old of evidence.originalCases)assert.equal(hash(JSON.stringify(byId.get(old.id))),old.sha256,old.id);
});
test('curated additions have independent source links, explicit two-level classifications and original notes',()=>{
 const additions=cases.filter(c=>c.id.startsWith('curated-'));
 assert.equal(additions.length,evidence.approvedCount);
 assert.ok(additions.length>=20);
 assert.equal(additions.filter(c=>/^zh-/.test(c.language)).length,evidence.approvedChineseCount);
 assert.deepEqual(new Set(additions.map(c=>c.id)),new Set(evidence.approved.map(c=>c.id)));
 assert.ok(new Set(additions.map(c=>c.sourceName)).size>=3);
 for(const item of additions){
  const proof=evidence.approved.find(c=>c.id===item.id);
  assert.equal(item.subcategory,classifyCase(item).child,item.id);
  assert.equal(proof.sourceUrl,item.sourceUrl);assert.equal(proof.url,item.url);
  assert.equal(proof.sourceCheck.status,200);assert.equal(proof.sourceCheck.url,item.sourceUrl);
  assert.equal(proof.targetCheck.url,item.url);assert.ok([200,403,406].includes(proof.targetCheck.status));
  if(proof.targetCheck.status!==200) assert.ok(proof.supplementalChecks.length>0);
  assert.ok(proof.targetCheck.checkedAt.startsWith(evidence.checkedAt));
  assert.equal(item.isConcept,false);assert.equal(item.tags.length,3);assert.ok(item.note.length>=40);
 }
});
test('curated screenshot files match reviewed bytes without duplicate padding',async()=>{
 const hashes=new Set();
 for(const c of evidence.approved){
  const s=c.screenshot,b=await readFile(s.src);
  assert.equal(s.review,'approved');assert.equal(s.sourceUrl,c.url);assert.ok(s.width>=500&&s.height>=300);
  assert.equal(s.sha256,hash(b));assert.equal(s.bytes,b.length);assert.ok(!hashes.has(s.sha256));hashes.add(s.sha256);
  assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
  assert.deepEqual(screenshotById[c.id],Object.fromEntries(['src','retrievedAt','sourceUrl','captureProvider'].map(k=>[k,s[k]])));
  assert.ok(!Object.hasOwn(s,'capturedAt'));
 }
});
test('rejected directory candidates stay excluded with recorded reasons',()=>{
 for(const c of evidence.excluded){assert.ok(c.reason);assert.ok(!byId.has(c.id));}
});
