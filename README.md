# 个人作品集

卢柯宇的个人作品集网站。React 19 + Vite 6 单页应用，hash 路由多页面，苹果官网式设计语言。

## 在线地址

- 主站：https://lukeyu-portfolio.app.workbuddy.host/
- 镜像：https://2676136489-png.github.io/personal-design/

两个站部署方式不同，源码相同、构建参数不同，改完后要各自重新发布（见下方「构建与发布」）。

## 收录的作品

| 项目 | 方向 | 时间 |
| --- | --- | --- |
| [校园圈子](https://www.lucky-campus.top) | 全栈 · 校园社交平台 | 2026.05 — 2026.08 |
| Transformer Gomoku 对弈 Bot | 算法系统 | 2026.04 — 2026.06 |
| iGEM Glass Wiki 插件 | Web 组件 | 2026.07 |
| 个人作品集 | 前端开发 | 2026.07 — 2026.08 |
| 菜鸟驿站快递管理系统 | 系统设计 | 2024.09 — 2024.12 |
| 校园服务视觉系统 | 品牌视觉 | 探索性设计 |

除首页外，每个项目都有独立详情页，正文分章节讲清设计取舍。校园圈子体量最大，独立成一套六章详解。

## 结构

```
index.html
src/
  main.jsx      页面组件与路由分派
  data.js       全部内容数据（项目、能力、时间线、校园圈子详解）
  router.js     极简 hash 路由
  motion.jsx    动效：滚动揭示、视差、数字滚动
  lightbox.jsx  图片灯箱
  markdown.js   Markdown 渲染
  styles.css    设计系统
public/media/   图片素材（全部 WebP），campus/ 为校园圈子真实界面截图
media-src/      截图源图（PNG），不进产物
scripts/        部署、图片处理与验证脚本
```

## 几个设计取舍

**hash 路由**。站点同时部署在根目录和 `/personal-design/` 子路径下，hash 路由不依赖服务端 rewrite，刷新任意深层页面都不会 404，静态托管上最省事。

**base 只在构建时传参**。主站在根目录、镜像站在子路径，前缀不同，所以 `--base` 不能写死在 `vite.config.js` 里。镜像站的构建由 `scripts/deploy-pages.mjs` 带上 `--base=/personal-design/` 完成。

**图片路径必须经 `asset()` 包一层**（`src/data.js` 导出）。`public/` 下的资源用 JS 字符串引用时，Vite 只改写 HTML 和 `import` 的路径，不会碰字符串字面量，所以得自己拼 `import.meta.env.BASE_URL`。写死绝对路径在主站看着正常，一到子路径部署就整片 404。

**`<img>` 的 `width`/`height` 属性要配 `height: auto`**。这两个属性是给浏览器提前算宽高比、避免图片加载时页面抖动的；但如果 CSS 只写了 `width: 100%` 而没写高度，浏览器会把属性里的高度当成固定像素尺寸用，图片就被纵向拉伸。全局 `img` 规则里显式写了 `height: auto` 兜底。

## 本地开发

```bash
npm install
npm run dev
```

## 构建与发布

```bash
npm run build          # 产物在 dist/
```

**主站**：以静态服务方式托管 `dist/`，监听 `$PORT` 环境变量。

```bash
cd dist && python3 -m http.server ${PORT:-3000} --bind 0.0.0.0
```

**镜像（GitHub Pages）**：

```bash
node scripts/deploy-pages.mjs
```

脚本会重新构建到 `dist-pages/`（带 `--base=/personal-design/`），再强推到 `gh-pages` 分支。主分支只放源码，产物单独走 `gh-pages`，避免几十张截图把仓库撑大。

GitHub Pages 首次启用需在仓库 Settings → Pages 里把 Source 设为 `Deploy from a branch`，分支选 `gh-pages`、目录选 `/(root)`。

## 图片处理

截图源图放 `media-src/`（PNG），由 `scripts/optimize-images.py` 统一转成 WebP 写到 `public/media/`，产物里不留 PNG。整站图片从 14.6MB 压到 1.9MB。

## 验证

前端验证走 SSR 渲染冒烟脚本——在 Node 侧用 `react-dom/server` 把组件真渲染成 HTML 再断言，不依赖浏览器截图。

```bash
node scripts/smoke-render.mjs      # 页面渲染、文案、导航、数据结构契约
node scripts/smoke-nav.mjs         # 导航下拉：SSR 结构 + 数据 + 样式契约
node scripts/smoke-lightbox.mjs    # 图片灯箱结构与交互契约
node scripts/smoke-backtotop.mjs   # 回到顶部按钮显隐逻辑
```

断言里既有「内容有没有渲染出来」，也有「实现契约有没有被改坏」——后者用来防止某次重构悄悄把已修好的问题带回来。
