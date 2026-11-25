/* 图片素材统一走 WebP（scripts/optimize-images.py 生成）。
   截图原 PNG 单张接近 1MB，首屏大图弱网下要等 1 秒以上、看起来像加载失败，
   转 WebP 后整站图片从 12.7MB 降到 0.85MB。 */
/* 部署基路径：WorkBuddy 主站是 '/'，GitHub Pages 项目站是 '/personal-design/'。
   public/ 下的图片以 JS 字符串字面量引用时 Vite 不会改写路径，
   必须自己拼 import.meta.env.BASE_URL，否则子路径部署时图片全部 404。 */
const BASE = import.meta.env.BASE_URL;
export const asset = (path) => `${BASE}${path.replace(/^\//, '')}`;

/* 素材实测尺寸（scripts 里跑 PIL 量出来的，新增图片时补一行）。
   给 <img> 写上 width/height，浏览器就能按属性里的比例预留位置，
   图片加载完成时页面不会往下一顶（CLS）。CSS 里是 width:100%，
   所以这里填真实像素值即可，显示尺寸仍由布局决定。 */
export const IMAGE_SIZES = {
  '/media/avatar-lky.webp': [1200, 1500],
  '/media/avatar-memoji-v2.webp': [720, 720],
  '/media/avatar-moods/wink.webp': [480, 480],
  '/media/avatar-moods/idea.webp': [480, 480],
  '/media/avatar-moods/thumbs-up.webp': [480, 480],
  '/media/avatar-moods/macbook.webp': [480, 480],
  '/media/campus-desktop.webp': [1216, 832],
  '/media/campus-phone.webp': [832, 1216],
  /* 2026-11 重拍：六张都来自 campus 仓库的 docs/screenshots，统一 1280×800 */
  '/media/campus/admin-login.webp': [1280, 800],
  '/media/campus/ai-assistant.webp': [1280, 800],
  '/media/campus/campus-cover-v2.webp': [1400, 933],
  '/media/campus/dashboard-1960.webp': [1280, 800],
  '/media/campus/feed.webp': [1280, 800],
  '/media/campus/login.webp': [1280, 800],
  '/media/campus/register.webp': [1280, 800],
  '/media/project-archive.webp': [1400, 933],
  '/media/project-checkin-v2.webp': [1400, 933],
  '/media/project-dashboard-v2.webp': [1400, 933],
  '/media/project-gomoku-v2.webp': [1400, 933],
  '/media/project-lumora.webp': [1400, 933],
  '/media/project-opspilot-v2.webp': [1400, 933],
  '/media/project-research-v2.webp': [1400, 933],
  '/media/project-station-v2.webp': [1400, 933],
  '/media/project-wiki-v2.webp': [1400, 933],
  '/media/resume/resume-900.webp': [900, 1274],
  '/media/resume/resume.webp': [1588, 2248],
  '/media/awards/igem-gold.webp': [1080, 659],
  '/media/awards/math-modeling.webp': [1400, 989],
  '/media/awards/social-work-2026.webp': [760, 1094],
  '/media/awards/scholarship-3rd-2026.webp': [760, 1073],
  '/media/awards/student-leader-2026.webp': [760, 1076],
  '/media/awards/student-leader-2025.webp': [760, 1075],
  '/media/awards/scholarship-3rd-2025.webp': [760, 1075],
};

/* 传给 <img> 的 width/height；查不到就什么都不给，宁可缺也不要写错的比例。 */
export const imgAttrs = (src) => {
  const key = src.startsWith(BASE) ? `/${src.slice(BASE.length)}` : src;
  const size = IMAGE_SIZES[key];
  return size ? { width: size[0], height: size[1] } : {};
};

export const media = {
  avatar: asset('/media/avatar-lky.webp'),
  campus: {
    desktop: asset('/media/campus-desktop.webp'),
    phone: asset('/media/campus-phone.webp'),
  },
  campusShots: (name) => asset(`/media/campus/${name}.webp`),
  resume: {
    preview: asset('/media/resume/resume.webp'),
    previewSmall: asset('/media/resume/resume-900.webp'),
    pdf: asset('/media/resume/lukeyu-resume.pdf'),
  },
};

export const profile = {
  name: '卢柯宇',
  initials: 'LKY',
  welcome: '欢迎来到我的个人网站',
  tagline: '独立完成系统设计与实现，交付可运行的线上版本。',
  email: 'luky2124@mails.jlu.edu.cn',
  phone: '15144167675',
  city: '吉林 长春',
  /* 现在校地与籍贯是两回事：简历上写的是「吉林 长春（籍贯 重庆）」。
     只写「重庆」会被读成人在重庆，而学校在长春 —— 投递时这是个会被追问的点。 */
  hometown: '籍贯 重庆',
  school: '吉林大学',
  education: '吉林大学 · 计算机科学与技术',
  github: 'https://github.com/2676136489-png',
  status: '本科在读',
};

/* 首屏数据条讲的是「做出来了什么」。
   成绩、学校、排名不放这里——那些属于简历和关于页（关于页的个人名片里已有教育信息）。 */
export const heroFacts = [
  { label: '收录作品', value: '10 个' },
  { label: '线上运行中', value: '9 个' },
  { label: '校园圈子用户', value: '19 位' },
  { label: '自动化测试', value: '4 类' },
];

/* 竞赛与活动页：证书内容逐字取自「活动和获奖情况」里的 PDF，
   iGEM 一条取自 JLU-FBH 官方 Wiki 与吉大一院报道。 */
export const awards = {
  igem: {
    year: '2026',
    title: 'iGEM 全球总决赛金牌',
    team: 'JLU-FBH',
    project: 'CirCure',
    role: '团队成员，来自计算机科学与技术学院',
    summary: '围绕三阴性乳腺癌复发问题，团队完成多表位环状 RNA 疫苗平台的计算筛选、实验验证与科普活动。',
    image: asset('/media/awards/igem-gold.webp'),
    imageCaption: '2026 GRAND JAMBOREE 金牌图',
    links: [
      { label: 'iGEM 官方项目站', href: 'https://2026.igem.wiki/jlu-fbh/' },
      {
        label: '吉大一院报道',
        href: 'https://mp.weixin.qq.com/s?__biz=MzA5OTQ4NjAwOA==&mid=2653218940&idx=1&sn=799db3f22dd9bb3524eb5f5e4739c2b9',
      },
      { label: '吉林大学新闻中心', href: 'https://news.jlu.edu.cn/info/1211/62308.htm' },
    ],
  },
  competitions: [
    {
      title: '2025 年高教社杯全国大学生数学建模竞赛',
      award: '吉林赛区三等奖',
      period: '2025.11',
      detail: '本科组 · 队员：杜金桥、卢柯宇、张恩宁',
      image: asset('/media/awards/math-modeling.webp'),
      caption: '全国大学生数学建模竞赛获奖证书',
    },
  ],
  honors: [
    {
      title: '校优秀学生干部',
      period: '2025—2026 学年',
      detail: '证书编号 2607210017',
      image: asset('/media/awards/student-leader-2026.webp'),
      caption: '2025—2026 学年校优秀学生干部证书',
    },
    {
      title: '三等奖学金',
      period: '2025—2026 学年',
      detail: '证书编号 2603210090',
      image: asset('/media/awards/scholarship-3rd-2026.webp'),
      caption: '2025—2026 学年三等奖学金证书',
    },
    {
      title: '社会工作奖',
      period: '2025—2026 学年',
      detail: '证书编号 2612210013',
      image: asset('/media/awards/social-work-2026.webp'),
      caption: '2025—2026 学年社会工作奖证书',
    },
    {
      title: '校优秀学生干部',
      period: '2024—2025 学年',
      detail: '证书编号 2507210038',
      image: asset('/media/awards/student-leader-2025.webp'),
      caption: '2024—2025 学年校优秀学生干部证书',
    },
    {
      title: '三等奖学金',
      period: '2024—2025 学年',
      detail: '证书编号 2503210159',
      image: asset('/media/awards/scholarship-3rd-2025.webp'),
      caption: '2024—2025 学年三等奖学金证书',
    },
  ],
  activities: [
    {
      year: '2026.05',
      title: 'iGEM 东北地区交流会',
      text: 'JLU-FBH 与 JLU-CP 联合承办，11 支队伍参加。',
    },
    {
      year: '2026',
      title: '合成生物学课堂',
      text: '走进吉大附中与附小，做 DNA 提取和免疫科普活动。',
    },
    {
      year: '2026',
      title: '杏花节公益科普',
      text: '在校园杏花节设乳腺健康咨询与知识问答。',
    },
  ],
};

/* 简历页数据：与 简历制作/01_母版/卢柯宇_简历_母版.md 逐条对齐。
   改简历时这里要同步改，否则线上简历页会和 PDF 对不上。 */
export const resume = {
  updated: '2026 年 11 月',
  summary:
    '吉林大学计算机科学与技术专业 2024 级本科生。项目实践基于 LangGraph、Dify 与 FastAPI 等开源工具，构建多套可在线演示的 AI 应用与 Web 系统，能够独立完成业务功能开发、环境配置与部署，以及问题定位与修复。实践方向集中于大模型输出约束、结果校验与异常兜底，覆盖幻觉、非法动作输出与任务执行异常等问题，现有多个公开可访问的演示系统与个人作品集。',
  education: [
    {
      school: '吉林大学',
      major: '计算机科学与技术 · 本科',
      period: '2024.09 - 2028.06',
      gpa: 'GPA 3.1 / 4',
      points: [
        '专业排名前 30%',
        '核心课程：数据结构、操作系统、计算机组成原理、计算机网络、数据库系统',
      ],
    },
  ],
  skillGroups: [
    ['AI Agent / LLM', '熟悉 Prompt Engineering、Tool Calling、LangGraph；了解上下文管理、LangChain、MCP 协议、Dify 编排、多智能体协作'],
    ['RAG / 检索增强', '熟悉 RAG 检索链路搭建与失败降级、文档分块与证据绑定；了解 Embedding 与向量检索、向量库（Chroma / FAISS）、混合检索与 Rerank'],
    ['后端 / 工程', '熟悉 Python、C、MySQL / SQL、FastAPI、SQLite；了解 SSE 流式接口、Linux 部署（Apache / PHP）、Docker Compose、pytest / Playwright'],
    ['语言 / 前端', '了解 HTML / CSS / JavaScript、TypeScript、React 19、Vite、C++17'],
  ],
  honors: [
    { title: '吉林大学三等奖学金', period: '2024.09 - 2025.09' },
    { title: '吉林大学校优秀学生干部', period: '2024.09 - 2025.09' },
    { title: '全国大学生数学建模竞赛省级三等奖', period: '2025.09' },
    { title: '大学英语四级（CET-4）', period: '' },
  ],
  /* 「个人优势」取自简历个人简述，一行一条。
     断言要求每条都能在新 PDF 抽出的文本里逐字找到，
     所以这里只做按句切分，不改写、不增删字。 */
  advantages: [
    '吉林大学计算机科学与技术专业 2024 级本科生',
    '项目实践基于 LangGraph、Dify 与 FastAPI 等开源工具',
    '能够独立完成业务功能开发、环境配置与部署，以及问题定位与修复',
    '实践方向集中于大模型输出约束、结果校验与异常兜底',
  ],
  /* 简历页只列 PDF 里出现过的那几个项目，与投递版本保持一致。
     顺序按简历原文：校园圈子 → AI 研究 → 五子棋 → 个人作品集。 */
  projectSlugs: ['campus', 'research', 'gomoku', 'portfolio'],

  /* 简历上每个项目那一行的参与口径，与 PDF 标题行括号里的定位逐字一致。
     源：outputs/卢柯宇简历_2026.md，2026-11 重写后按「系统约束」定位项目，
     不再写「Vibe Coding」—— PDF 上没有这个词，页面对不上会被读成两份材料。
     仍然不用 projects[].role：那是详情页口径（「独立开发 · 架构与实现」）。 */
  projectMeta: {
    campus: '高校实名社交平台',
    research: '证据优先的 AI 研究工作台',
    gomoku: '落子决策引擎 · 在线对战',
    portfolio: '技术作品展示站',
  },
  /* 每个项目下的分点技术描述，与 PDF 上的项目经历逐条一致（逐字复制自 md 源）。
     为什么不用 projects[].lede：
     lede 是项目详情页的引子，语气是散文，讲的是「为什么做这个」；
     简历要的是「做了什么、怎么做的」，读者是 HR 与面试官。
     改简历先改 md 与 PDF，再把 md 的分点逐字搬进来。 */
  projectHighlights: {
    campus: [
      '完成实名审核、动态广场、站内私信、举报处理与运营后台等社交业务功能开发；使用 MySQLi 预处理语句访问数据库，规避 SQL 注入风险；搭建包含账号登录、图形验证码与访问限流的基础鉴权机制。',
      'AI 问答场景在服务接口层设计权限约束逻辑，封装业务只读查询接口并注册为 Dify 工具，严格限定 AI 仅可读取预先划定的业务字段；检索不到有效信息时返回固定兜底文案，避免模型生成不存在的站内内容。',
      '在阿里云部署 Apache + PHP + MySQL 运行环境，区分开发与线上配置；上线后结合服务日志与错误日志，定位访问异常、图片加载缓慢、登录交互等问题，并迭代优化对应逻辑。',
      '针对新增、修改类写入操作增加独立的服务端角色校验流程，权限判定全部由后端代码执行，不采用大模型输出的身份与权限结论，从接口层面防范 Agent 越权修改业务数据。',
    ],
    research: [
      '基于 LangGraph 搭建七步 Agent 研究流水线，包含任务解析拆解、研究计划生成、多轮检索取证、证据抽取、分析归纳与结果校验；通过条件分支在验证不通过时自动重新检索，并设置迭代上限避免无限循环；报告生成前通过 interrupt 设置人工确认环节。',
      '支持本地上传私有知识库文档，检索时优先读取知识库内容，未获取有效信息再触发联网检索；抽取检索片段作为引用证据，报告中每条结论绑定证据编号，实现输出内容可溯源，同时识别并记录证据缺口与信息矛盾。',
      '针对长时研究任务出现的网关超时问题进行适配改造，将 Agent 执行流程后置为后台异步任务、接口即时返回；前端以 SSE 接收进度，配 6 秒看门狗，超时降级 2.5 秒轮询，保证前端可以稳定获取任务实时进度。',
      '规避固定相似度阈值带来的召回缺陷，采用知识库与联网检索双路径兜底。',
    ],
    gomoku: [
      '采用引擎与 LLM Agent 分层设计：由博弈引擎输出合法落子候选集合，约束 LLM Agent 仅在候选集合中选择落子动作；针对模型输出格式异常、请求超时等情况设置降级策略，异常时自动回退至引擎决策。',
      '搭建算法竞技场实验环境，支持多种策略互相对弈，可直观对比贪心、搜索引擎、Agent 等方案的对局表现；提供代码工坊能力，支持自定义走棋策略接入对局协议进行测试。',
      '搭建遵循国际连珠规则的五子棋在线对弈平台，实现人机对战、对局回放、学习模式与算法竞技场等业务功能；完成登录注册、对局存储等后端业务逻辑开发，基于 WebSocket 实现棋盘实时对战通信，通过 Docker 完成项目打包与部署。',
    ],
    portfolio: [
      '10 个项目共用一份数据与一套详情渲染。整站以 Vibe Coding 方式完成，页面、动效与图片管线由 AI 辅助生成，内容结构、交互取舍与上线验证由本人负责；同一份源码部署至两个环境，首屏体积控制在 1 MB 以内。',
    ],
  },
};

