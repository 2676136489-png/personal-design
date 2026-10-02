# 个人作品集

卢柯宇的个人作品集网站。React 19 + Vite 6 单页应用，hash 路由多页面，深色科技风视觉（玻璃拟态 + 光晕背景 + 网格纹理）。

## 在线地址

- 主站：https://lukeyu-portfolio.app.workbuddy.host/
- 镜像：https://2676136489-png.github.io/personal-design/

两个站部署方式不同，源码相同、构建参数不同，改完后要各自重新发布（见下方「构建与发布」）。

## 收录的作品

| 项目 | 方向 | 时间 |
| --- | --- | --- |
| [OpsPilot · AI 事故响应系统](https://opspilot-v2.app.workbuddy.host/) | Agent 系统 | 2026.09 — 2026.10 |
| [AI 研究工作台](https://ebed98754f5b4e4abafe591d754aff06.app.workbuddy.host/) | Agent 系统 | 2026.09 — 2026.10 |
| [校园圈子](https://www.lucky-campus.top) | 全栈 · 校园社交平台 | 2026.05 — 2026.08 |
| Transformer Gomoku 对弈 Bot | 算法系统 | 2026.04 — 2026.06 |
| iGEM Glass Wiki 插件 | Web 组件 | 2026.07 |
| 个人作品集 | 前端开发 | 2026.07 — 2026.08 |
| 学习目标管理台 | Web 应用 | 2026.09 |
| 菜鸟驿站快递管理系统 | 系统设计 | 2024.09 — 2024.12 |
| 校园服务视觉系统 | 品牌视觉 | 探索性设计 |

OpsPilot 与 AI 研究工作台体量最大，各有一套多章详解；其余项目除校园圈子外都有独立详情页，正文分章节讲清设计取舍。校园圈子独立成一套六章。

## 结构

```
index.html
src/
  main.jsx      页面组件、导航与路由分派
  data.js       全部内容数据（项目、能力、时间线、校园圈子详解）
  router.js     极简 hash 路由
  motion.jsx    动效：滚动揭示、视差、数字滚动、逐字上浮、导航指示条
  lightbox.jsx  图片灯箱
  markdown.js   Markdown 渲染
  cloud.js      云服务配置（可选，未配置时走本地分支）
  styles.css    设计系统：变量、双主题、各区块样式
public/media/   图片素材（全部 WebP），campus/ 为校园圈子真实界面截图
media-src/      截图源图（PNG），不进产物
plans/          动效审计计划与执行记录
scripts/        部署、图片处理、验证脚本
                （shoot-site.mjs 抓线上界面截图，make-project-covers.py 转封面）
```

## 几个设计取舍

**hash 路由**。站点同时部署在根目录和 `/personal-design/` 子路径下，hash 路由不依赖服务端 rewrite，刷新任意深层页面都不会 404，静态托管上最省事。

**base 只在构建时传参**。主站在根目录、镜像站在子路径，前缀不同，所以 `--base` 不能写死在 `vite.config.js` 里。镜像站的构建由 `scripts/deploy-pages.mjs` 带上 `--base=/personal-design/` 完成。

**图片路径必须经 `asset()` 包一层**（`src/data.js` 导出）。`public/` 下的资源用 JS 字符串引用时，Vite 只改写 HTML 和 `import` 的路径，不会碰字符串字面量，所以得自己拼 `import.meta.env.BASE_URL`。写死绝对路径在主站看着正常，一到子路径部署就整片 404。

**导航下拉面板挂在 `.global-nav` 上，不挂在触发项里**。`position: absolute` 的定位参照物是最近的定位祖先——挂在触发项里时参照物只有几十像素宽，`left: 0; right: 0` 只能铺满那么点，面板永远缩在中间；挂在 sticky 的导航栏上，参照物才是整页宽。

**面板开合的命中判定统一挂在 `<header>` 上**。触发项和面板是兄弟节点，中间还隔着导航栏剩下的一圈，指针斜着往下走时会在「导航栏空白 → 面板」之间掉出判定区，触发 leave 就把菜单收了，来回抖几下就成了弹跳。判定挂在 header 上（面板是它的子元素）之后，整条移动路径是一个连续命中区，结构上不可能断。`.nav-panel::before` 往上顶一条透明命中区作为双保险。

**面板底色用不透明的 `--panel-bg`**，不用半透明。半透明色叠在毛玻璃导航栏上，首屏那行 66px 的大标题会从面板底下透出来，跟面板条目叠成鬼影。

**列数由数据传给 CSS 变量**（`--cols`），配 `grid-template-columns: repeat(var(--cols, 3), minmax(0, 1fr))` 等比铺满整行。定死列宽会让 3 列只占左边一小块、右边空一大片。列与列之间用 1px 竖线分隔、整列悬停时整列亮起——条目挨得近，只靠条目自己的 hover 反馈，用户不知道自己在哪一列。

## 视觉体系

深空底色叠三团径向光晕，加一层往下渐隐的 64px 网格纹理和顶边渐变光带。卡片靠 `backdrop-filter: blur(20px) saturate(150%)` 做玻璃质感，**不加阴影也不加圆角**，层级全靠底色深浅分。颜色全部走 CSS 变量，浅色主题在同一套变量上覆盖，两套外观共用一份结构。

两个踩过的坑：

**逐字上浮的标题不能上渐变。** `SplitText` 把每个字拆成带 `transform` 的 `inline-block`，`transform` 会让子元素建立独立层叠上下文，父级的 `background-clip: text` 就裁剪不到它们——文字因为继承了 `-webkit-text-fill-color: transparent` 而全部隐形，表现为标题只剩首字可见。想给这个标题上渐变，渐变得施加到 `.split-inner` 自己身上，不能靠父级透明填充。

**逐字切分时要把标点并进前一个字。** 每个字是独立的 `inline-block`，换行发生在盒子边界上，浏览器不再套用中文避头尾规则——句号会被甩到下一行单独成行。所以切分时把标点并进前一个 unit，让它跟着一起走。

主题偏好存在 `localStorage`，key 带版本号（`portfolio-theme-v2`）：整体视觉换过一次之后，旧 key 里存的偏好属于上一套外观，继续沿用会让访客看不到新样式。

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

图片上的 `width` / `height` 属性只用来让浏览器提前算出宽高比、避免加载时页面抖动，但它们同时也是**固定像素尺寸提示**——优先级低于 CSS、高于 `auto`。只写 `width: 100%` 而不写高度时，高度会被属性里那个定值顶住，图片就纵向变形了。所以全局 `img` 规则里显式写了 `height: auto`。

## 验证

静态契约走 SSR 渲染冒烟脚本——在 Node 侧用 `react-dom/server` 把组件真渲染成 HTML 再断言，不依赖浏览器截图。

```bash
node scripts/smoke-render.mjs      # 页面渲染、文案、导航、数据结构契约（66 条）
node scripts/smoke-nav.mjs         # 导航下拉：SSR 结构 + 数据 + 样式契约（74 条）
node scripts/smoke-lightbox.mjs    # 图片灯箱结构与交互契约（43 条）
node scripts/smoke-backtotop.mjs   # 回到顶部按钮显隐逻辑（31 条）
```

断言分两种：一种是「内容有没有渲染出来」，另一种是「实现契约有没有被改坏」。后者防的是某次重构悄悄把已修好的问题带回来——比如「面板底色必须不透明」，一旦有人改回半透明，首屏那行大标题就会从面板底下透出来。

**断言本身也要验证。** 不会失败的断言等于没有：

```bash
node scripts/mutation-check.mjs
```

这个脚本把每项修复临时改回坏写法（面板挪回触发项内部、分组设 `position: relative`、竖线删掉……），确认对应的断言真的会 FAIL、退出码非 0，然后还原。10 条反例全部被拦住，才说明上面那 200 多条断言是有效的。

### 布局与交互实测

有些问题静态断言答不了：「指针移进面板会不会又触发 leave」「面板到底铺满整页宽没有」——这类只能让真实布局引擎回答。本机装了 Edge，走 CDP 驱动：

```bash
# 起浏览器与预览服务后
node scripts/cdp-probe.mjs http://127.0.0.1:5199/ 1440 900   # 量布局宽、找溢出元素
node scripts/hover-trace.mjs http://127.0.0.1:5199/          # 模拟真实鼠标走两条路径，数开合翻转次数
node scripts/shot-nav.mjs http://127.0.0.1:5199/ out.png 关于  # 悬停截图 + 量面板几何
node scripts/verify-projects.mjs 5267 9333                    # 逐个详情页量真实几何 + 截图留证
```

`verify-projects.mjs` 专门盯作品数据：把每个 slug 都打开一遍，确认封面图真的加载了、没被 CSS 拉变形、导航下拉里列得全。静态断言只能证明「数据里有这个 slug」，证明不了图加载了、布局没塌。

两处踩过的坑记在脚本注释里：CDP 必须用 `/json/new` 另开标签页（别拿日常浏览器里的 target 直接导航），以及 React 的 `onMouseEnter` 由 mouseout/mouseover 合成、手动派发 `mouseenter` 事件不触发它。

`hover-trace.mjs` 走两条路径：触发项直线移到面板中部，以及在边界附近小幅抖动（真实用户的手不会走直线，抖一下就崩的交互等于不能用）。
