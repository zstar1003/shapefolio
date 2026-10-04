import {mkdir, rm, cp, writeFile, readFile, readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {cases} from '../src/data.js';
import {screenshotById} from '../src/screenshots.js';

const publicEntries = ['index.html', 'favicon.svg', 'src', 'assets', 'ATTRIBUTION.md'];
const digest = createHash('sha256');
async function hashEntry(path) {
  let entries;
  try { entries = await readdir(path, {withFileTypes: true}); } catch (error) {
    if (error.code !== 'ENOTDIR') throw error;
    digest.update(path).update('\0').update(await readFile(path)).update('\0');
    return;
  }
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) await hashEntry(`${path}/${entry.name}`);
}
for (const entry of publicEntries) await hashEntry(entry);
const version = digest.digest('hex').slice(0, 16);
await rm('dist', {recursive: true, force: true});
await mkdir('dist', {recursive: true});
for (const entry of publicEntries) await cp(entry, `dist/${entry}`, {recursive: true});
const html = (await readFile('dist/index.html', 'utf8'))
  .replace('./src/styles.css"', `./src/styles.css?v=${version}"`)
  .replace('./src/app.js"', `./src/app.js?v=${version}"`)
  .replace('./favicon.svg"', `./favicon.svg?v=${version}"`);
const app = (await readFile('dist/src/app.js', 'utf8'))
  .replace("'./data.js'", `'./data.js?v=${version}'`)
  .replace("'./screenshots.js'", `'./screenshots.js?v=${version}'`);
const screenshots = (await readFile('dist/src/screenshots.js', 'utf8'))
  .replace(/(\.\/assets\/screenshots\/[a-z0-9_-]+\.(?:png|jpe?g|webp))(["'])/gi, `$1?v=${version}$2`);
await writeFile('dist/index.html', html);
await writeFile('dist/src/app.js', app);
await writeFile('dist/src/screenshots.js', screenshots);
await writeFile('dist/.nojekyll', '');
await writeFile('dist/build-info.json', JSON.stringify({version, records: cases.length, screenshots: Object.keys(screenshotById).length}) + '\n');
console.log(`Built static site → dist/ · version ${version} · ${Object.keys(screenshotById).length} screenshots`);