/* ============================================================
   方向索引
   ------------------------------------------------------------
   放在 navItems 之前：导航「按方向」那一列的链接从这里取。
   之前七项全写死成 '#/#work'（纯占位），点了只跳到全部作品概览。
   手写的问题不只是链接错：往后新增项目改了 category，
   导航那一列不会跟着变，两边就会不一致 ——
   这种「同一份信息写两遍」的地方必须收敛到一处。

   slug 用 category 的拼音式短名（agent / web / algo…），
   一眼能对上，且与项目 slug 不会撞。
   ============================================================ */

/* 方向 → 展示名与一句话说明。
   中文只在这里写，路由和链接都从这里推。 */
const CATEGORY_META = {
  'Agent 系统': { slug: 'agent', blurb: '模型参与需求拆解、架构设计与交付。' },
  'Web 应用': { slug: 'web', blurb: '具备完整账号体系与数据存储的应用。' },
  '算法系统': { slug: 'algo', blurb: '禁手判定、棋形识别与 alpha-beta 搜索。' },
  '系统设计': { slug: 'system', blurb: '数据结构与业务流程的完整实现。' },
  'Web 组件': { slug: 'component', blurb: '为已有平台补充可复用的功能模块。' },
  '前端开发': { slug: 'frontend', blurb: '信息层级与操作路径设计。' },
};

/* projects 还没定义，先占位；下面 projects 导出之后再补上 projects 字段。 */

export const categories = Object.entries(CATEGORY_META)
  .map(([name, meta]) => ({ name, slug: meta.slug, blurb: meta.blurb, projects: [] }))
  .sort((a, b) => a.name.localeCompare(b.name, 'zh'));

export const categoryBySlug = (slug) => categories.find((c) => c.slug === slug);

/* projects 定下来之后回填，并按项目数排序（多的在前）。 */
const fillCategories = (list) => {
  for (const c of categories) c.projects = list.filter((p) => p.category === c.name);
  categories.sort((a, b) => b.projects.length - a.projects.length || a.name.localeCompare(b.name, 'zh'));
};

/* 导航「按方向」那一列的条目。
   单项目方向直接指到详情页（少一次点击），
   多项目方向指到聚合页让用户自己选 ——
   全塞进一个页面等于没有分类。

   ⚠️ 这必须是**函数**而不是常量数组。
      navItems 在模块加载时就求值，那时 projects 还没定义完，
      直接 `links: categoryNavLinks` 绑的是空数组（后来补上也绑不上，
      变量赋值不会改掉已绑定的引用）。
      所以 navItems 里存getter，读取时才现算。 */
export const getCategoryNavLinks = () =>
  categories
    .filter((c) => c.projects.length > 0)
    .map((c) => ({
      label: c.name,
      href: c.projects.length === 1 ? `#/${c.projects[0].slug}` : `#/category/${c.slug}`,
      count: c.projects.length,
    }));

/* 导航「作品」那一列的条目：按 projects 逐条列，标签取项目标题。
   同样必须是函数 —— 理由见上面 getCategoryNavLinks 的说明。 */
export const getProjectNavLinks = () =>
  projects.map((p) => ({ label: p.title, href: `#/${p.slug}` }));

/* 导航结构。
   有 columns 的项在悬停/聚焦时展开全宽面板（苹果官网那种）。
   面板由若干列组成，每列一个标题 + 一组条目；每组再细分成
   featured（粗体大字）和普通链接两种层级。

   条目的 href 支持两种目标：#/xxx 是独立页面，#/#xxx 是首页的某个区块。
   顺序要和 main.jsx 里首页各 section 的渲染顺序保持一致。 */
export const navItems = [
  { id: 'top', label: '首页', href: '#/' },
  {
    id: 'campus',
    label: '校园圈子',
    href: '#/campus',
    columns: [
      {
        title: '进入项目',
        featured: [
          { label: '项目详解', href: '#/campus' },
          { label: '在线站点', href: 'https://www.lucky-campus.top', external: true },
        ],
        links: [{ label: 'GitHub 仓库', href: 'https://github.com/2676136489-png/campus', external: true }],
      },
      {
        title: '六个章节',
        links: [
          { label: '项目缘起', href: '#/campus#background' },
          { label: '学生端', href: '#/campus#students' },
          { label: 'AI 助手', href: '#/campus#assistant' },
          { label: '管理后台', href: '#/campus#admin' },
          { label: '技术架构', href: '#/campus#stack' },
          { label: '工程复盘', href: '#/campus#lessons' },
        ],
      },
      {
        title: '项目数据',
        links: [
          { label: '19 位实名学生', href: '#/campus' },
          { label: '22 条动态', href: '#/campus' },
          { label: '75 条私信记录', href: '#/campus' },
          { label: '39 条审计日志', href: '#/campus' },
        ],
      },
    ],
  },
  {
    id: 'work',
    label: '全部作品',
    href: '#/#work',
    columns: [
      {
        title: '作品',
    featured: [{ label: '全部作品', href: '#/#work' }],
    /* getter：这一列按 projects 逐条列，不能手写。
       手写过一版，改名后忘了同步（作品列表叫「五子棋对弈引擎 Gomoku Match」，
       导航里还写着「五子棋引擎」），读者会以为是两个项目。
       跟「按方向」那列同理：navItems 求值时 projects 还没定义完，
       所以要存 getter，读取时才现算。 */
    get links() {
      return getProjectNavLinks();
    },
  },
  {
    title: '按方向',
    /* getter：见getCategoryNavLinks 上面的说明 */
    get links() {
      return getCategoryNavLinks();
    },
  },
      {
        title: '源码',
        links: [
          { label: 'GitHub 主页', href: 'https://github.com/2676136489-png', external: true },
        ],
      },
    ],
  },
  {
    id: 'about',
    label: '关于',
    href: '#/#about',
    columns: [
      {
        title: '我',
        featured: [{ label: '个人名片', href: '#/#about' }],
        links: [{ label: '在线简历', href: '#/resume' }],
      },
      {
        title: '经历',
        links: [
          { label: '成长时间线', href: '#/#about' },
          { label: '吉林大学 · 计算机', href: '#/#about' },
          { label: 'GPA 3.1 / 4', href: '#/#about' },
          { label: '专业排名前 30%', href: '#/#about' },
        ],
      },
      {
        title: '下载',
        links: [
          { label: '简历 PDF', href: '#/resume' },
          { label: 'GitHub', href: 'https://github.com/2676136489-png', external: true },
        ],
      },
    ],
  },
  {
    id: 'skills',
    label: '能力',
    href: '#/#skills',
    columns: [
      {
        title: '方向',
        featured: [{ label: '能力方向', href: '#/#skills' }],
        links: [
          { label: 'AI 原生开发', href: '#/#skills' },
          { label: '工程与算法', href: '#/#skills' },
          { label: '前端与界面', href: '#/#skills' },
          { label: '组织与推进', href: '#/#skills' },
        ],
      },
      {
        title: '技术栈',
        links: [
          { label: 'C / C++ · 数据结构', href: '#/#skills' },
          { label: 'Python · FastAPI', href: '#/#skills' },
          { label: 'PHP · MySQL', href: '#/#skills' },
          { label: 'React · TypeScript', href: '#/#skills' },
          { label: 'Docker · CI', href: '#/#skills' },
        ],
      },
      {
        title: '成绩与荣誉',
        links: [
          { label: '吉林大学三等奖学金', href: '#/#skills' },
          { label: '校优秀学生干部', href: '#/#skills' },
          { label: '数学建模省三', href: '#/#skills' },
          { label: '大学英语四级 CET-4', href: '#/#skills' },
        ],
      },
    ],
  },
  { id: 'resume', label: '简历', href: '#/resume' },
  { id: 'contact', label: '联系', href: '#/#contact' },
];

export const mailServices = [
  {
    id: 'qq',
    name: 'QQ 邮箱',
    hint: 'mail.qq.com',
    build: (to) => `https://mail.qq.com/cgi-bin/qm_share?t=qm_mailme&email=${to}`,
  },
  {
    id: '163',
    name: '网易 163 邮箱',
    hint: 'mail.163.com',
    build: (to) => `https://mail.163.com/php/compose.php?to=${to}`,
  },
  {
    id: 'outlook',
    name: 'Outlook',
    hint: 'outlook.live.com',
    build: (to) => `https://outlook.live.com/mail/0/deeplink/compose?to=${to}`,
  },
  {
    id: 'gmail',
    name: 'Gmail',
    hint: 'mail.google.com',
    build: (to) => `https://mail.google.com/mail/?view=cm&fs=1&to=${to}`,
  },
  {
    id: 'foxmail',
    name: 'Foxmail 客户端',
    hint: '本机客户端',
    build: (to) => `mailto:${to}`,
  },
];

/* ============================================================
   校园圈子 —— 主打项目
   数据源：用户提供的 13 张真实界面截图
   ============================================================ */

