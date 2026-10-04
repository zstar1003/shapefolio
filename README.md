# 拾形

一个干净的网站设计灵感库。真实网站截图、简单分类、本地收藏。

[浏览网站](https://xdxsb.top/shapefolio/) · [GitHub 仓库](https://github.com/zstar1003/shapefolio)

## 体验

- 跨产品、开发、创意、效率、设计工作室、内容媒体、文化艺术与品牌商业的精选官网
- 真正的网站截图；点击截图直接访问原站，详情按钮打开中文设计笔记
- 轻量半透明顶部工具栏，内容区域保持清晰，不叠加玻璃或装饰海报
- 分类、搜索、名称排序与本地收藏；分类和数量均从数据自动生成
- 按批加载和浏览器原生图片懒加载；无需账号或后端
- 响应式布局、键盘焦点、Escape 关闭详情、减少动态效果支持

## 截图与来源

截图由对应官网生成，来源记录位于 `src/screenshots.js`，本地图片位于 `assets/screenshots/`。图库不会用介绍海报或生成图片代替官网截图。图库默认仅展示已获得合适截图的网站；未就绪条目的资料仍保留在数据文件中。已收录图片加载失败时显示“截图待补充”。界面数量反映当前可展示的条目。

截图服务可能返回缓存结果，因此 `retrievedAt` 表示获取日期，不是已证实的拍摄日期。图片可能与官网当前版本不同。截图中的设计、图像、商标及文字属于各自权利人，**不包含在本项目的 MIT 代码许可中**。来源及用途详见 [ATTRIBUTION.md](./ATTRIBUTION.md)。

页面使用本地截图，不在访客浏览时调用截图服务，不加载第三方追踪或远程字体。访问官网时适用目标网站的隐私政策。

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

在 `src/data.js` 中维护网站名称、唯一 id、分类、标签、HTTPS 官网、设计笔记。添加截图时，在 `src/screenshots.js` 中使用相同 id，记录本地 `src`、原站 `sourceUrl`、`retrievedAt`；未确定截图拍摄时间时不要填写 `capturedAt`。不将验证码页、错误页或空白图作为有效截图。

分类和数量自动更新。测试要求至少 48 个不同网址并验证数据和筛选逻辑。`npm test` 不替代实际浏览器的视觉及交互检查。

收藏使用 localStorage，限于当前浏览器。清除浏览器数据将删除收藏；存储不可用时会提示，网站仍可浏览。

## 结构

```text
index.html              页面与对话框
src/data.js             网站数据与筛选逻辑
src/screenshots.js      真实截图来源记录
src/app.js              搜索、分类、收藏、详情与分批展示
src/styles.css          简洁布局与半透明导航
assets/screenshots/     本地官网截图
scripts/                无依赖构建及开发服务器
tests/                  Node 原生测试
.github/workflows/      GitHub Pages 部署
```

原始代码以 [MIT](./LICENSE) 许可开源。第三方截图、品牌和网站内容不适用该许可。
