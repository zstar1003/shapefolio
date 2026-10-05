# 拾形

一个干净的网站设计灵感库。真实网站截图、简单分类、本地收藏。

[浏览网站](https://xdxsb.top/shapefolio/) · [GitHub 仓库](https://github.com/zstar1003/shapefolio)

## 体验

- 跨产品、开发、创意、效率、设计工作室、内容媒体、文化艺术、品牌商业与游戏的精选官网
- 收录 [Oil UI](https://ui.oiloil.org/) 的概念案例，按内容归入现有分类并链接回原始作品；保留来源与概念标记，不误标为真实商业产品
- 真正的网站截图；点击截图直接访问原站，详情按钮打开中文设计笔记
- 轻量半透明顶部工具栏，内容区域保持清晰，不叠加玻璃或装饰海报
- 侧边栏以 10 个一级分类、33 个二级分类组织内容；分类可展开/收起，数量随当前语言、搜索与收藏范围更新
- 中文网站筛选、搜索、名称排序与本地收藏；简体/繁体由明确语言元数据识别，支持搜索二级分类名称
- 独立收藏路由 `/#/favorites`，支持直接打开、刷新和浏览器前进/后退
- 按批加载和浏览器原生图片懒加载；无需账号或后端
- 桌面固定侧边栏、移动端可关闭分类抽屉；支持键盘焦点、Escape 关闭、背景隔离与减少动态效果
- 图库和收藏页各自保留筛选条件，二级分类也参与组合筛选

## 截图与来源

截图由对应官网生成，来源记录位于 `src/screenshots.js`，本地图片位于 `assets/screenshots/`。图库不会用介绍海报或生成图片代替官网截图。图库默认仅展示已获得合适截图的网站；未就绪条目的资料仍保留在数据文件中。已收录图片加载失败时显示“截图待补充”。界面数量反映当前可展示的条目。

截图服务可能返回缓存结果，因此 `retrievedAt` 表示获取日期，不是已证实的拍摄日期。图片可能与官网当前版本不同。截图中的设计、图像、商标及文字属于各自权利人，**不包含在本项目的 MIT 代码许可中**。来源及用途详见 [ATTRIBUTION.md](./ATTRIBUTION.md)。

项目原始代码使用本地截图，不在访客浏览时调用截图服务，也未集成第三方追踪或远程字体。实际部署域名可能由托管或 CDN 层附加分析脚本；当前自定义域名存在 Cloudflare Insights 注入，未由本项目修改其设置。访问官网时适用目标网站的隐私政策。

## 本地运行

需要 Node.js 20 或更新版本。Pages CI 使用 Node.js 24。零 npm 依赖，不需要安装包。

```sh
npm run dev
# http://localhost:4173
npm test
npm run build
```

`dist/` 是静态部署产物。所有资源引用均为相对路径，兼容 GitHub Pages 仓库子路径。预览服务器仅用于开发。

## 已配置的 GitHub Pages

本仓库已配置 GitHub Pages，由 `.github/workflows/pages.yml` 在推送 `main` 后运行测试、构建与部署。已发布地址是 https://xdxsb.top/shapefolio/ 。初次构建曾在 Pages 尚未启用时失败，启用后已修复并验证成功；后续状态以仓库 Actions 中对应提交的记录为准。

若 fork 到其他账号，需要在新仓库 Settings → Pages 选择 GitHub Actions，并更新本 README 的站点链接；无需更改资源基路径。

## 编辑内容

在 `src/data.js` 中维护网站名称、唯一 id、分类、标签、HTTPS 官网、设计笔记。一级分类使用 `category`，新条目用 `subcategory` 明确指定 `src/taxonomy.js` 中的二级分类 ID。分类按网站内容与用途划分，发现来源不会成为分类。中文网站还需填写经核验的 `language`（`zh-CN` 或 `zh-TW`）、`sourceName` 和 `sourceUrl`；仅有中文学习笔记不算中文网站。添加截图时，在 `src/screenshots.js` 中使用相同 id，记录本地 `src`、原站 `sourceUrl`、`retrievedAt`；未确定截图拍摄时间时不要填写 `capturedAt`。不将验证码页、错误页或空白图作为有效截图。

分类和数量自动更新。本次快照为 377 条资料、368 张审核通过的截图，其中 104 个中文网站。本轮创意扩充在原有 194 个可见案例之外新增 **174 个**，聚焦 3D / WebGL、沉浸场景、实验界面、创意作品集与滚动叙事，不按汽车题材限制。当前是分批发布中的快照，完整候选仍在审核。保留原有 203 条资料、相对顺序与全部收藏 ID。

新增「互动与实验」「品牌互动体验」两个二级分类；工作室、个人网站和游戏仍按主体用途归类。可搜索 WebGL、3D、滚动叙事、实验交互等关键词。共 10 个一级分类、33 个二级分类，界面始终从当前数据计算数量。新增来源与逐图审核记录见 `research/distinctive-expansion.json`。网站互动依据明确区分实际浏览器测试与创作者/目录描述；并非每一个互动流程都经过实测，部分 WebGL 作品需要支持相应图形能力的浏览器。

GameMCU SU7 是本轮的创意参考；核验时原站返回 502，因此暂未把该页面作为已核验的可见案例加入。`npm test` 包含 71 项测试，增加了 620 条模拟数据下的分页、搜索、语言筛选、收藏和历史回归，但不替代实际浏览器的视觉与交互检查。

收藏使用 localStorage，限于当前浏览器和站点来源。`/#/favorites` 是本地收藏页，不公开收藏内容，也不会跨设备同步；把该链接发给别人不会共享你的收藏。清除浏览器数据将删除收藏；存储不可用时会提示，网站仍可浏览。本次保留原有收藏键和所有旧案例 ID。

## 分类直达

[互动与实验](https://xdxsb.top/shapefolio/?category=creative-interactive) · [品牌互动体验](https://xdxsb.top/shapefolio/?category=brand-experience) · [浏览游戏](https://xdxsb.top/shapefolio/?category=games) · [网页小游戏](https://xdxsb.top/shapefolio/?category=games-browser)

`?category=` 可使用现有一级或二级分类 ID，仅在首次加载时初始化图库筛选。收藏页仍然只显示当前浏览器的本地收藏，不会通过链接分享收藏。未知分类会回退到全部网站。

## 结构

```text
index.html              页面与对话框
src/data.js             网站数据与筛选逻辑
src/taxonomy.js         二级内容分类、稳定 ID 映射与分类计数
src/screenshots.js      真实截图来源记录
src/app.js              搜索、分类、收藏、详情与分批展示
src/styles.css          简洁布局与半透明导航
assets/screenshots/     本地官网截图
scripts/                无依赖构建及开发服务器
research/               候选发现、来源与公开链接核验记录
tests/                  Node 原生测试
.github/workflows/      GitHub Pages 部署
```

原始代码以 [MIT](./LICENSE) 许可开源。第三方截图、品牌和网站内容不适用该许可。

## Oil UI 案例说明

Oil UI 的概念作品与其 MIT 许可的技能仓库并不等同；未将画廊截图、作品代码或商标声明为 MIT。本站仅收录链接、截图与原创学习笔记，来源见对应详情和 ATTRIBUTION.md。