export const campus = {
  accent: '#C98B9E',
  accentInk: 'dark',
  slug: 'campus',
  name: '校园圈子',
  en: 'Campus Circle',
  site: 'https://www.lucky-campus.top',
  /* 简历页要链到仓库，校园圈子是独立数据源，不在 projects 数组里，
     所以 github 得自己带一份。 */
  github: 'https://github.com/2676136489-png/campus',
  period: '2026.05 — 2026.08',
  role: '独立开发 · AI 辅助工程',
  stack: 'PHP · MySQL · SSE · Docker',
  headline: '在线运行的校园社交平台。',
  lede: '实名认证、实时私信、敏感词过滤与运营后台均已实现，系统在线运行。',
  cover: asset('/media/campus/campus-cover-v2.webp'),

  metrics: [
    { value: '19', label: '实名注册学生' },
    { value: '22', label: '已发布动态' },
    { value: '75', label: '私信记录' },
    { value: '39', label: '审计日志条目' },
    { value: '12', label: '后台管理模块' },
    { value: '4', label: '测试类型' },
  ],

  chapters: [
    {
      id: 'background',
      nav: '项目缘起',
      kicker: '01',
      title: '校园社交平台的项目缘起',
      blocks: [
        {
          type: 'text',
          body: '校园信息分散于班级群、公告栏与熟人转发渠道：失物招领、社团招新与求助均缺少统一入口。项目以实名身份组织内容，所有用户须通过审核，每条内容可追溯至发布者。',
        },
        {
          type: 'text',
          body: '技术重点因此集中在身份核验、内容治理与真实负载三处。',
        },
        {
          type: 'points',
          items: [
            { k: '可信身份', v: '注册后需管理员核验学生证，通过审核后方可发布内容' },
            { k: '内容治理', v: '敏感词过滤 + 举报审核 + 管理员审计日志' },
            { k: '真实使用', v: 'SSE 实时私信（撤回、图片消息、置顶、免打扰）、无限滚动、图片重编码' },
          ],
        },
      ],
    },
    {
      id: 'students',
      nav: '学生端',
      kicker: '02',
      title: '学生端：登录、动态浏览与同学检索',
      blocks: [
        {
          type: 'text',
          body: '学生端按「登录 → 浏览动态 → 查找同学 → 发起私信」的路径组织。登录页左右分栏：左侧品牌区用文字地球与渐变光晕表达「认识同校的人」，右侧为登录表单，包含图形验证码与协议勾选。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/login.webp'),
          alt: '校园圈子学生登录页',
          caption: '登录页：左侧品牌区是文字地球与紫色渐变，右侧表单含图形验证码、用户协议勾选与管理员入口。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/register.webp'),
          alt: '校园圈子学生注册页',
          caption: '注册页：延续登录页的分栏与品牌视觉，填写资料后需等待管理员实名审核。',
        },
        {
          type: 'text',
          body: '首屏信息密度较高：实名状态、动态数、未读通知、未读私信四项数据置于顶部，下方为校园公告与快捷操作，进入后即可判断待处理事项。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/dashboard-1960.webp'),
          alt: '校园圈子学生中心',
          caption: '学生中心：左侧固定导航、顶部实名状态胶囊，玻璃拟态主卡展示用户信息与四项数据，下方是校园公告。',
        },
        {
          type: 'text',
          body: '动态广场是使用频率最高的页面，支持按关键词、标签、学院三重筛选，右侧固定发布入口与广场公约。动态支持最多三张图片、#话题 自动识别、收藏与草稿自动保存；评论可指定回复对象并触发通知。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/feed.webp'),
          alt: '校园圈子动态广场',
          caption: '动态广场：三重筛选（关键词 / 标签 / 学院）、话题标签与图文动态卡片，右侧是发布区与广场公约。',
        },
        {
          type: 'text',
          body: '「同学」页以卡片列出 19 位实名用户，展示姓名、性别、兴趣标签、学院、年级与专业，并按学院、年级、共同标签推荐，支持关注与取消关注。该页面将账号与具体人员对应。',
        },
        {
          type: 'points',
          items: [
            { k: '实名资料', v: '姓名、学院、年级、专业与兴趣标签，均来自审核通过的资料' },
            { k: '同频推荐', v: '按学院、年级与共同标签排序，卡片直接展示可点击的同学资料' },
            { k: '双向检索', v: '姓名、学院、专业与兴趣标签均可作为搜索条件，支持关注与取消关注' },
          ],
        },
      ],
    },
    {
      id: 'assistant',
      nav: 'AI 助手',
      kicker: '03',
      title: 'AI 校园小助手',
      blocks: [
        {
          type: 'text',
          body: '站内 AI 小助手基于 Dify 搭建：将查询接口注册为自定义工具，模型通过 Tool Calling 读取真实数据，回答中会显示「已使用 queryCampusInfo」的调用记录。支持以自然语言查询同学、动态与公告，对无结果的问题返回未找到。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/ai-assistant.webp'),
          alt: '校园圈子 Campus AI 助手界面',
          caption: 'AI 助手：整屏对话界面，可开启新会话，回答中引用站内同学与动态卡片并支持跳转。',
        },
        {
          type: 'text',
          body: '例如查询「姓王的同学」时，助手先说明能力边界，再调用查询工具返回结果。在校园场景中，编造信息的风险高于返回无结果，这一取舍决定了回答策略。',
        },
      ],
    },
    {
      id: 'admin',
      nav: '管理后台',
      kicker: '04',
      title: '管理后台：治理能力的产品化',
      blocks: [
        {
          type: 'text',
          body: '后台共 12 个模块。总览页给出待审核、已通过、已停用、违规动态四个关键计数，并支持管理员二次验证（登录后额外校验 6 位动态验证码）；运营侧有近 7 天活跃看板与 30 天运营趋势，注册、动态、评论、私信、活跃学生按天统计并可导出 CSV，另有运营数据日报。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/admin-login.webp'),
          alt: '校园圈子管理员后台登录页',
          caption: '管理员入口：独立的后台登录页，通过密码校验后还需完成二次验证。',
        },
        {
          type: 'text',
          body: '学生管理承担实名审核。待审记录包含学生证照片、学号、姓名、联系方式、学院年级专业与出生日期，管理员可执行「通过」「退回」「停用」，操作全部留痕。',
        },
        {
          type: 'text',
          body: '内容侧有四套独立的管理面板，各自带搜索、计数与 CSV 导出：动态管理可删除违规动态；评论管理可按内容或评论者检索；私信审计可查看完整对话内容（包括与 AI 助手的交互）；举报审核则是待处理队列。',
        },
        {
          type: 'table',
          head: ['模块', '治理能力'],
          rows: [
            ['总览', '四项核心计数，活跃看板与趋势报表，支持 CSV 导出'],
            ['学生管理', '学生证审核，通过 / 退回 / 停用，操作留痕'],
            ['动态管理', '内容与图片，互动数据和状态，支持 CSV 导出'],
            ['评论管理', '按内容或评论者检索，标注所属动态'],
            ['私信审计', '收发双方，内容，已读状态与时间'],
            ['举报审核', '举报人，对象，原因与处理操作'],
            ['审计日志', '操作人，类型，详情与时间，删除可回滚'],
            ['管理员账号', '角色分配与启用状态'],
          ],
        },
        {
          type: 'text',
          body: '审计日志记录每一条管理员操作，并支持回滚：已删除的私信与动态可以恢复。校园场景中，误删内容可能造成证据丢失或争议，这一能力属于必要项。',
        },
        {
          type: 'text',
          body: '管理员账号同样实行分级：超级管理员可以创建运营管理员并分配角色、设置启用状态，避免权限集中在单一账号上。',
        },
        {
          type: 'text',
          body: '意见反馈构成另一条独立流程：学生提交反馈（支持图片附件），管理员按状态处理并通知学生。',
        },
      ],
    },
    {
      id: 'stack',
      nav: '技术架构',
      kicker: '05',
      title: '技术选型与架构',
      blocks: [
        {
          type: 'text',
          body: '后端为 PHP + MySQL，未引入重型框架。服务部署在自行购买并维护的云服务器上，环境搭建、域名解析与上线运维均由本人完成，技术栈越精简，可控性越高。所有数据库操作均使用预处理语句，表单校验 CSRF token，密码以 bcrypt 加盐哈希存储，登录设置频率限制。',
        },
        {
          type: 'arch',
          groups: [
            {
              title: '前端',
              items: ['原生 HTML / CSS / JS', 'SSE 实时通道', 'Lenis 平滑滚动', '响应式 + 明暗双主题'],
            },
            {
              title: '后端',
              items: ['PHP 分层（UI / 认证 / 业务）', 'MySQL 预处理语句', 'CSRF Token 校验', 'bcrypt 密码哈希 + 登录限流'],
            },
            {
              title: '实时与安全',
              items: ['SSE 推送 + 轮询回退', '敏感词过滤', '图片真实性校验与重编码', '审计日志与回滚'],
            },
            {
              title: '工程',
              items: ['Docker Compose 一键起环境', 'GitHub Actions 持续集成', 'PHPUnit 单元测试', 'Playwright 端到端测试'],
            },
          ],
        },
      ],
    },
    {
      id: 'lessons',
      nav: '工程复盘',
      kicker: '06',
      title: '工程复盘：测试、安全与治理',
      blocks: [
        {
          type: 'text',
          body: '影响最大的改动是补充端到端测试。早期一次改动破坏了登录流程且未被发现，此后以 Playwright 覆盖关键路径，并在每次提交时自动执行，功能迭代由此获得回归保障。',
        },
        {
          type: 'points',
          items: [
            { k: '安全前置', v: '预处理语句与 CSRF 校验属于基础约定，应在编码开始前确定' },
            { k: '实时通道需保留回退', v: 'SSE 并非在所有网络环境下都稳定，轮询回退保证消息不丢失' },
            { k: '管理操作需留痕', v: '审计日志与回滚能力可以还原误操作' },
            { k: 'AI 能力需设边界', v: '助手仅查询真实数据，并明确说明能力范围' },
          ],
        },
      ],
    },
  ],
};

/* ============================================================
   其他项目
   ============================================================ */

/* ============================================================
   其他项目
   数据取自各仓库 README 与本机实测，不做超出来源的推断。
   ============================================================ */

