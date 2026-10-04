import {mkdir,rm,cp,writeFile} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const file of ['index.html','favicon.svg','src','assets','ATTRIBUTION.md'])await cp(file,`dist/${file}`,{recursive:true});
await writeFile('dist/.nojekyll','');console.log('Built dependency-free static site → dist/');
