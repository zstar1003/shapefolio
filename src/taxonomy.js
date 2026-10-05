// Editorial subject taxonomy. IDs are independent of source and saved-case IDs.
export const taxonomy = [
  {id:'product',label:'产品设计',children:[{id:'product-work',label:'协作与知识'},{id:'product-life',label:'生活与社交'},{id:'product-platform',label:'平台与服务'}]},
  {id:'creative',label:'创意设计',children:[{id:'creative-tools',label:'设计与创作工具'},{id:'creative-system',label:'组件与设计系统'},{id:'creative-learning',label:'灵感与设计教育'},{id:'creative-interactive',label:'互动与实验'}]},
  {id:'games',label:'游戏',children:[{id:'games-official',label:'游戏官方网站'},{id:'games-indie',label:'独立游戏'},{id:'games-browser',label:'网页小游戏'}]},
  {id:'brand',label:'品牌商业',children:[{id:'brand-lifestyle',label:'生活方式与零售'},{id:'brand-food',label:'餐饮与食品'},{id:'brand-travel',label:'旅行与空间'},{id:'brand-enterprise',label:'企业与制造'},{id:'brand-experience',label:'品牌互动体验'}]},
  {id:'culture',label:'文化艺术',children:[{id:'culture-arts',label:'艺术场馆与展演'},{id:'culture-community',label:'社会与地方文化'},{id:'culture-publishing',label:'出版与文化内容'}]},
  {id:'productivity',label:'效率工具',children:[{id:'productivity-notes',label:'笔记与知识管理'},{id:'productivity-team',label:'任务与团队协作'},{id:'productivity-utilities',label:'日常与专业工具'}]},
  {id:'studio',label:'设计工作室',children:[{id:'studio-brand',label:'品牌与视觉'},{id:'studio-digital',label:'数字与交互'},{id:'studio-space',label:'空间与影像'}]},
  {id:'media',label:'内容媒体',children:[{id:'media-editorial',label:'杂志与编辑'},{id:'media-reading',label:'阅读与知识'},{id:'media-audio',label:'音乐与播客'}]},
  {id:'personal',label:'个人网站',children:[{id:'personal-portfolio',label:'作品集'},{id:'personal-blog',label:'博客与生活'},{id:'personal-maker',label:'开发者与独立创作'}]},
  {id:'developer',label:'开发工具',children:[{id:'developer-platform',label:'云平台与基础服务'},{id:'developer-code',label:'编程与开源'},{id:'developer-workflow',label:'开发协作与 AI'}]},
];
const assignments = {
 'product-work':'linear zh-flomo zh-cubox zh-flowus zh-yuque zh-feishu-docs zh-wolai zh-mubu',
 'product-life':'oil-home oil-lingo oil-ride oil-pulse oil-weather oil-trail oil-brew oil-letter oil-club',
 'product-platform':'stripe arc firefox 1password add-kdan add-simpany oil-voice oil-freight oil-upload',
 'creative-tools':'figma canva framer webflow spline pitch zh-jsdesign zh-mastergo zh-eagle zh-pixso add-lanhu add-modao oil-reel oil-muse oil-diary oil-editor oil-camera',
 'creative-system':'shadcn zh-semi zh-tdesign oil-components',
 'creative-learning':'awwwards add-aestheticell add-aapd-product-design-academy add-lanyanghei add-cardledge add-word-game',
 'brand-lifestyle':'aesop muji patagonia vitra bangolufsen gentlemonster add-weight-books add-moom oil-knot oil-keeb oil-silver oil-checkout oil-watch oil-sneaker oil-scent oil-device',
 'brand-food':'zh-jzn zh-pocari zh-vvg add-asahihuuhu add-a-ling add-sseedd oil-roast',
 'brand-travel':'zh-yayu add-hot-spring-onion oil-stay oil-studio',
 'culture-arts':'moma designmuseum rijksmuseum barbican zh-ucca zh-islandlife add-paul-chiang-art-center add-tcam-museum add-taipei-performing-arts-center add-taipei-art-book-fair oil-anime',
 'culture-community':'add-taiwan-raptor add-rethink-tw add-slowfood-taitung zh-plainlaw',
 'culture-publishing':'zh-slowork zh-yixi zh-sspai zh-gooood',
 'productivity-notes':'notion obsidian craft oil-cards',
 'productivity-team':'loom miro things todoist oil-tracker oil-calendar oil-canvas',
 'productivity-utilities':'raycast dropbox oil-contract oil-ledger oil-lims oil-mail',
 'studio-brand':'pentagram collins koto add-o-oo',
 'studio-digital':'instrument',
 'studio-space':'zh-colorpalette zh-leaping add-jl-design',
 'media-editorial':'itsnicethat wallpaper gentlewoman monocle add-fa-movie-appreciation add-fountain-magazine add-verse add-brandinlabs',
 'media-reading':'add-reporter-kids oil-recipe oil-reader',
 'media-audio':'oil-vinyl oil-podcast oil-wrapped',
 'personal-portfolio':'zh-kzhik zh-zenart oil-folio',
 'personal-blog':'zh-jack zh-blatr zh-krjojo add-bluehe add-weizwz',
 'personal-maker':'add-elvis-mao add-qlad oil-maker',
 'developer-platform':'vercel supabase resend tailscale',
 'developer-code':'astro deno rust',
 'developer-workflow':'github oil-copilot',
};
export const subcategoryById = Object.freeze(Object.fromEntries(Object.entries(assignments).flatMap(([child, ids]) => ids.split(' ').map(id => [id, child]))));
const parents = new Map(taxonomy.flatMap(group => [[group.id,group], [group.label,group]]));
const children = new Map(taxonomy.flatMap(group => group.children.map(child => [child.id,{parent:group.id,child:child.id}])));
const rules = {
 product:[['product-work',/笔记|知识|文档|协作|项目/],['product-life',/生活|社交|健康|运动|出行|天气|家居|学习/]],
 creative:[['creative-system',/组件|设计系统|设计体系/],['creative-learning',/教育|学院|字体|灵感|游戏|策展/]],
 brand:[['brand-enterprise',/企业|制造|机械|工业|精密|工程|半导体/],['brand-food',/餐饮|食品|饮品|咖啡|糕点|茶|饮料/],['brand-travel',/旅行|住宿|温泉|酒店|空间|场地|户外旅行/]],
 culture:[['culture-community',/公益|社会|地方|自然|环保|法律/],['culture-publishing',/出版|演讲|媒体|阅读|书籍/]],
 productivity:[['productivity-notes',/笔记|知识|文档/],['productivity-team',/任务|团队|项目|日历|白板|协作/]],
 studio:[['studio-space',/空间|影像|建筑|室内/],['studio-digital',/数字|交互|网站|体验/]],
 media:[['media-audio',/音乐|播客|音频|播放器/],['media-reading',/阅读|菜谱|知识/]],
 personal:[['personal-portfolio',/作品|插画/],['personal-maker',/开发者|编程|独立创作/]],
 developer:[['developer-workflow',/协作|AI|编程助手/],['developer-code',/框架|语言|运行时|开源/]],
};
const defaults = {games:'games-official',product:'product-platform',creative:'creative-tools',brand:'brand-lifestyle',culture:'culture-arts',productivity:'productivity-utilities',studio:'studio-brand',media:'media-editorial',personal:'personal-blog',developer:'developer-platform'};
export function classifyCase(item) {
 const group = parents.get(item.category);
 const chosen = children.get(item.subcategory) || children.get(subcategoryById[item.id]);
 if (chosen && (!group || chosen.parent === group.id)) return {...chosen};
 if (!group) return {parent:'uncategorized',child:'uncategorized'};
 const text = [item.name,item.subtitle,...(item.tags || [])].join(' ');
 const child = (rules[group.id] || []).find(([,pattern]) => pattern.test(text))?.[0] || defaults[group.id];
 return {parent:group.id,child};
}
export function filterByTaxonomy(items, category='全部') {
 if (category === '全部') return items;
 const selected = parents.get(category)?.id || category;
 return items.filter(item => {const {parent,child}=classifyCase(item); return selected===parent || selected===child;});
}
export function taxonomyCounts(items) {
 const result = {'全部':items.length};
 for (const group of taxonomy) {result[group.id]=0; for (const child of group.children) result[child.id]=0;}
 for (const item of items) {const {parent,child}=classifyCase(item);result[parent]=(result[parent]||0)+1;if(child!==parent)result[child]=(result[child]||0)+1;}
 return result;
}
export function taxonomyLabel(id) {
 return id === '全部' ? '全部网站' : parents.get(id)?.label || taxonomy.flatMap(group=>group.children).find(child=>child.id===id)?.label || '全部网站';
}

// Public category links only initialize the gallery; favorites remain local.
export function categoryFromSearch(search = '') {
 const value = new URLSearchParams(search).get('category');
 return parents.get(value)?.id || (children.has(value) ? value : '全部');
}