export const projects = [
  {
    id: 'opspilot',
    accent: '#20304A',
    accentInk: 'light',
    slug: 'opspilot',
    title: 'OpsPilot · AI 事故响应系统',
    category: 'Agent 系统',
    year: '2026',
    period: '2026.09 — 2026.10',
    image: asset('/media/project-opspilot-v2.webp'),
    tag: 'LangGraph · FastAPI · React',
    description: '基于 LangGraph 的事故响应 Agent，覆盖告警发现至复盘的九个环节。执行过程逐项落库，可查询。',
    role: '独立开发 · 架构与实现',
    stack: 'Python · LangGraph · FastAPI · React 19 · MCP',
    site: 'https://opspilot-v2.app.workbuddy.host/?sharecode=RTXXSZUEYF',
    github: 'https://github.com/2676136489-png/OpsPilot',
    lede: '告警处理流程由状态机驱动的 Agent 执行。工具调用、证据获取、假设生成与否决、诊断置信度及恢复动作结果均落库。诊断可输出 UNKNOWN，验证未通过时记为失败。',
    metrics: [
      { value: '15', label: '图节点' },
      { value: '22', label: '工具' },
      { value: '4', label: '权限档位' },
      { value: '12', label: '评测场景' },
      { value: '135', label: '后端测试' },
      { value: '9', label: '前端页面' },
    ],
    note: '支持在线注入故障与完整流程演示，附 12 个场景的评测报告。',
    chapters: [
      {
        id: 'problem',
        nav: '要解决的问题',
        kicker: '01',
        title: '告警响应的核心问题是留痕',
        blocks: [
          {
            type: 'text',
            body: '值班工程师处理告警的流程通常为：查看指标、检索日志、核对最近部署、基于经验提出假设并逐项验证。整个过程依赖人工，缺少记录；复盘时无法还原排除某项假设的依据。',
          },
          {
            type: 'text',
            body: 'OpsPilot 将该流程交由状态机驱动的 Agent 执行，并要求每一步落库：调用工具、获取证据、提出与否决假设、诊断置信度，以及恢复动作是否生效。',
          },
          {
            type: 'points',
            items: [
              { k: '证据不足时弃权', v: '证据不足时诊断允许输出 UNKNOWN，该路径计入「已升级」，不计为失败' },
              { k: '可追溯', v: '被否定的假设及其依据均留档，复盘时可查看完整推理链' },
              { k: '恢复结果需验证', v: '恢复动作返回成功不等同于环境已修复，两者分开统计' },
            ],
          },
        ],
      },
      {
        id: 'graph',
        nav: '状态机',
        kicker: '02',
        title: '十五个节点，运行于 LangGraph 之上',
        blocks: [
          {
            type: 'text',
            body: '每个节点声明自身的 stage、超时、预算与失败语义，而非按顺序逐个调用工具。规划节点先确定需采集的证据，验证节点主动寻找反驳证据，能够证伪时退回重新规划。',
          },
          {
            type: 'table',
            head: ['阶段', '职责'],
            rows: [
              ['load_context / triage', '读取服务拓扑与健康状态，确定 SEV1–4 等级，划分时间窗'],
              ['investigation_planner', '规划需采集的证据，避免无差别调用全部工具'],
              ['parallel_investigation', '并发执行工具调用，任一超时不阻塞其余节点'],
              ['evidence_aggregation', '证据归一化、去重、标注可信度与时效'],
              ['hypothesis_generation', '生成候选假设并给出置信度'],
              ['hypothesis_verification', '主动检索反驳证据，证伪后退回重新规划'],
              ['root_cause_diagnosis', '输出根因与置信程度；证据不足时明确弃权'],
              ['recovery_planner / risk_assessment', '生成分步恢复方案，按动作风险确定审批策略'],
              ['human_approval', '人工审批环节（LangGraph interrupt）'],
              ['recovery_executor / rollback', '逐步执行并记录环境是否实际改变，失败按方案回退'],
              ['verification / postmortem', '回查指标判断是否实际恢复，并生成复盘'],
            ],
          },
          {
            type: 'text',
            body: '循环环节承担实际作用。评测中 12 次运行全部发生重新规划，平均 4.92 轮、18.92 步，涉及 14 个不同 stage。若流程无需回溯，则无需设置 15 个节点。',
          },
          {
            type: 'points',
            items: [
              { k: '节点仅返回增量', v: 'IncidentState 不做原地修改，合并由 LangGraph 负责' },
              { k: '检查点持久化至独立仓储层', v: '进程重启后可继续执行，人工审批中断的流程可从 human_approval 恢复' },
              { k: '每次运行有预算', v: 'token 用量、工具调用次数与墙钟时间三重上限，越界即停止并记录原因' },
            ],
          },
        ],
      },
      {
        id: 'tools',
        nav: '工具层',
        kicker: '03',
        title: '二十二个工具，权限分四档',
        blocks: [
          {
            type: 'text',
            body: '工具采用声明式定义，而非分散的函数实现。每个 ToolSpec 声明输入输出模型、超时、重试次数、风险等级、可预期的错误类型与所属 MCP server。',
          },
          {
            type: 'table',
            head: ['权限', '数量', '代表工具'],
            rows: [
              ['read_only', '10', 'query_logs · query_metrics · get_deployments · search_runbooks'],
              ['mutate_infra', '8', 'restart_service · scale_service · flush_cache · clear_deadlock'],
              ['destructive', '2', 'rollback_deployment · restart_postgres'],
              ['write_external', '2', 'switch_payment_provider · create_github_issue'],
            ],
          },
          {
            type: 'text',
            body: '权限分为四档，原因在于「修改自身基础设施」与「操作外部支付通道」的审批与审计路径不同。回滚同样归入 destructive：它会改变线上流量走向，需要明确的回滚点，而非再次部署。',
          },
          {
            type: 'points',
            items: [
              { k: '超时是工具的属性', v: '查询日志 5 秒、重启服务 30 秒，统一全局常量会导致超时误判或无谓等待' },
              { k: '幂等键', v: '携带请求指纹，重复调用返回首次执行结果，不重复执行' },
              { k: '钩子不可绕过', v: '审计与指标记录于调用前后，写操作的调用点无法绕过记录' },
            ],
          },
        ],
      },
      {
        id: 'recovery',
        nav: '恢复安全',
        kicker: '04',
        title: '分级审批与可回滚执行',
        blocks: [
          {
            type: 'table',
            head: ['风险', '典型动作', '行为'],
            rows: [
              ['low', '单实例重启、临时扩容', '自动执行'],
              ['medium', '滚动重启、配置热更新、清缓存', '自动执行，留审计'],
              ['high', '回滚部署、切换支付通道', '挂起并等待人工批准，拒绝即终止'],
              ['critical', '数据变更、删除类动作', '直接拦截，不进入审批队列'],
            ],
          },
          {
            type: 'text',
            body: '执行后必须验证：verification 回查指标，未恢复基线则触发 rollback。评测将 effective_action_rate 与 environment_fixed_rate 分开统计，用于区分「动作返回成功」与「环境已修复」。多数恢复系统将两者混为一谈。',
          },
          {
            type: 'points',
            items: [
              { k: '诚实度单独一项指标', v: '统计「给出错误根因且置信度较高」与「宣称成功但环境仍未恢复」两种情况' },
              { k: '两项指标的优先级高于准确率', v: '它们决定系统能否用于生产环境' },
            ],
          },
        ],
      },
      {
        id: 'evals',
        nav: '评测',
        kicker: '05',
        title: '十二个场景，均可追溯至证据',
        blocks: [
          {
            type: 'text',
            body: 'evals 为独立层次，不依赖后端进程，可直接执行并输出报告。未满分指标比满分指标更具参考价值。',
          },
          {
            type: 'table',
            head: ['指标', '值'],
            rows: [
              ['场景数 / 错误数', '12 / 0'],
              ['根因准确率', '1.00'],
              ['诊断类别准确率', '1.00（7 个类别全对）'],
              ['恢复成功率', '1.00（回滚率 0.00）'],
              ['误诊断率', '0.00'],
              ['证据召回 / 利用率 / 可追溯', '0.826 / 0.292 / 0.332'],
              ['平均步数 / stage 数', '18.92 / 14.0'],
              ['平均重新规划轮数', '4.92（12/12 次都重规划过）'],
              ['延迟 p50 / p95', '1193 / 1787 ms'],
            ],
          },
          {
            type: 'text',
            body: '根因、工具选择、恢复与验证四项为满分，说明在已定义场景上闭环稳定。证据利用率仅 0.29 属于实质问题：Agent 采集的证据中约七成未写入最终诊断的引用。该问题属于尚未查清的缺陷，而非评分口径问题，已列入后续修改方向。',
          },
          {
            type: 'text',
            body: '证据召回率达到 0.826 经历了一条完整轨迹：英文期基线为 0.701，界面中文化第一版降至 0.653，原因是翻译日志正文破坏了信号匹配；修复匹配问题后回到 0.674，将传播日志按故障类型拆分并分别描述真实症状后达到 0.826。判断「指标是否回退」必须以改动前的基线为准，仅观察「指标全部达标」并不充分。',
          },
        ],
      },
      {
        id: 'concurrency',
        nav: '并发',
        kicker: '06',
        title: '完整记录一次调查过程',
        blocks: [
          {
            type: 'text',
            body: '该项目约一半复杂度来自长任务本身：需要被审批打断、从前端断开后重新接入、在进程重启后继续。',
          },
          {
            type: 'points',
            items: [
              { k: 'SSE 基于落库事件回放', v: '先按 seq 回放完整事件日志，再切换至实时；断线后携带 Last-Event-ID 从游标继续' },
              { k: '已结束的运行支持回放', v: '回放读取数据库，而非内存环形缓冲' },
              { k: '候选假设与证伪', v: '被否决的假设按事件重建完整轨迹，置信度从 44% 升至 56% 的过程可查' },
              { k: '两个时间线页签', v: '「步骤」来自节点执行记录，「事件」来自 SSE 日志，两者均未经快照反推' },
              { k: '终态需由服务端确认', v: '终态回放结束帧触发主动 close，重连上限 5 次，红点停止闪烁' },
              { k: '孤儿 run 启动对账', v: '重启后非终态运行判为孤儿并完成收尾，等待审批的 checkpoint 予以保留' },
              { k: '未知健康度以灰色表示', v: '拓扑图节点颜色仅编码健康度，未知状态使用灰色，不使用绿色' },
            ],
          },
          {
            type: 'text',
            body: '反推生成的时间线无法展示重新规划、被否决的假设或回滚，而这三类信息是判断 Agent 是否执行推理而非机械复述的依据。候选假设面板为后续补充：相关数据始终已落库，事件日志中 hypothesis.created、updated、rejected 均有记录，但前端无组件消费这些事件；该缺口通过统计事件类型分布并与页面渲染结果核对后发现。',
          },
        ],
      },
      {
        id: 'lessons',
        nav: '工程复盘',
        kicker: '07',
        title: '本地可运行不等于部署可运行',
        blocks: [
          {
            type: 'text',
            body: '上述问题具有共同特征：仅在特定环境下暴露，暴露时的表现又类似另一类故障。以下条目均来自实际发生的问题。',
          },
          {
            type: 'points',
            items: [
              { k: '传递依赖', v: '在仅安装 requirements 的干净 venv 中，SQLAlchemy 异步引擎 import 时即报缺少 greenlet；本地 .venv 中该依赖由其他包间接引入' },
              { k: '路径硬编码', v: 'parents[5] 固定为六层目录，沙箱中少一层即触发 IndexError，在 import 阶段失败且无法输出日志' },
              { k: '.env 在 import 阶段不可见', v: '在 pydantic 加载 .env 之前读取 os.environ，得到 None，所有 provider 返回 503，日志却指向不存在的进程' },
              { k: '代理拦截回环请求', v: 'httpx 默认 trust_env=True，后端请求自身的 /__sim 被代理转发并返回 404，同一 URL 经 curl 请求返回 200' },
              { k: '元数据与实际执行不符', v: 'reasoning_mode 仅在创建时写入一次，使用模型的运行也对外声明 deterministic，比缺少元数据更严重' },
              { k: 'WAL 文件覆盖新库', v: '托管平台采用覆盖式上传，上一版 -wal 文件携带 page 1 副本覆盖新库，只能通过构建标识识别' },
              { k: '中文化破坏信号匹配', v: '日志正文翻译为中文后子串匹配全部失效，信号模式表改为双语短语兜底，中文词须为短语' },
              { k: '文档声明与实际渲染不一致', v: '假设数据始终已落库，但无组件消费；该缺口通过统计事件分布并与页面渲染结果核对后发现' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'research',
    accent: '#8FA98F',
    accentInk: 'dark',
    slug: 'research',
    title: 'AI 研究工作台',
    category: 'Agent 系统',
    year: '2026',
    period: '2026.09 — 2026.10',
    image: asset('/media/project-research-v2.webp'),
    tag: 'LangGraph · FastAPI · RAG',
    description: '自动拆解研究任务，完成检索、取证与核验后生成报告，逐条标注来源。',
    role: '独立开发 · 架构与实现',
    stack: 'Python · LangGraph · FastAPI · React 18 · SQLite',
    site: 'https://ebed98754f5b4e4abafe591d754aff06.app.workbuddy.host/?sharecode=JJ4JF7TBGM',
    github: 'https://github.com/2676136489-png/Personal-agent-development-flow',
    lede: '研究任务依次经过理解、规划、工具调用、证据分析与验证。报告生成前设置人工确认中断，证据不足时回流检索。确认与检索逻辑纳入工作流，不依赖调用方保证。',
    metrics: [
      { value: '7', label: '工作流节点' },
      { value: '4', label: '类工具' },
      { value: '256', label: '后端测试' },
      { value: '8', label: '页面模块' },
      { value: '4', label: '防护机制' },
      { value: '7 步', label: '研究流水线' },
    ],
    note: '模型接入智谱 GLM-4-Flash，检索接入 Tavily，线上无需额外配置。',
    chapters: [
      {
        id: 'problem',
        nav: '要解决的问题',
        kicker: '01',
        title: '研究型任务的两类典型问题',
        blocks: [
          {
            type: 'text',
            body: '让模型执行研究任务时，最常见的两类问题是：在证据不足时仍生成完整结论，以及将「表述合理」等同于「已经核验」。前者属于幻觉，后者导致结果无法复核：报告表述完整，但读者无法判断每句话的依据。',
          },
          {
            type: 'points',
            items: [
              { k: '可溯源', v: '每条结论均标注来源，无来源的句子不应出现在报告中' },
              { k: '可打断', v: '生成报告前必须人工确认，不应全程自动执行' },
              { k: '可复核', v: '证据不足时重新检索，不以剩余证据充数' },
            ],
          },
        ],
      },
      {
        id: 'graph',
        nav: '工作流',
        kicker: '02',
        title: '七个节点，一条带回流的流水线',
        blocks: [
          {
            type: 'code',
            lang: 'text',
            caption: '工作流图：两条回流边为核心机制，证据不足时重新检索，核验未通过时重新执行。',
            lines: [
              'START',
              '  ↓',
              'understand_task拆解研究目标与关键问题',
              '  ↓',
              'plan生成研究计划',
              '  ↓',
              'research←───────────────┐   ← 条件边：证据不足 → 再来一轮（≤ max_iterations）',
              '  ↓                       │',
              'retrieve           查自己的知识库补证据',
              '  ↓',
              'analyze从证据提炼结论 + 缺口',
              '  ↓',
              'verify   ─────────────────┘   ← 条件边：verdict=needs_more → 重新检索（≤ max_verify_attempts）',
              '  ↓',
              '[中断]  等待人工批准（interrupt_before=["write"]）',
              '  ↓',
              'write              生成最终报告',
              '  ↓',
              'END',
            ],
          },
          {
            type: 'text',
            body: '每个节点读取 ResearchState 并返回局部更新，由 LangGraph 合并。两个回流边是该工作流的核心：research 循环补充证据，verify 触发重新检索。verify 返回带缺口说明的结论，而非通过 / 不通过的二元值；缺口内容会被显式记录。',
          },
          {
            type: 'points',
            items: [
              { k: '职责单一', v: '7 个节点各自职责单一，这是能否独立测试的前提' },
              { k: '提示词与代码分离', v: 'prompts.py 独立维护，修改提示词无需调整图结构' },
              { k: '数据契约显式', v: 'schemas.py 定义节点之间的契约，新增节点时遗漏字段会立即暴露' },
            ],
          },
        ],
      },
      {
        id: 'gates',
        nav: '防失控',
        kicker: '03',
        title: '四道防护机制，分别约束不同类型的失控',
        blocks: [
          {
            type: 'table',
            head: ['防护项', '位置', '作用'],
            rows: [
              ['max_iterations', '条件边 route_after_research', 'research 循环上限'],
              ['max_verify_attempts', '条件边 route_after_verify', '验证重试上限'],
              ['MAX_FAILURE_STREAK', '条件边', '连续工具失败 2 次后停止重试'],
              ['recursion_limit=50', 'invoke config', 'LangGraph 层面的最终保护'],
            ],
          },
          {
            type: 'text',
            body: '四道防护机制并非用于「限制 Agent」，而是为失控设定明确的停止条件。前两条限制循环次数，第三条限制单个工具的连续失败次数，第四条为框架层面的最终保护；任一层改动导致前三层失效时，仍有兜底机制拦截。',
          },
        ],
      },
      {
        id: 'interrupt',
        nav: '中断与恢复',
        kicker: '04',
        title: '报告生成前强制中断',
        blocks: [
          {
            type: 'text',
            body: 'interrupt_before=["write"] 将人工确认置于报告生成之前。确认节点位于图内，并非弹出式确认框。中断恢复后，流程从 write 继续，不会重新执行前置检索。',
          },
          {
            type: 'points',
            items: [
              { k: '终态不可恢复', v: 'completed / cancelled / failed 三种终态下再调 resume 返回 409' },
              { k: '恢复范围需明确', v: 'checkpointer 使用 InMemorySaver，覆盖同进程内的两次请求；跨进程恢复切换至 SQLite 属于配置级改动' },
              { k: '派生状态同步落库', v: '落库时将 awaiting_approval 等状态一并写入，重启后读取结果与中断时保持一致' },
            ],
          },
        ],
      },
      {
        id: 'rag',
        nav: '知识库与 RAG',
        kicker: '05',
        title: '检索链路与实验台',
        blocks: [
          {
            type: 'text',
            body: '知识库采用「解析 → 切块 → 向量化 → 索引 / 存储 → 检索」的纯检索链路。RAG 实验台将该链路拆解为可逐步查看的实验页面：切块数量、命中片段、相关度与五个阶段的耗时均可查询。',
          },
          {
            type: 'points',
            items: [
              { k: '相关度门槛', v: '引用相关度门槛从 0.35 提升至 0.65，跨主题的低相关片段不再进入依据来源' },
              { k: '三维分布图', v: '向量分布调整为可旋转的三维视图，聚簇与离群点可直接观察' },
              { k: '索引落盘', v: '倒排索引包含词与块号，落盘后输出两个文件，重建前可人工核对' },
              { k: '示例语料', v: '知识库预置 10 篇文档，覆盖 MCP、Tool Calling、Agent 与 RAG' },
            ],
          },
          {
            type: 'text',
            body: '检索器不具备语义能力时（哈希后端），实验台会明确标注降级原因并回退至联网检索。该自适应降级策略来自一次实测：固定相似度阈值下，无关片段的相关度（0.473）反而高于相关片段（0.441），说明阈值方案不可行，因此改为按能力降级。',
          },
        ],
      },
      {
        id: 'scope',
        nav: '范围边界',
        kicker: '06',
        title: '明确排除的范围',
        blocks: [
          {
            type: 'text',
            body: '以下条目属于明确不做的范围，不属于待办事项。记录原因比列出待办更具参考价值，后续维护者可据此判断这是取舍还是遗漏。',
          },
          {
            type: 'table',
            head: ['不做', '原因'],
            rows: [
              ['Multi-Agent', '7 个节点共享同一份 State 与同一个 LLM client，属于同一个 Agent 的多个阶段。拆分只会增加一层消息传递与状态同步，职责并未变化'],
              ['复杂 Memory', 'messages 与 State 中的 evidence 列表已满足需求。向量记忆属于另一类问题，与「结论能否溯源」无关'],
              ['并行子问题检索', '检索仅占整轮耗时的一小部分，无法显著节省时间，却需要为状态合并与部分失败收敛增加一层判断'],
              ['跨进程恢复', '切换至 SQLite checkpointer 属于配置级改动，待出现多实例需求后再引入'],
            ],
          },
          {
            type: 'text',
            body: '判据保持一致：新需求若不能增强「证据可溯源 / 过程可观察 / 结论可复核」中的至少一项，则不纳入本版本。',
          },
        ],
      },
      {
        id: 'lessons',
        nav: '工程复盘',
        kicker: '07',
        title: '静默跳过的测试比失败的测试更危险',
        blocks: [
          {
            type: 'text',
            body: '该项目最值得记录的教训与测试本身有关。Vitest 默认按文件并行执行，在部分受限环境中，并行 worker 写入模块缓存被拒绝，第二个测试文件被静默跳过，整个运行仍报告通过。',
          },
          {
            type: 'points',
            items: [
              { k: '静默跳过比失败更危险', v: '失败会被察觉，静默跳过则不会。仅执行一个文件却报告全部通过时，应按失败处理' },
              { k: '修复方式写入配置注释', v: '关闭文件级并行后，51 个用例在 4 秒内完成；原因写入注释，避免后续误改回' },
              { k: '断言需限定范围', v: '检索整个页面会受到导航栏干扰，下拉菜单中列出了所有项目名称' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'archive',
    accent: '#31465C',
    accentInk: 'light',
    slug: 'archive',
    title: '网页设计档案',
    category: '前端开发',
    year: '2026',
    period: '2026.11',
    image: asset('/media/project-archive.webp'),
    tag: '静态页面 · 21 个独立场景',
    description: '21 个独立页面纳入统一索引，按整页、区块、动效、加载四类组织。',
    role: '独立开发',
    stack: 'HTML · CSS · 原生 JS · 静态部署',
    site: 'https://wbapp-4ytxtkm2qyyzpnnfhiiqfg.app.workbuddy.host/?sharecode=GHCD2BBZPY',
    github: 'https://github.com/2676136489-png/web-design-archive',
    lede: '索引按整页、区块、动效、加载四类组织 21 个页面。三维作品集、玻璃拟态首屏、文字路径与粒子球各为独立页面。各页采用独立的排版与动效。',
    metrics: [
      { value: '21', label: '独立页面' },
      { value: '16', label: '设计规格' },
      { value: '4', label: '页面分类' },
      { value: '5', label: '文字动效' },
    ],
    note: '页面均为静态 HTML，可直接打开 index.html 浏览。',
  },
  {
    id: 'lumora',
    accent: '#143B33',
    accentInk: 'light',
    slug: 'lumora',
    title: 'Lumora · 区块插件库',
    category: 'Web 组件',
    year: '2026',
    period: '2026.11',
    image: asset('/media/project-lumora.webp'),
    tag: '区块库 · 主题与 Wiki 演示',
    description: '197 个可复用区块按 22 类整理，附源码、提示词与 Wiki 演示模板。',
    role: '独立开发',
    stack: 'HTML · CSS · 原生 JS · 静态部署',
    site: 'https://wbapp-v2ojc8qetmpj74ypnddj2s.app.workbuddy.host/?sharecode=32KDFEZKHH',
    github: 'https://github.com/2676136489-png/Lumora',
    lede: '区块按页面区块、界面控件、风格页面三类划分，共 197 个。每个区块可复制源码与提示词。外层提供四套主题及一套 Wiki 模板，用于验证区块替换内容后的效果。',
    metrics: [
      { value: '197', label: '可复用区块' },
      { value: '22', label: '分类' },
      { value: '103', label: '界面控件' },
      { value: '4', label: '主题' },
    ],
    note: '资源全部本地化，附 Wiki 模板演示。',
  },
  {
    id: 'checkin',
    accent: '#E4B34A',
    accentInk: 'dark',
    slug: 'checkin',
    title: '学习目标管理台',
    category: 'Web 应用',
    year: '2026',
    period: '2026.09',
    image: asset('/media/project-checkin-v2.webp'),
    tag: '单文件 · React 工程化版',
    description: '按近 7 天有效进度估算剩余天数的目标管理台。',
    role: '独立开发',
    stack: '单文件 HTML · React 18 · TypeScript · Tailwind',
    site: 'https://study-goal-console-59328.app.workbuddy.host/?sharecode=PCKEDGKLDQ',
    github: 'https://github.com/2676136489-png/Check-in-activity',
    lede: '进度速度取最近 7 天数据，按休息日规则剔除无效天后计算日均进度。剩余天数由剩余量除以日均进度得出。',
    metrics: [
      { value: '2338', label: '行单文件版' },
      { value: '51', label: '算法单测' },
      { value: '46', label: 'UI 断言' },
      { value: '7', label: '尺寸实拍' },
      { value: '4', label: '状态判定' },
      { value: '3', label: '张数据表' },
    ],
    note: '仓库含两套功能一致的实现：单文件版用于日常使用，工程化版可直接启动。',
  },
  {
    id: 'gomoku',
    accent: '#3E4B3C',
    accentInk: 'light',
    slug: 'gomoku',
    title: '五子棋对弈引擎 Gomoku Match',
    category: '算法系统',
    year: '2026',
    period: '2026.04 — 2026.11',
    image: asset('/media/project-gomoku-v2.webp'),
    tag: 'Python / C++ · 博弈搜索与可学习评估',
    description: '15×15 国际连珠对弈平台，实现禁手判定、alpha-beta 搜索、可学习贪心与 Agent 决策层。八个页面已上线，支持在线对弈。',
    role: '独立开发',
    stack: 'Python · FastAPI · C++17 · SQLite · React 19 · Docker',
    site: 'https://gomoku-match.app.workbuddy.host/?sharecode=MJAKMJUVAA',
    lede: '项目起点为 Botzone 单文件 C++ Bot，采用棋形模板打分选点。引擎以 Python 重写后扩展为对弈平台。平台包含大厅、对弈、复盘、教程、代码工坊、竞技场与贪心学习。每个选点附棋形解释。',
    metrics: [
      { value: '453', label: '后端测试' },
      { value: '181', label: '浏览器走查' },
      { value: '2195', label: '深度 5 搜索节点' },
      { value: '46.4%', label: '学习型贪心棋谱复现率' },
      { value: '2881', label: '价值网络参数' },
      { value: '8', label: '个页面' },
    ],
    github: 'https://github.com/2676136489-png/Gomoku-match',
    chapters: [
      {
        id: 'brief',
        nav: '重写起点',
        kicker: '01',
        title: '从单文件 Bot 到完整对弈平台',
        blocks: [
          {
            type: 'text',
            body: '比赛版本的接口为：读一行 JSON、写一行 JSON，棋盘需自行从历史记录还原。该版本只能完成落子，无界面、无解释、无难度分级，也无法说明决策依据。',
          },
          {
            type: 'text',
            body: '重写分为三步：先将引擎迁移至 Python，便于迭代与编写测试；再补充搜索与棋形判定；最终扩展为完整的对弈平台。C++ 版本保留在 engine/bot.cpp，同时作为代码工坊 C++ 通道的示例。',
          },
          {
            type: 'points',
            items: [
              { k: '八个页面', v: '大厅、开局准备、对局、复盘、教程、代码工坊、竞技场、贪心学习' },
              { k: '对局可恢复', v: '每手落子写入一行 moves 表记录，进程重启后按手数重放还原局面' },
              { k: '冷热分层', v: '内存保留 400 局热态，超出按最久未活动淘汰，回访时从库载入' },
              { k: '账户持久化', v: 'SQLite 单文件存储，token 仅存 SHA-256 摘要' },
            ],
          },
          {
            type: 'text',
            body: '页面按职责拆分属于后期调整。早期将模式选择、难度、规则、棋盘、胜率曲线与解说集中在同一对局页，开局配置与对局操作混杂，对局中调整难度会误触发重开。拆分后，开局与对局相互独立，复盘与贪心学习单独成页。',
          },
        ],
      },
      {
        id: 'rules',
        nav: '禁手判定',
        kicker: '02',
        title: '规则判定优先于算法优化',
        blocks: [
          {
            type: 'text',
            body: '网页对局默认采用国际连珠规则：黑棋有禁手，白棋无禁手。三者优先级为「长连 > 五连 > 三三 / 四四」，因此判定不能先查禁手再查胜负，必须一次完成再排序；黑棋一手既成五又成长连时，判负。',
          },
          {
            type: 'table',
            head: ['禁手', '定义'],
            rows: [
              ['长连', '一手落下形成六子及以上的连珠'],
              ['四四', '一手同时形成两个「四」'],
              ['三三', '一手同时形成两个「活三」'],
            ],
            caption: '白棋无禁手，长连计胜。规则差异会直接改变引擎的选点结果。',
          },
          {
            type: 'text',
            body: '「三三」判定需要递归：一个「三」成立的前提是存在补点可将其变为活四，而该补点本身不得为黑棋禁手点，否则计为假活三。因此判三需先判四，判四又需判断是否触发禁手。递归最多两层：每补一子棋盘减少一个空点，不会无限递归。测试用例中，不带递归计得 2 个活三（误判三三禁手），带递归计得 1 个。',
          },
          {
            type: 'text',
            body: '「四」按四颗子的位置集合去重。活四两端均可成五，若按成五点计数，任何活四都会被计为两个四，导致所有活四点均构成四四禁手。左右窗口各命中一次，但属于同一组四颗子，仅计一个。',
          },
          {
            type: 'text',
            body: '代价是深度 5 单次搜索由 1.2 s 增至 1.9 s；收益是不再将禁手点作为进攻手段。同一局面下，未做过滤的版本会给出 899 万分的「必胜」判定，实际为三步后的长连。',
          },
        ],
      },
      {
        id: 'shapes',
        nav: '棋形识别',
        kicker: '03',
        title: '以补子后的形态判定棋形',
        blocks: [
          {
            type: 'text',
            body: '常见做法是维护棋形模板表并逐条比对。该方案的问题在于不同棋形的分值会在同一方向叠加：一条线上同时存在活二（100）与活三（1000）时累加为 1100，被判为活三；两个此类方向即构成「双活三」，额外计入 8000 分。连五（1000 万）同样满足 >= 10000，被记为冲四。该问题无法通过调整权重解决，根因是判定粒度与分值粒度耦合。',
          },
          {
            type: 'text',
            body: '重写改为另一条路径：将以落点为中心、长度 11 的线写成字符串（0 空点、1 己方子、2 对手子或盘外），逐档递归判断「补一子后的形态」。各档独立判定，越靠前越强，不存在分值叠加。',
          },
          {
            type: 'code',
            lang: 'text',
            caption: 'shapes.py 的判定阶梯：后一档是前一档的前提，_rank() 是唯一判定入口。',
            lines: [
              '连五 : 窗口里已经存在含中心的连续五个 1',
              '活四 : 存在两个以上的空点，补上就能连五',
              '冲四 : 存在一个空点，补上就能连五',
              '活三 : 存在一个空点，补上之后能变成活四',
              '眠三 : 存在一个空点，补上之后能变成冲四',
              '活二 : 存在一个空点，补上之后能变成活三',
              '眠二 : 存在一个空点，补上之后能变成眠三',
            ],
          },
          {
            type: 'text',
            body: '活四与冲四的区分随之明确：可成五的空点为两个时无法拦截，为一个时可拦截。模块内仅有一个判定入口 _rank()，外层仅加 lru_cache，同一条线只计算一次。',
          },
        ],
      },
      {
        id: 'search',
        nav: '搜索与增量评分',
        kicker: '04',
        title: '增量评分与搜索预算',
        blocks: [
          {
            type: 'text',
            body: '评估函数的主要开销在单子价值计算：四个方向各取一个 11 格窗口做分类。若每个搜索叶子都重扫全盘，Python 的性能不足以支撑深度 3。',
          },
          {
            type: 'text',
            body: '因此落子时仅重算发生变化的局部：一颗子最多与距离 4 以内的棋子构成五连，超过 4 格不再产生影响。place() 先收集半径 4 内的已占位置，扣除这些子的旧贡献后落子并整体重算，undo() 反向执行。代价是需自行保证状态一致性。测试中包含一条随机落子 120 步的用例，逐步以全量重算校验增量分、候选集与邻域计数。',
          },
          {
            type: 'table',
            head: ['深度', '节点数', '单次搜索耗时'],
            rows: [
              ['2', '29', '157 ms'],
              ['3', '123', '163 ms'],
              ['4', '807', '487 ms'],
              ['5', '2195', '1230 ms'],
            ],
            caption: '中盘 10 子局面。增量评分将「每个叶子重扫全盘」压缩为「仅计算半径 4 内的子」，深度 5 单次搜索降至秒级。',
          },
          {
            type: 'text',
            body: '搜索采用 negamax + alpha-beta，配合 Zobrist 置换表、迭代加深与按静态分排序的候选截断，展开宽度随剩余深度递减（6 / 6 / 8 / 10 / 12 / 14 / 16）。时间预算强制执行，迭代加深超时返回上一层的完整结果，不返回不完整结果。另有两条确定性规则前置：己方可连五时直接落子，对手可连五时优先封堵，避免必胜与必防点因深度不足被漏算。',
          },
        ],
      },
      {
        id: 'agent',
        nav: 'Agent 与难度',
        kicker: '05',
        title: '引擎计算候选，模型负责取舍',
        blocks: [
          {
            type: 'text',
            body: '将棋盘文本交给模型直接输出坐标，实现成本最低，但稳定性最差：15×15 坐标系难以稳定映射，漏看活四与输出非法点为常见问题，实际棋力接近随机。',
          },
          {
            type: 'text',
            body: '因此采用「引擎计算、模型取舍」的分工：搜索输出带攻防棋形标签的候选点，并附「己方落此形成的棋形」与「对手落此形成的棋形」，模型仅在候选范围内按风格取舍并输出解释。返回值做严格校验，越界、超时或非 JSON 结果统一回退至引擎首选。棋力下限由引擎保证，模型只提供取舍倾向与解释。',
          },
          {
            type: 'table',
            head: ['风格', '进攻权重', '防守权重'],
            rows: [
              ['锐攻', '1.0', '0.6'],
              ['均衡', '1.0', '0.95'],
              ['稳固', '0.8', '1.3'],
            ],
            caption: '风格权重直接参与选点打分，而非提示词中的描述性设定。',
          },
          {
            type: 'text',
            body: '难度不通过降低引擎棋力实现，该做法在实际体验中等同于 AI 水平下降。低难度采用近优候选加权随机：分数不低于最优值一定比例的候选进入候选池，噪声系数由入门 0.55 收敛至专家 0，表现为偶发失误而非规则性错误。',
          },
        ],
      },
      {
        id: 'greedy',
        nav: '可学习贪心',
        kicker: '06',
        title: '从手动分值表到棋谱训练的权重',
        blocks: [
          {
            type: 'text',
            body: '贪心策略的评估函数是一张十二项的棋形分值表，初始版本由人工设定（活四 1000 万、冲四 15 万、活三 1500），数值之间只有粗略的倍数关系，缺少数据依据。贪心学习页用棋谱训练这组权重，训练过程经 SSE 推送，页面上可查看每一轮的损失变化。',
          },
          {
            type: 'points',
            items: [
              { k: '19 维特征', v: '8 档己方棋形 + 8 档对方棋形，加邻域、离天元距离与手数占比' },
              { k: '12 个参数', v: '8 个棋形权重、3 个辅助权重与 1 个防守系数，优化器为人工实现的 Adam' },
              { k: '领域约束投影', v: '每轮更新后投影回可行域：空棋形不计分，分值随棋形变强单调递增' },
              { k: '棋谱来源', v: '内置 50 盘 2067 手由双引擎对打生成，另支持 SGF、JSON 与坐标三种格式上传' },
            ],
          },
          {
            type: 'text',
            body: '防守系数的设定经过一次调整。第一版为防守设置 8 个独立权重，训练后全部收敛到 0：样本只有数百条时，对手威胁与己方机会的梯度相互抵消，模型退化为只优化进攻。改为与进攻共用权重、仅保留一个标量 α 后，α 收敛至 1.03，「对手的活三比己方活三略更值得封堵」由数据得出，不再依赖人工设定。',
          },
          {
            type: 'table',
            head: ['指标', '训练前', '训练后'],
            rows: [
              ['实着命中率 top-1', '24.2%', '46.4%'],
              ['前三命中 top-3', '50.3%', '71.9%'],
              ['平均排名', '5.52', '2.52'],
            ],
            caption: '验证集取样本序列末 1/5，按序切分而非随机切分：同一局相邻局面高度相似，随机切分会让命中率虚高。',
          },
          {
            type: 'text',
            body: '早期棋谱由贪心策略加噪声自战生成，每盘仅 13 至 27 手，训练结果仅为对手动分值表的模仿。切换为带搜索的引擎对弈棋谱后，同一套代码的 top-1 从 24.2% 提升至 46.4%。这三项指标衡量的是对棋谱的复现程度，而非实际棋力；实际对局表现可在竞技场中查看「学习型贪心」档位。',
          },
        ],
      },
      {
        id: 'limits',
        nav: '未采用的方案',
        kicker: '07',
        title: '价值网络的实测结论与未采用原因',
        blocks: [
          {
            type: 'text',
            body: '网络结构为 34 维特征 → 48 → 24 → 1，共 2881 个参数；前向传播由人工实现 math.tanh 与矩阵乘法，运行时无需 numpy，避免为不足三千参数的模型引入数十兆依赖。训练采用蒸馏：深度 3 的搜索引擎自对弈产生局面，引擎实际落子为正样本、随机抽取的合法点为负样本，使用二元交叉熵拟合；DAgger 继续训练的脚本保留在 tools/ 下，实验可复现。',
          },
          {
            type: 'table',
            head: ['竞技场策略', '实现', '定位'],
            rows: [
              ['随机 / 贪心', '手工分值表，无搜索', '基线'],
              ['学习型贪心', '棋谱训练出的 12 参数分值表', '复现棋谱，不保证棋力'],
              ['神经网络', '网络打分取 Top-K，逐点试下并评估对手最强应手', '强于纯贪心，弱于带搜索的引擎'],
              ['极小极大', '棋形评估 + alpha-beta 搜索', '主线对弈引擎'],
            ],
            caption: '竞技场五档策略。神经网络与带搜索引擎的差距可直接对照。',
          },
          {
            type: 'text',
            body: '网络策略并非仅按分值落子：按分数取 Top-K 候选逐点试下，再用网络评估对手的最强应手，取净价值最高的一手，对手应手分按 0.75 折算，因为对手未必能够落子。即便如此，它仍不敌带搜索的引擎，评估函数无法替代搜索。',
          },
          {
            type: 'text',
            body: '另尝试以网络缩小搜索宽度，两组对照均为负向收益：第一版采用硬剪枝，以网络 Top-12 作为根节点候选池，同预算下劣于不剪枝；第二版仅在静态分相同时以网络作为 tie-break，结果同样更差。诊断结果显示：以深度 5 全量搜索的根节点最优手为标准，网络 Top-12 与静态 Top-12 的命中率均为 100%，两列表重合 70%。网络未漏掉最优手，但它补充的三成落点质量更低，由网络决定宽度等于以较差落点替换静态排序中的优质落点。',
          },
          {
            type: 'points',
            items: [
              { k: '结论', v: '评估函数无法替代搜索。相关数据已纳入算法竞技场，可直接复现' },
              { k: '保留内容', v: 'train_net.py、DAgger 脚本与诊断脚本 diagnose_prior.py 均保留在仓库中，可复现实验' },
              { k: '当前缺口', v: '三手交换、五手两打等赛制流程尚未实现；网页对局的规则层完整，流程层缺失' },
            ],
          },
        ],
      },
      {
        id: 'ops',
        nav: '工程与部署',
        kicker: '08',
        title: '上线后暴露的问题',
        blocks: [
          {
            type: 'points',
            items: [
              { k: '网关覆盖鉴权头', v: '分享网关为每个请求注入自身的 Authorization，登录态静默失效' },
              { k: 'token 多通道读取', v: '按 cookie、query、自定义头、标准头的顺序读取，并写入 SameSite=Lax' },
              { k: '产物目录改名', v: '托管平台将 dist、build、out 视为构建输出并剔除，前端产物目录改为 web/site' },
              { k: 'WAF 误判源码', v: '代码工坊提交的模板被判定为注入并拦截，传输层提供 b64 备用通道重发' },
            ],
          },
          {
            type: 'text',
            body: '可观测性模块为自行实现的 340 行代码，未引入第三方库：指标输出 Prometheus 文本格式，日志为携带请求 id 的单行 JSON，限流按固定窗口分桶。指标标签仅按路由模板打点，不按真实路径；每个对局生成一个新 id，若按真实路径打点，时间序列将只增不减。测试分为两部分：453 项后端测试由脚本自行启动服务与临时数据库，181 项浏览器走查经 CDP 派发真实鼠标事件，覆盖五个宽度的横向溢出复检。',
          },
        ],
      },
    ],
  },
  {
    id: 'station',
    accent: '#D9804F',
    accentInk: 'dark',
    slug: 'station',
    title: '菜鸟驿站快递管理系统',
    category: '系统设计',
    year: '2024',
    period: '2024.09 — 2024.12',
    image: asset('/media/project-station-v2.webp'),
    tag: 'C11 · 零依赖',
    description: '管理员与顾客双角色校园快递站系统，按界面、认证、业务三层实现。',
    role: '独立完成',
    stack: 'C11 · 控制台可视化',
    site: 'https://wbapp-2l4ctx9mw2v4jrjpylnkws.app.workbuddy.host/?sharecode=KLVZBRJP3O',
    lede: '系统以 C 语言实现，仅依赖标准库与控制台 API。业务规则、状态流转与界面分层组织，命令行下维持清晰的信息层级。',
    metrics: [
      { value: '0', label: '第三方依赖' },
      { value: '7', label: '功能模块分层' },
      { value: '4', label: '包裹状态位' },
      { value: '6', label: '计费规则组合' },
      { value: '3', label: '天 超时判定阈值' },
      { value: '5', label: '种运行方式' },
    ],
    github: 'https://github.com/2676136489-png/Cainiao-Station',
    chapters: [
      {
        id: 'brief',
        nav: 'C 语言选型',
        kicker: '01',
        title: '依赖降至最低，复杂度集中于业务',
        blocks: [
          {
            type: 'text',
            body: '课程设计通常停留在可运行的单文件练习，本项目采用相反的路径：依赖压缩到 C 标准库与控制台 API，复杂度投入业务本身，包括计费规则、状态流转、权限边界与持久化格式。',
          },
          {
            type: 'points',
            items: [
              { k: '零依赖', v: '仅 C 标准库与控制台 API，不需要任何第三方组件即可编译' },
              { k: '可视化', v: '带边框、颜色、统计面板、数据表格与物流轨迹图的控制台界面' },
              { k: '可读数据', v: 'data/ 下以文本保存用户、包裹与日志，而不是二进制结构体' },
            ],
          },
        ],
      },
      {
        id: 'billing',
        nav: '计费模型',
        kicker: '02',
        title: '计费规则与费用构成',
        blocks: [
          {
            type: 'text',
            body: '运费并非简单的乘积计算。它由寄送方式（标准 / 加急）、距离（省内 / 省外）与重量三档共同决定首重与续重，再叠加价值加成与保价费，六条规则组合为六种情形。',
          },
          {
            type: 'table',
            head: ['场景', '计费规则'],
            rows: [
              ['标准 / 省内', '首重 10 元，续重 2 元/kg'],
              ['标准 / 省外', '首重 12 元，续重 5 元/kg'],
              ['加急 / 省内', '首重 12 元，续重 2 元/kg'],
              ['加急 / 省外', '首重 22 元，续重 8 元/kg'],
              ['高价值商品', '价值 ≥ 1000 元，总运费 × 1.1'],
              ['保价', '保费 2 元；价值 ≥ 1000 元再加 (价值 - 1000) × 0.003 元'],
            ],
            caption: '运费规则表。寄件时逐项计算并展示明细，不直接给出总价。',
          },
          {
            type: 'text',
            body: '寄件界面会拆分展示基础运费、续重费、高价值加成与保价费。用户在确认前即可查看费用构成，而非仅获得总价。',
          },
        ],
      },
      {
        id: 'states',
        nav: '状态机',
        kicker: '03',
        title: '四个比特描述一个包裹',
        blocks: [
          {
            type: 'text',
            body: '包裹状态未直接套用枚举，而是拆分为四个彼此正交的状态位。其优势在于组合自由：一个包裹可以同时处于运输中、完好、未送达与正常计费状态，无需为每种组合定义枚举值。',
          },
          {
            type: 'table',
            head: ['状态位', '含义'],
            rows: [
              ['state[0]', '在库 / 已出库 / 运输中'],
              ['state[1]', '完好 / 有损'],
              ['state[2]', '运输中 / 已送达'],
              ['state[3]', '正常 / 超时滞留'],
            ],
            caption: '包裹状态位设计。四个位互相独立，覆盖完整生命周期。',
          },
          {
            type: 'text',
            body: '时间维度上有两条自动流转规则：入库超过 3 天未取件标记为超时滞留；运输超过 3 天自动模拟送达并转为待取件。程序启动时执行一次业务仿真，推进所有到期的状态变更。',
          },
        ],
      },
      {
        id: 'roles',
        nav: '双角色闭环',
        kicker: '04',
        title: '管理员与顾客看到的是两个系统',
        blocks: [
          {
            type: 'arch',
            groups: [
              {
                title: '用户端',
                items: ['注册 / 登录 / 注销', '寄件并查看运费明细', '凭 4 位取件码取件，支持代取', '包裹轨迹时间线', '站内消息（到站 / 超时 / 取件确认）'],
              },
              {
                title: '管理端',
                items: ['概览：用户数、包裹数、待取件、累计运费', '入库：自动建议编号与取件码', '出库：按单号出库并同步消息', '多条件查询与库存清单', '注销用户（级联清理名下包裹）'],
              },
              {
                title: '数据模型',
                items: ['User：环形消息缓冲区 + 名下包裹链表', 'Package：编号、取件码、运费、状态数组', 'Manager：管理员账号'],
              },
              {
                title: '边界处理',
                items: ['注销前校验是否存在未完成包裹', '统一封装字符串 / 整数 / 浮点读取', '输入校验与缓冲区清理', 'data/ 不存在时自动生成演示数据'],
              },
            ],
          },
        ],
      },
      {
        id: 'engineering',
        nav: '工程取舍',
        kicker: '05',
        title: '文本持久化与单文件分发',
        blocks: [
          {
            type: 'text',
            body: '持久化采用文本文件，而非二进制结构体写入。代价是解析稍复杂，收益是数据可读、可 diff、可人工修复，并规避结构体对齐在不同编译器与平台上的差异。验收人员可直接打开 data/users.txt 核对。',
          },
          {
            type: 'text',
            body: '源码按 model / data / ui / auth / user / manager 六个模块分层，但仓库根目录同时保留一份合并生成的 main.c。该文件不是人工复制的副本：tools/build_single_file.py 会扫描 src/ 自动生成，修改源码后执行一次脚本即可同步，避免出现两份不一致的代码。',
          },
          {
            type: 'points',
            items: [
              { k: '一份源码入口', v: 'src/ 是唯一真源，main.c 由脚本合并生成' },
              { k: '免配置编译', v: '仓库根目录附带便携编译器，运行 run.bat 即可启动' },
              { k: '多入口支持', v: 'Visual Studio 解决方案、VS Code 任务、Makefile 与命令行脚本均可编译' },
              { k: '纯 C 约束', v: '历史遗留的 .cpp 文件移至 legacy_replaced/ 备份，不参与编译' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'wiki',
    accent: '#8B9BC4',
    accentInk: 'dark',
    slug: 'wiki',
    title: 'iGEM Glass Wiki 插件',
    category: 'Web 组件',
    year: '2026',
    period: '2026.07',
    image: asset('/media/project-wiki-v2.webp'),
    tag: 'HTML · CSS · JavaScript',
    description: '面向 iGEM 团队的多页面 Wiki 模板，采用静态优先架构，附可复用界面与交互插件。',
    role: '独立开发',
    stack: '静态 HTML · 可选 PHP include',
    lede: '面向 iGEM 团队的多页面 Wiki 模板。19 个页面共用一套设计系统，9 个交互插件均提供独立示例页。无需构建，可直接在浏览器中打开。',
    metrics: [
      { value: '19', label: '页面' },
      { value: '9', label: '可复用插件' },
      { value: '10', label: '竞赛交付页' },
      { value: '3', label: 'PHP 片段' },
      { value: '1', label: '份设计系统 CSS' },
      { value: '0', label: '构建步骤' },
    ],
    github: 'https://github.com/2676136489-png/wiki-plugin',
    chapters: [
      {
        id: 'brief',
        nav: '真实约束',
        kicker: '01',
        title: '竞赛 Wiki 的交付约束',
        blocks: [
          {
            type: 'text',
            body: 'iGEM Wiki 对交付环境有明确约束：最终内容、图片、脚本与样式必须全部纳入 iGEM 指定的 GitLab 仓库，评审在该环境中访问页面。任何依赖 Node 构建、CDN 资源或外部服务的方案都会在交付阶段失效，因此模板采用静态优先架构。',
          },
          {
            type: 'points',
            items: [
              { k: '离线可用', v: '全部素材随仓库交付，页面可直接打开，不依赖构建产物' },
              { k: '便于交接', v: '接替成员无需配置本地环境，修改 HTML 后即可提交仓库' },
              { k: '合规可追溯', v: '保留 attribution 与 license 页脚，占位内容均标注待替换' },
            ],
          },
        ],
      },
      {
        id: 'map',
        nav: '页面地图',
        kicker: '02',
        title: '十个交付页，对应评审路径',
        blocks: [
          {
            type: 'text',
            body: '页面按评审阅读顺序组织：项目描述、设计、建模、工程与结果，随后为安全、人类实践、贡献与 attribution。每页对应评审表格中的一项，团队无需自行判断内容归属。',
          },
          {
            type: 'arch',
            groups: [
              {
                title: '核心叙事',
                items: ['description 项目描述', 'engineering 工程', 'model 建模', 'results 结果'],
              },
              {
                title: '责任与合规',
                items: ['safety 安全', 'human-practices 人类实践', 'contribution 贡献', 'attributions 署名'],
              },
              {
                title: '团队与组件',
                items: ['team 团队', 'components 部件', 'plugin-all 插件总览'],
              },
              {
                title: '共享片段',
                items: ['includes/nav.php', 'includes/footer.php', 'includes/config.php'],
              },
            ],
          },
        ],
      },
      {
        id: 'plugins',
        nav: '插件清单',
        kicker: '03',
        title: '九个可独立复用的交互模块',
        blocks: [
          {
            type: 'text',
            body: '每个插件均为独立页面，附带示例与使用说明。团队可按需引入对应的 HTML 与 JavaScript 初始化片段，无需为单一滚动效果引入整套框架。',
          },
          {
            type: 'table',
            head: ['插件', '用途'],
            rows: [
              ['command-palette', '⌘K 唤起，通过单一入口跳转全部页面'],
              ['scrollytelling', '滚动驱动的分步叙事，用于说明实验流程'],
              ['evidence-filter', '按标签实时筛选证据卡片'],
              ['floating-dock', '移动端底部悬浮导航'],
              ['glossary', '科技术语悬浮释义'],
              ['magnetic-cards', '卡片跟随指针的磁吸反馈'],
              ['comparison', '方案横向对比表'],
              ['particles', '动态粒子背景'],
              ['plugin-all', '全部插件的集中演示页'],
            ],
            caption: '九个插件页共享同一套设计系统，视觉风格保持一致。',
          },
          {
            type: 'text',
            body: '通用交互统一由 assets/js/main.js 提供，包括移动端导航、主题切换、阅读进度条、标签页、折叠面板、滚动揭示与数字滚动。页面通过 class 声明式启用，无需重复编写脚本。',
          },
        ],
      },
      {
        id: 'choices',
        nav: '工程取舍',
        kicker: '04',
        title: '静态优先，PHP 为可选扩展',
        blocks: [
          {
            type: 'text',
            body: '仓库根目录为可直接打开的静态站点，同时在 includes/ 下提供 nav.php、footer.php 与 config.php 三个片段。需要复用公共导航的团队可通过 PHP include 引入；不需要的团队可在各页独立维护。两种方式均不影响静态版本的独立运行。',
          },
          {
            type: 'points',
            items: [
              { k: '统一设计源', v: 'assets/css/style.css 统一管理色板、圆角、阴影与组件，修改后全局生效' },
              { k: '统一脚本源', v: 'assets/js/main.js 承载全部通用交互，页面以声明式方式接入' },
              { k: '降低维护成本', v: '成员无需理解构建工具，修改 HTML 与 Markdown 式内容即可' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'portfolio',
    accent: '#191D22',
    accentInk: 'light',
    slug: 'portfolio',
    title: '个人作品集',
    category: '前端开发',
    year: '2026',
    period: '2026.07 — 2026.11',
    image: asset('/media/project-dashboard-v2.webp'),
    tag: 'React 19 · Vite 6',
    description: '黑底 3D 视觉作品集，十个作品共用一份数据与一套详情渲染，源码发布至两个域名。',
    role: '独立开发 · AI 辅助工程',
    stack: 'React 19 · Vite 6 · 手写 CSS',
    lede: '站点采用内容同源、详情共用渲染与双链路部署的结构。视觉层已整体重做，数据与渲染逻辑保持单一来源。',
    metrics: [
      { value: '10', label: '个收录作品' },
      { value: '66', label: '张 WebP 素材' },
      { value: '2', label: '个线上域名' },
      { value: '4', label: '类自动化验证' },
    ],
    github: 'https://github.com/2676136489-png/personal-design',
    site: 'https://lukeyu-portfolio.app.workbuddy.host/?sharecode=VQRU7WNFFG',
    chapters: [
      {
        id: 'arch',
        nav: '信息架构',
        kicker: '01',
        title: '十个作品，一套详情渲染',
        blocks: [
          {
            type: 'text',
            body: '首页用于快速判断方向。十个作品位于后半段，任一作品的详情页均由同一套章节渲染器排版。',
          },
          {
            type: 'text',
            body: '路由为自实现的 hash 解析，未引入 react-router。章节数据集中维护在 data.js，六种块类型覆盖正文、要点、表格、截图、代码与架构分组。',
          },
          {
            type: 'points',
            items: [
              { k: '首页', v: '八个板块按阅读顺序排列，首屏仅呈现项目' },
              { k: '作品', v: '十张堆叠卡共用一份数据，详情页无需重复编写' },
              { k: '内页', v: '全部作品、方向聚合、简历页复用同一条路由' },
              { k: '锚点', v: '能力与关于是首页板块，URL 带锚点可直接跳转' },
            ],
          },
        ],
      },
      {
        id: 'design',
        nav: '设计语言',
        kicker: '02',
        title: '纯黑背景、大字号与留白',
        blocks: [
          {
            type: 'text',
            body: '上一版为浅色风格，当前整站采用纯黑背景：标题使用 Kanit 超大字重，以字号与留白建立层级。',
          },
          {
            type: 'text',
            body: '强调色仅用于渐变标题与主按钮。正文采用灰蓝色，分隔线为 1px 半透明线，不使用多层阴影。',
          },
          {
            type: 'arch',
            groups: [
              {
                title: '字体',
                items: ['Kanit 300 到 900 自托管', '标题 900、正文 400', '负字距 -0.035em', '不依赖 Google Fonts'],
              },
              {
                title: '色彩',
                items: ['页面 #0c0c0c', '正文 #d7e2ea', '强调只用一条渐变', '白底区做反差'],
              },
              {
                title: '版面',
                items: ['标题最大 160px', '导航 64px 固定顶栏', '章节之间用大留白', '窄屏换一套版式'],
              },
              {
                title: '删除项',
                items: ['彩色光斑', '玻璃拟态', '多层阴影', '装饰网格'],
              },
            ],
          },
          {
            type: 'text',
            body: '白底区用于分隔长内容，并非主题切换。能力与简历置于此区，黑底区仅保留作品与首屏。',
          },
        ],
      },
      {
        id: 'motion',
        nav: '动效层',
        kicker: '03',
        title: '动效随滚动触发',
        blocks: [
          {
            type: 'text',
            body: '进场动画由 Framer Motion 的 whileInView 驱动，离开视口后停止执行。滚动带是唯一常驻循环，帧率由单一 requestAnimationFrame 驱动。',
          },
          {
            type: 'table',
            head: ['动效', '实现'],
            rows: [
              ['进场', 'FadeIn 只触发一次，位移不超过 40px'],
              ['首屏主视觉', 'Magnet 跟随鼠标，最大位移约三分之一'],
              ['关于段落', 'AnimatedText 按字显影，区间限定在进度 0 到 0.9'],
              ['作品堆叠', 'sticky 卡片随滚动逐层缩放，偏移按总数均分'],
              ['滚动带', '双行反向，鼠标进入只冻结当前行'],
            ],
          },
          {
            type: 'text',
            body: '启用 prefers-reduced-motion 时，滚动带速度归零，进场动画退化为静态。',
          },
        ],
      },
      {
        id: 'assets',
        nav: '素材与性能',
        kicker: '04',
        title: '33.9MB 源图压缩至 3.3MB',
        blocks: [
          {
            type: 'text',
            body: '截图源文件保留在 media-src，公开目录仅保留 WebP。66 张素材合计 3.3MB，源图 33.9MB。',
          },
          {
            type: 'points',
            items: [
              { k: '转换', v: '脚本批量转 WebP，作品卡素材统一压到 1400 宽' },
              { k: '尺寸', v: '为每张图声明 width 与 height，避免加载完成后的布局偏移' },
              { k: '加载', v: '首屏主视觉直接加载，其余图片懒加载' },
              { k: '唯一性', v: '十张作品卡的三格素材互不重复，未用封面重复填充' },
            ],
          },
          {
            type: 'text',
            body: '对于没有线上界面的项目，以章节名与实测数据构建信息面板，不重复使用同一张封面。',
          },
        ],
      },
      {
        id: 'deploy',
        nav: '双域名部署',
        kicker: '05',
        title: '同一份源码，两种基路径',
        blocks: [
          {
            type: 'text',
            body: '主站部署于 WorkBuddy，镜像站为 GitHub Pages 项目站。两边基路径不同，构建参数不能硬编码。',
          },
          {
            type: 'text',
            body: 'Vite 仅改写 HTML 与 import 的路径，JavaScript 字符串中的图片地址需显式拼接 BASE_URL，否则子路径部署会出现批量 404。',
          },
          {
            type: 'code',
            lang: 'js',
            caption: 'src/data.js：让图片路径感知部署基路径。',
            lines: [
              'const BASE = import.meta.env.BASE_URL;',
              "export const asset = (path) => `${BASE}${path.replace(/^\\//, '')}`;",
              '',
              "// 主站拼出 /media/...，Pages 拼出 /personal-design/media/...",
              "image: asset('/media/project-gomoku-v2.webp'),",
            ],
          },
          {
            type: 'text',
            body: 'GitHub Pages 由脚本构建至 dist-pages，再推送至 gh-pages 分支。主分支仅保留源码，构建产物不纳入版本库。',
          },
        ],
      },
      {
        id: 'interaction',
        nav: '交互细节',
        kicker: '06',
        title: '交互细节与取舍',
        blocks: [
          {
            type: 'points',
            items: [
              { k: '滚动带', v: '指针进入某一行时仅暂停该行，移出后恢复原速' },
              { k: '堆叠卡', v: '锚点跳转保留 76px 顶部间距，标题不被固定导航遮挡' },
              { k: '移动端', v: '窄屏下导航横向滚动，堆叠卡改为单列' },
              { k: '联系', v: '邮箱与电话使用 mailto 与 tel，不额外提供表单' },
              { k: '回退', v: '旧版外观保留在隐藏参数中，回归测试仍可执行' },
            ],
          },
          {
            type: 'text',
            body: '旧版入口不向访客展示，仅用于承载 SSR 断言，并可在出现问题时快速回退。',
          },
        ],
      },
    ],
  },
];

/* projects 定义完了，现在把方向索引补上真实项目。
   必须在这里调：categories 在模块加载时建的是空壳。 */
fillCategories(projects);

export const capabilities = [
  {
    title: 'AI 原生开发',
    text: '大模型参与需求拆解、架构设计与代码迭代，覆盖设计至交付的流程。',
    tags: ['LLM / RAG', 'Agent / MCP', 'Prompt Engineering'],
  },
  {
    title: '工程与算法',
    text: '以 C/C++ 算法与数据结构为基础，延伸至 Python 服务端与 PHP / MySQL 后端。',
    tags: ['C / C++', 'FastAPI · Docker', 'PHP · MySQL'],
  },
  {
    title: '前端与界面',
    text: '使用 TypeScript、React 与 Vite 构建界面，设计信息层级与操作路径。',
    tags: ['React · TypeScript', 'Vite', 'SSE'],
  },
  {
    title: '组织与推进',
    text: '将需求拆解为可执行任务，明确优先级与验收标准，推进至交付。',
    tags: ['沟通协调', '任务拆解', '团队协作'],
  },
];

export const achievements = [
  { title: '吉林大学三等奖学金', meta: '2024 — 2025 学年' },
  { title: '校优秀学生干部', meta: '2024 — 2025 学年' },
  { title: '数学建模竞赛省级三等奖', meta: '2025' },
  { title: '大学英语四级 CET-4', meta: '已通过' },
  { title: '专业排名前 30%', meta: 'GPA 3.1 / 4' },
  { title: 'GitHub 开源仓库', meta: '9 个' },
];

/* 关于区的时间线。按项目体量排，不按时间 —
   排序按的是「线上在跑 + 有多章详解 + 规模」，所以 OpsPilot 和
   AI 研究工作台排在最前，竞赛插件和课程作业压到后面。 */
export const timeline = [
  {
    year: '2026',
    title: 'OpsPilot · AI 事故响应系统',
    text: '状态机驱动的 Agent 覆盖告警发现至复盘的九个环节。系统含 15 个图节点、22 个工具与 135 个后端测试。支持在线注入故障并演示完整处理流程。',
  },
  {
    year: '2026',
    title: 'AI 研究工作台',
    text: '研究流程拆分为 7 步流水线，256 个后端测试覆盖四道失控防护机制。',
  },
  {
    year: '2026',
    title: '网页设计档案',
    text: '21 个独立页面整合为统一索引，按整页、区块、动效、加载四类切换查看。',
  },
  {
    year: '2026',
    title: 'Lumora · 区块插件库',
    text: '197 个可复用区块按 22 个分类整理，每个区块附源码与提示词。',
  },
  {
    year: '2026',
    title: '校园圈子',
    text: '实名社交平台，架构、实现与部署独立完成，线上运行，19 位实名学生。',
  },
  {
    year: '2026',
    title: '五子棋对弈引擎 Gomoku Match',
    text: '由单文件 C++ Bot 扩展为对弈平台，涵盖连珠禁手判定、递归棋形识别与 alpha-beta 搜索。棋谱训练用于可学习贪心与候选点决策 Agent。已上线，支持在线对弈。',
  },
  {
    year: '2026',
    title: '个人作品集',
    text: '本站采用同一份构建产物，发布至 GitHub Pages 子路径与云托管根路径。两处内容保持一致。',
  },
  {
    year: '2024',
    title: '菜鸟驿站快递管理系统',
    text: '独立完成 C 语言系统项目，从数据结构设计到业务流程实现。',
  },
  {
    year: '2024',
    title: '进入吉林大学',
    text: '计算机科学与技术本科，GPA 3.1 / 4，专业排名前 30%。',
  },
];
