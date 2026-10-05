import test from 'node:test';
import assert from 'node:assert/strict';
import {cases} from '../src/data.js';
import {screenshotById} from '../src/screenshots.js';
import {taxonomy, subcategoryById, classifyCase, filterByTaxonomy, taxonomyCounts, taxonomyLabel} from '../src/taxonomy.js';

test('taxonomy contains unique subject-based stable parent and child IDs', () => {
 const ids=taxonomy.flatMap(group=>[group.id,...group.children.map(child=>child.id)]);
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(taxonomy.length,9);
 assert.ok(taxonomy.every(group=>group.children.length>=2));
 assert.ok(!taxonomy.some(group=>/Oil UI|twdc|ARTsOUT/i.test(group.label)));
});

test('every case belongs to exactly one matching parent and child, with explicit stable-ID mappings retained', () => {
 for(const item of cases) {
  const classified=classifyCase(item);
  const group=taxonomy.find(group=>group.id===classified.parent);
  assert.ok(group, item.id);
  assert.equal(group.label,item.category,item.id);
  assert.ok(group.children.some(child=>child.id===classified.child),item.id);
  if(subcategoryById[item.id]) assert.equal(classified.child,subcategoryById[item.id],item.id);
 }
});

test('parent counts equal their child counts, and gallery totals exclude missing captures', () => {
 const gallery=cases.filter(item=>screenshotById[item.id]?.src);
 for(const items of [cases,gallery,cases.filter(item=>['oil-voice','linear','oil-folio'].includes(item.id)),[]]) {
  const counts=taxonomyCounts(items);
  assert.equal(counts['全部'],items.length);
  assert.equal(taxonomy.reduce((total,group)=>total+counts[group.id],0),items.length);
  for(const group of taxonomy) {
   assert.equal(group.children.reduce((total,child)=>total+counts[child.id],0),counts[group.id]);
   assert.equal(filterByTaxonomy(items,group.id).length,counts[group.id]);
   assert.equal(filterByTaxonomy(items,group.label).length,counts[group.id]);
   for(const child of group.children) assert.equal(filterByTaxonomy(items,child.id).length,counts[child.id]);
  }
 }
});

test('new entries support explicit assignments and semantic fallbacks without depending on their source', () => {
 assert.deepEqual(classifyCase({id:'new',category:'品牌商业',tags:['咖啡'],sourceName:'Oil UI'}),{parent:'brand',child:'brand-food'});
 assert.deepEqual(classifyCase({id:'new',category:'个人网站',subcategory:'personal-maker',tags:[]}),{parent:'personal',child:'personal-maker'});
 assert.deepEqual(classifyCase({id:'new',category:'个人网站',subcategory:'brand-food',tags:['插画']}),{parent:'personal',child:'personal-portfolio'});
 assert.equal(taxonomyLabel('product-work'),'协作与知识');
 assert.deepEqual(filterByTaxonomy(cases,'nonexistent'),[]);
 assert.equal(filterByTaxonomy(cases,'全部'),cases);
});
