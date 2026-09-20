# 个人作品集

卢柯宇的个人作品集网站。React 19 + Vite 6 单页应用，hash 路由多页面，苹果官网式设计语言。

## 在线地址

- 主站：https://lukeyu-blog.app.workbuddy.host/
- 备份（GitHub Pages）：https://2676136489-png.github.io/personal-design/

## 本地开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 同步到 GitHub Pages

```bash
node scripts/deploy-pages.mjs
```

脚本会带 `--base=/personal-design/` 重新构建到 `dist-pages/`，再强推到 `gh-pages` 分支。之所以要带 base 参数：Pages 是项目站、地址带子路径，而主站部署在根目录，两者路径前缀不同，所以 base 只能在构建时传参，不能写死在 `vite.config.js`。

## 结构

```
src/
  main.jsx    页面组件与路由分派
  data.js     全部内容数据（项目、能力、时间线、校园圈子详解）
  router.js   极简 hash 路由
  styles.css  设计系统
public/media/ 图片素材，campus/ 为校园圈子真实界面截图
scripts/      部署脚本
```

## 注意

- 主分支只放源码，构建产物走 `gh-pages` 分支。
- 改完源码不会自动同步到线上，需要重新发布。
- GitHub Pages 首次启用需在仓库 Settings → Pages 里把 Source 设为 `Deploy from a branch`、分支选 `gh-pages`。
