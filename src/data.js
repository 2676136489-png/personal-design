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
  '/media/hero-3d-object.webp': [839, 743],
  '/media/campus-desktop.webp': [1216, 832],
  '/media/campus-phone.webp': [832, 1216],
  '/media/campus/admin-accounts.webp': [2321, 1189],
  '/media/campus/admin-audit.webp': [2252, 1274],
  '/media/campus/admin-comments.webp': [2142, 1123],
  '/media/campus/admin-dynamics.webp': [2231, 1290],
  '/media/campus/admin-messages.webp': [2273, 1293],
  '/media/campus/admin-overview.webp': [2558, 1289],
  '/media/campus/admin-reports.webp': [2175, 1089],
  '/media/campus/admin-students.webp': [2319, 1228],
  '/media/campus/ai-assistant-overview.webp': [1920, 962],
  '/media/campus/ai-assistant.webp': [454, 776],
  '/media/campus/dashboard-1960.webp': [1960, 989],
  '/media/campus/feed.webp': [2559, 1283],
  '/media/campus/login.webp': [2559, 1256],
  '/media/campus/students.webp': [2146, 1183],
  '/media/project-checkin.webp': [1400, 933],
  '/media/project-dashboard.webp': [1400, 960],
  '/media/project-gomoku.webp': [1400, 933],
  '/media/project-identity.webp': [1400, 960],
  '/media/project-opspilot.webp': [1400, 933],
  '/media/project-research.webp': [1400, 933],
  '/media/project-station.webp': [1400, 960],
  '/media/project-wiki.webp': [1385, 950],
  '/media/resume/resume-900.webp': [900, 1274],
  '/media/resume/resume.webp': [1588, 2248],
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
  tagline: '独立完成设计、开发与上线，把想法交付成可运行的系统。',
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
  { label: '收录作品', value: '9 个' },
  { label: '线上运行中', value: '6 个' },
  { label: '校园圈子用户', value: '19 位' },
  { label: '自动化测试', value: '4 类' },
];

/* 简历页数据：与 简历/卢柯宇简历_2026.md 逐条对齐。
   改简历时这里要同步改，否则线上简历页会和 PDF 对不上。 */
export const resume = {
  updated: '2026 年 11 月',
  summary:
    '吉林大学计算机科学与技术专业 2028 届本科生。数据结构、计算机组成原理、操作系统等 408 核心课已修，计算机网络在修，另有算法设计与分析、计算机系统结构两门扩展课程。',
  education: [
    {
      school: '吉林大学',
      major: '计算机科学与技术 · 本科',
      period: '2024.09 - 2028.06',
      gpa: 'GPA 3.1 / 4',
      points: [
        '专业排名前 30%',
        '核心课程：数据结构、计算机组成原理、操作系统、计算机网络（在修）、算法设计与分析、计算机系统结构',
      ],
    },
  ],
  skillGroups: [
    ['Agent / LLM', 'LangGraph（StateGraph、条件边、interrupt 中断）、Dify 自定义工具、Tool Calling、RAG 检索与降级'],
    ['语言', 'Python、PHP、SQL'],
    ['后端', 'FastAPI、MySQL、SQLite、REST、SSE'],
    ['前端', 'React 19、TypeScript、Vite、原生 CSS、Canvas / SVG'],
    ['算法', 'alpha-beta 搜索、置换表与迭代加深、棋形识别、落点价值网络与可学习贪心的训练'],
    ['测试与部署', 'pytest、PHPUnit、Playwright、DevTools 协议；Docker Compose、GitHub Actions、Apache 部署、版本化迁移、健康检查与每日备份'],
  ],
  honors: [
    { title: '吉林大学三等奖学金', period: '2024.09 - 2025.09' },
    { title: '吉林大学校优秀学生干部', period: '2024.09 - 2025.09' },
    { title: '全国大学生数学建模竞赛省级三等奖', period: '2025.09' },
    { title: '大学英语四级（CET-4）', period: '' },
  ],
  /* 「个人优势」四条，取自简历源（简历制作/outputs/卢柯宇简历_2026.md）的
     个人简述段，一句一条。断言要求每条都能在新 PDF 抽出的文本里逐字找到，
     所以这里只做按句切分，不改写、不增删字。
     简历源文件改了这一段，这里要同步换 —— 网页与 PDF 是同一份材料的两份形态。 */
  advantages: [
    '吉林大学计算机科学与技术专业 2028 届本科生',
    '数据结构、计算机组成原理、操作系统等 408 核心课已修',
    '计算机网络在修，另有算法设计与分析、计算机系统结构两门扩展课程',
  ],
  /* 简历页只列 PDF 里出现过的那几个项目，与投递版本保持一致。
     顺序按简历原文：校园圈子 → AI 研究 → 五子棋 → 个人作品集。 */
  projectSlugs: ['campus', 'research', 'gomoku', 'portfolio'],

  /* 简历上每个项目那一行的参与口径，与 PDF 标题行括号里的定位逐字一致。
     源：outputs/卢柯宇简历_2026.md，2026-11 重写后按「系统约束」定位项目，
     不再写「Vibe Coding」—— PDF 上没有这个词，页面对不上会被读成两份材料。
     仍然不用 projects[].role：那是详情页口径（「独立开发 · 架构与实现」）。 */
  projectMeta: {
    campus: '数据层与鉴权 · 问答边界',
    research: '状态机 · 异步 · 降级',
    gomoku: '搜索 · 评估 · Agent 分层',
    portfolio: '静态交付 · 双环境',
  },
  /* 每个项目下的分点技术描述，与 PDF 上的项目经历逐条一致（逐字复制自 md 源）。
     为什么不用 projects[].lede：
     lede 是项目详情页的引子，语气是散文，讲的是「为什么做这个」；
     简历要的是「做了什么、怎么做的」，读者是 HR 与面试官。
     改简历先改 md 与 PDF，再把 md 的分点逐字搬进来。 */
  projectHighlights: {
    campus: [
      '独立实现 54 个页面脚本与 27 个公共模块（PHP 约 1.3 万行），覆盖实名审核、动态广场、站内私信、举报处理与运营后台。',
      '数据访问全部走 MySQLi 预处理，鉴权分 bcrypt、CSRF、验证码、登录频控四层，管理员启用 TOTP。',
      '问答能力限定在接口层：学生端与管理端拆为两个只读查询接口，经 API Key 校验注册为 Dify 工具；写操作二次校验角色，权限判定不依赖模型输出。',
      '表结构演进走 18 个版本化迁移，PHPUnit 与 17 组 Playwright 用例覆盖登录、私信与后台改密；部署于阿里云，配健康检查与每日备份，已上线运行，19 名实名用户。',
    ],
    research: [
      'LangGraph StateGraph 把研究流程建模为「拆解 → 计划 → 检索 → 分析 → 核查」的 7 节点有向状态图；核查未通过经条件边回流，迭代与核查均设上限，避免自证循环。',
      '报告生成前 interrupt 等待人工确认，结论强制绑定证据编号；未标注内容列为「未经证据核对」。256 项 pytest 覆盖状态流转、中断恢复与边界场景。',
      '长任务撞网关超时：图执行转后台异步任务、接口即时返回；前端以 SSE 为主，配 6 秒看门狗，超时降级 2.5 秒轮询。',
      '固定相似度阈值经实测弃用（无关 0.473、相关 0.441），改为检索不可用时回退联网并标注原因。',
    ],
    gomoku: [
      '按国际连珠规则实现禁手判定（三三 / 四四 / 长连，递归深度两层），落点取中心 11 格线做递归棋形识别；评分为增量式，仅重算半径 4 内受影响点位。',
      '搜索采用 Negamax + alpha-beta，配 Zobrist 置换表、迭代加深与逐层递减的展开宽度；时间预算硬性生效，超时回退上一层完整结果，连五、堵五等确定性规则前置。深度 5 实测 2195 节点、1.23 秒。',
      'LLM Agent 分层：引擎输出带攻防棋形标签的可信候选点，模型仅在候选集内做风格取舍并给出解释；越界、超时或非 JSON 回退引擎首选，难度由近优候选加权随机实现。',
      '另训 2881 参数落点价值网络（34 → 48 → 24 → 1，搜索引擎蒸馏），竞技场实测强于纯贪心、弱于带搜索的引擎，评估函数替代不了搜索。配套 453 项后端测试与 181 项浏览器走查。',
    ],
    portfolio: [
      'hash 路由与转场手写，未引入第三方路由与 UI 组件库；9 个项目按「约束 / 方案 / 实测」组织。',
      '一套源码双环境部署，图片转 WebP 两档，首屏 1 MB 内。部署与图片管线脚本进仓库，README 配图每次发布前重抓。',
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
  '品牌视觉': { slug: 'brand', blurb: '按场景建立克制的视觉方向。' },
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
  headline: '一个正在运行的校园社交平台。',
  lede: '实名认证、实时私信、敏感词过滤与运营后台均已实现，目前在线运行。',
  cover: asset('/media/campus/dashboard-1960.webp'),

  /* 首页精选网格里用的 AI 助手整屏截图。
     详情页第 3 章放的是对话特写（那张是竖图，塞进横向网格会变成一条细条），
     首页需要横版，所以单独留一张。 */
  featuredAssistantShot: {
    src: asset('/media/campus/ai-assistant-overview.webp'),
    alt: '校园圈子 AI 助手整屏界面',
    caption: 'AI 助手整屏：对话区支持多轮追问，回答前会标注实际调用的查询工具。',
  },

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
      title: '为什么做一个校园社交平台',
      blocks: [
        {
          type: 'text',
          body: '校园信息分散在班级群、公告栏与熟人转发里：失物招领、社团招新、求助都缺少统一入口。这个项目以实名身份组织内容，所有用户需通过审核，每条内容可追溯到发布者。',
        },
        {
          type: 'text',
          body: '技术重点因此集中在身份核验、内容治理与真实负载三处。',
        },
        {
          type: 'points',
          items: [
            { k: '可信身份', v: '注册后需管理员核验学生证，通过才能发布内容' },
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
      title: '学生端：从登录到找同学',
      blocks: [
        {
          type: 'text',
          body: '学生端按「登录 → 浏览动态 → 查找同学 → 发起私信」的路径组织。登录页左右分栏：左侧以同心圆雷达表达「发现同校的人」，右侧为登录表单，包含图形验证码与协议勾选。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/login.webp'),
          alt: '校园圈子学生登录页',
          caption: '登录页：左侧品牌区用同心圆雷达表达「认识同校的人」，右侧表单含图形验证码、用户协议勾选与管理员入口。',
        },
        {
          type: 'text',
          body: '首屏信息密度较高：实名状态、动态数、未读通知、未读私信四项数据置于顶部，下方为校园公告与快捷操作，进入后即可判断待处理事项。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/dashboard-1960.webp'),
          alt: '校园圈子学生中心',
          caption: '学生中心：左侧固定导航（学生中心 / 动态广场 / 同学），顶部实名状态胶囊，四格数据卡与校园公告。',
        },
        {
          type: 'text',
          body: '动态广场是使用频率最高的页面，支持按关键词、标签、学院三重筛选，右侧固定发布入口与广场公约。动态支持最多三张图片、#话题 自动识别、收藏与草稿自动保存；评论可指定回复对象并触发通知。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/feed.webp'),
          alt: '校园圈子动态广场',
          caption: '动态广场：三重筛选（关键词 / 标签 / 学院）、共 17 条动态计数、右侧发布区与广场公约。',
        },
        {
          type: 'text',
          body: '「同学」页以卡片列出 19 位实名用户，展示姓名、性别、兴趣标签、学院、年级与专业，并按学院、年级、共同标签推荐，支持关注与取关。这一步把账号对应到具体的人。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/students.webp'),
          alt: '校园圈子已认证同学列表',
          caption: '同学页：实名认证同学列表，含兴趣标签、学院、年级、专业，支持按姓名/学院/专业与兴趣标签双向搜索。',
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
          body: '站内 AI 小助手基于 Dify 搭建：将查询接口注册为自定义工具，模型通过 Tool Calling 读取真实数据，回答中会显示「已使用 queryCampusInfo」的调用记录。支持用自然语言查询同学、动态与公告，对无结果的问题直接返回未找到。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/ai-assistant.webp'),
          alt: 'AI 校园小助手对话界面',
          // 这张是手机式竖图（454×776），拉满栏宽会放大近 2 倍且高过一屏，单独限宽居中
          fit: 'portrait',
          caption: 'AI 助手：支持多轮对话与追问，回答前展示「已深度思考」状态，并标注实际调用的查询工具。',
        },
        {
          type: 'text',
          body: '例如询问「有没有姓王的同学」时，助手先说明能力边界，再调用查询工具返回结果。校园场景中，编造信息的代价高于查不到，这一取舍决定了回答策略。',
        },
      ],
    },
    {
      id: 'admin',
      nav: '管理后台',
      kicker: '04',
      title: '管理后台：把治理做成功能',
      blocks: [
        {
          type: 'text',
          body: '后台共 12 个模块。总览页给出待审核、已通过、已停用、违规动态四个关键计数，并支持管理员二次验证（登录后额外校验 6 位动态验证码）；运营侧有近 7 天活跃看板与 30 天运营趋势，注册、动态、评论、私信、活跃学生按天统计并可导出 CSV，另有运营数据日报。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/admin-overview.webp'),
          alt: '校园圈子管理后台总览',
          caption: '后台总览：四项核心计数、管理员二次验证开关，以及 12 个管理功能的快捷入口网格。',
        },
        {
          type: 'text',
          body: '学生管理承担实名审核。待审记录包含学生证照片、学号、姓名、联系方式、学院年级专业与出生日期，管理员可执行「通过」「退回」「停用」，操作全部留痕。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/admin-students.webp'),
          alt: '学生实名审核与账号管理',
          caption: '学生管理：19 名学生名单，含学生证照片预览与「通过 / 退回 / 停用」三态操作。',
        },
        {
          type: 'text',
          body: '内容侧有四套独立的管理面板，各自带搜索、计数与 CSV 导出：动态管理可删除违规动态；评论管理可按内容或评论者检索；私信审计能看到完整对话内容（包括与 AI 助手的交互）；举报审核则是待处理队列。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/admin-dynamics.webp'),
          alt: '动态内容管理',
          caption: '动态管理：22 条动态列表，显示发布者、内容、图片、点赞评论数、状态，支持 CSV 导出。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/admin-comments.webp'),
          alt: '评论管理',
          caption: '评论管理：31 条评论，可按评论内容或评论者搜索，标注所属动态发布者。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/admin-messages.webp'),
          alt: '私信审计',
          caption: '私信审计：75 条私信记录，含发送者、接收者、内容、已读状态与时间。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/admin-reports.webp'),
          alt: '举报审核队列',
          caption: '举报审核：待处理举报队列，含举报人、对象、原因、目标内容与操作。',
        },
        {
          type: 'text',
          body: '审计日志记录每一条管理员操作，并支持回滚：已删除的私信与动态可以恢复。校园场景中，误删内容可能造成证据丢失或争议，这一能力属于必要项。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/admin-audit.webp'),
          alt: '管理员审计日志',
          caption: '审计日志：39 条管理员操作记录，含管理员、目标对象、操作类型、详情与时间，删除类操作可一键回滚。',
        },
        {
          type: 'text',
          body: '管理员账号本身也做了分级：超级管理员可以创建运营管理员并分配角色、设置启用状态，避免权限集中在单一账号上。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/admin-accounts.webp'),
          alt: '管理员账号管理',
          caption: '管理员账号：支持新建管理员、分配角色（超级管理员 / 运营管理员）、设置启用状态。',
        },
        {
          type: 'text',
          body: '意见反馈是另一条独立的闭环：学生提交反馈（支持图片附件），管理员按状态处理并通知学生。',
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
          body: '后端为 PHP + MySQL，未引入重型框架。服务部署在自行购买并维护的云服务器上，环境搭建、域名解析与上线运维均由本人完成，技术栈越轻越可控。所有数据库操作走预处理语句，表单加 CSRF token，密码用 bcrypt 加盐哈希，登录有频率限制。',
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
      title: '做这个项目学到什么',
      blocks: [
        {
          type: 'text',
          body: '最重要的改动是补上端到端测试。早期一次改动破坏了登录流程而未被发现，此后用 Playwright 覆盖关键路径，每次提交自动执行，功能迭代才有回归保障。',
        },
        {
          type: 'points',
          items: [
            { k: '安全要前置', v: '预处理语句与 CSRF 校验属于基础约定，应在第一行代码前确定' },
            { k: '实时要留退路', v: 'SSE 并非在所有网络环境下都稳定，轮询回退保证消息不丢' },
            { k: '管理要留痕', v: '审计日志与回滚能力可以还原误操作' },
            { k: 'AI 要有边界', v: '助手只查真实数据，并明确说明能力范围' },
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
    image: asset('/media/project-opspilot.webp'),
    tag: 'LangGraph · FastAPI · React',
    description: '状态机驱动的 AI 事故响应 Agent，覆盖从发现到复盘的九个环节，每步落库可查。',
    role: '独立开发 · 架构与实现',
    stack: 'Python · LangGraph · FastAPI · React 19 · MCP',
    site: 'https://2676136489-png.github.io/personal-design/demo/opspilot.html',
    github: 'https://github.com/2676136489-png/OpsPilot',
    lede: '值班工程师处理告警的流程交给一个状态机驱动的 Agent，每一步都落库：调用了哪个工具、拿到什么证据、提出并否决了哪些假设、诊断置信度多少、恢复动作是否生效。诊断允许输出 UNKNOWN，验证失败按失败记录。',
    metrics: [
      { value: '15', label: '图节点' },
      { value: '22', label: '工具' },
      { value: '4', label: '权限档位' },
      { value: '12', label: '评测场景' },
      { value: '135', label: '后端测试' },
      { value: '9', label: '前端页面' },
    ],
    note: '线上可注入故障跑完整流程，站内附 12 个场景的评测报告。',
    chapters: [
      {
        id: 'problem',
        nav: '要解决的问题',
        kicker: '01',
        title: '告警响应难在留痕',
        blocks: [
          {
            type: 'text',
            body: '值班工程师处理告警的流程通常是：查看指标、翻查日志、核对最近部署、凭经验提出假设并逐项验证。整个环节依赖人工，过程不留痕；复盘时无法还原当初为何排除某个假设。',
          },
          {
            type: 'text',
            body: 'OpsPilot 把这段流程交给一个状态机驱动的 Agent，并且要求它把每一步都落库：调了哪个工具、拿到什么证据、提出哪些假设、哪些被否掉、为什么否掉、诊断置信度多少、恢复动作有没有生效。',
          },
          {
            type: 'points',
            items: [
              { k: '不许编', v: '证据不足时诊断允许输出 UNKNOWN，这条路径计入「已升级」而不是失败' },
              { k: '要能查', v: '被否掉的假设和否掉的理由都留档，复盘时可查看完整推理链' },
              { k: '要能验', v: '恢复动作返回成功不等于环境已修复，两件事分开统计' },
            ],
          },
        ],
      },
      {
        id: 'graph',
        nav: '状态机',
        kicker: '02',
        title: '十五个节点，跑在 LangGraph 上',
        blocks: [
          {
            type: 'text',
            body: '每个节点声明自己的 stage、超时、预算和失败语义，不是把工具从头到尾调一遍。规划节点先决定要采哪些证据，验证节点主动找反驳证据，能证伪就退回重新规划。',
          },
          {
            type: 'table',
            head: ['阶段', '做什么'],
            rows: [
              ['load_context / triage', '拉服务拓扑与健康态，定级 SEV1–4，划时间窗'],
              ['investigation_planner', '规划要采哪些证据，而不是把工具全调一遍'],
              ['parallel_investigation', '并发跑工具调用，任一超时不阻塞其余'],
              ['evidence_aggregation', '证据归一化、去重、标注可信度与时效'],
              ['hypothesis_generation', '生成候选假设并给出置信度'],
              ['hypothesis_verification', '主动找反驳证据，能证伪就退回重新规划'],
              ['root_cause_diagnosis', '出根因与把握程度；证据不足就如实弃权'],
              ['recovery_planner / risk_assessment', '生成分步恢复方案，按动作风险定审批策略'],
              ['human_approval', '人在环闸门（LangGraph interrupt）'],
              ['recovery_executor / rollback', '逐步执行并记录环境是否实际改变，失败按方案回退'],
              ['verification / postmortem', '回查指标判断是否真恢复，生成复盘'],
            ],
          },
          {
            type: 'text',
            body: '循环不是装饰。评测里 12 次运行全部发生了重新规划，平均 4.92 轮、18.92 步、14 个不同 stage。一个只会一条道走到黑的流程不需要 15 个节点。',
          },
          {
            type: 'points',
            items: [
              { k: '节点只返回增量', v: 'IncidentState 不原地改，合并交给 LangGraph' },
              { k: '检查点落自己的仓储层', v: '进程重启后能继续，人审批打断的流程能从 human_approval恢复' },
              { k: '每次运行有预算', v: 'token / 工具调用 / 墙钟三重上限，越界即停并记明原因' },
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
            body: '工具是声明式的，不是散落的函数。每个 ToolSpec 声明输入输出模型、超时、重试次数、风险等级、可预期的错误类型和所属 MCP server。',
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
            body: '权限分四档，原因在于「改自己的基础设施」和「动外部支付通道」的审批与审计路径不同。回滚同样归入 destructive：它会改变线上流量走向，需要明确的回滚点，而非再部署一次。',
          },
          {
            type: 'points',
            items: [
              { k: '超时是工具的属性', v: '查日志 5 秒、重启服务 30 秒，一个全局常量要么误杀要么白等' },
              { k: '幂等键', v: '带请求指纹，重复调用返回首次结果而不是再重启一次服务' },
              { k: '钩子无法绕过', v: '审计和指标写在调用前后，写操作的调用点绕不过去' },
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
              ['high', '回滚部署、切换支付通道', '挂起等人工批准，拒绝即终止'],
              ['critical', '数据变更、删除类动作', '直接拦下，不进审批队列'],
            ],
          },
          {
            type: 'text',
            body: '执行完必须验证：verification 回查指标，没回基线就走 rollback。评测里把 effective_action_rate 和 environment_fixed_rate 分开统计，用于区分「动作返回成功」与「环境已修复」。多数恢复系统把这两件事混为一谈。',
          },
          {
            type: 'points',
            items: [
              { k: '诚实度单独一项指标', v: '统计「自信地给出了错误根因」和「宣称成功但环境仍然坏着」' },
              { k: '这两项比准确率重要', v: '它们决定的是系统能不能被放在生产旁边' },
            ],
          },
        ],
      },
      {
        id: 'evals',
        nav: '评测',
        kicker: '05',
        title: '十二个场景，每个都能追到证据',
        blocks: [
          {
            type: 'text',
            body: 'evals 是独立的一层，不依赖后端进程，直接跑运行时并出报告。指标中未满分的项比满分项更有参考价值。',
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
            body: '根因、工具选择、恢复、验证四项为满分，说明在已定义的场景上闭环稳定。证据利用率只有 0.29 才是实质问题：Agent 采到的证据里有七成未写进最终诊断的引用。这属于尚未查清，而非评分偏低，也是下一步的修改方向。',
          },
          {
            type: 'text',
            body: '证据召回率 0.826 的背后有一条完整的轨迹：英文期基线 0.701，界面中文化第一版掉到 0.653，因为翻译日志正文打坏了信号匹配；修掉匹配问题回到 0.674，把传播日志按故障类型拆开各自说出真实症状之后到 0.826。评判「指标有没有回退」必须和改动前的基线比，只看「指标全绿」是不够的。',
          },
        ],
      },
      {
        id: 'concurrency',
        nav: '并发',
        kicker: '06',
        title: '把一次调查完整记下来',
        blocks: [
          {
            type: 'text',
            body: '这个项目有一半复杂度来自长任务本身：需要被审批打断、从前端断开后重新接入、在进程重启后继续。',
          },
          {
            type: 'points',
            items: [
              { k: 'SSE 从落库回放', v: '先按 seq 回放完整事件日志再转实时，断线带 Last-Event-ID 从游标续传' },
              { k: '已结束的运行也能看', v: '回放读数据库，不是内存里的环形缓冲' },
              { k: '候选假设与证伪', v: '被否掉的假设按事件折出完整轨迹，置信度从 44% 爬到 56% 的过程可见' },
              { k: '两个时间线页签', v: '「步骤」来自节点执行记录，「事件」来自 SSE 日志，没有一份是从快照反推的' },
              { k: '收尾要听服务端说完', v: '终态回放结束帧触发主动 close，重连上限 5 次，红点停止闪烁' },
              { k: '孤儿 run 启动对账', v: '重启后非终态运行判为孤儿并收尾，等待审批的 checkpoint 刻意保留' },
              { k: '健康度未知画灰色', v: '拓扑图节点颜色只编码健康度，不知道就画灰，不画成绿色' },
            ],
          },
          {
            type: 'text',
            body: '反推出来的时间线无法展示重新规划、被否掉的假设或回滚，而这三样恰好是证明 Agent 在思考而不是在背稿的地方。候选假设面板是后来补上的：数据一直有落库，事件日志里 hypothesis.created、updated、rejected 一应俱全，但前端从头到尾没有任何组件消费它，缺口是靠把事件类型的分布数出来对了一遍才发现的。',
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
            body: '遇到的问题有共同特征：只在特定环境下暴露，暴露时的表现又像另一类故障。以下条目均来自实际发生的问题。',
          },
          {
            type: 'points',
            items: [
              { k: '传递依赖', v: '干净 venv 只装 requirements 时，SQLAlchemy 异步引擎 import 就报缺 greenlet。本地 .venv 里是被别的包带进来的' },
              { k: '路径硬编码', v: 'parents[5] 把六层目录写死，沙箱里少一层直接 IndexError 崩在 import，连日志都来不及打' },
              { k: '.env 对 import 期隐形', v: '在 pydantic 加载 .env 之前读了 os.environ，读到 None，所有 provider 503，而日志指向一个不存在的进程' },
              { k: '代理劫持回环', v: 'httpx 默认 trust_env=True，后端调自己的 /__sim 被送给代理返回 404，同一 URL curl 是 200' },
              { k: '元数据说谎', v: 'reasoning_mode 只在创建时写一次，用了模型的运行也对外宣称 deterministic，比没有元数据更糟' },
              { k: 'WAL 会接管新库', v: '托管平台是覆盖式上传，上一版的 -wal 带着 page 1 副本原地顶掉新库，只能靠构建戳识别' },
              { k: '中文化打坏信号', v: '日志正文翻成中文后子串匹配全部落空，信号模式表改成双语短语兜底，中文词必须是短语' },
              { k: '文档承诺不等于渲染', v: '假设数据一直有落库，但没有任何组件消费它；缺口靠数事件分布再和页面渲染对一遍发现' },
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
    image: asset('/media/project-research.webp'),
    tag: 'LangGraph · FastAPI · RAG',
    description: '自动拆解研究任务、检索取证并核查，产出逐条标注来源的报告。',
    role: '独立开发 · 架构与实现',
    stack: 'Python · LangGraph · FastAPI · React 18 · SQLite',
    site: 'https://2676136489-png.github.io/personal-design/demo/research.html',
    github: 'https://github.com/2676136489-png/Personal-agent-development-flow',
    lede: '输入研究任务后，工作流依次完成理解、规划、工具调用、证据分析与验证，在生成报告前中断等待人工确认，最终产出逐条标注来源的报告。确认环节与证据不足重查都写进工作流，不依赖调用方自觉。',
    metrics: [
      { value: '7', label: '工作流节点' },
      { value: '4', label: '类工具' },
      { value: '256', label: '后端测试' },
      { value: '8', label: '页面模块' },
      { value: '4', label: '防失控闸门' },
      { value: '7 步', label: '研究流水线' },
    ],
    note: '线上可直接用，模型接智谱 GLM-4-Flash、检索接 Tavily，无需配置环境。',
    chapters: [
      {
        id: 'problem',
        nav: '要解决的问题',
        kicker: '01',
        title: '研究型任务最容易出的两类错',
        blocks: [
          {
            type: 'text',
            body: '让模型做研究，最容易出的两类错是：证据不足也硬写出一个像样的结论，以及把「看起来合理」当成「查过了」。前者是幻觉，后者是无法复核：报告读起来头头是道，但读者没法判断哪句话有依据。',
          },
          {
            type: 'points',
            items: [
              { k: '要可溯源', v: '每条结论都标来源，没来源的句子不该出现在报告里' },
              { k: '要可打断', v: '写报告前必须人工确认，不能一路自动跑到底' },
              { k: '要能复核', v: '证据不足时重新检索，不以剩余证据充数' },
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
            caption: '工作流图：两条回流边是核心，证据不足就再查一轮，核对不通过就回炉。',
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
              'verify   ─────────────────┘   ← 条件边：verdict=needs_more → 回炉（≤ max_verify_attempts）',
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
            body: '每个节点读 ResearchState、返回一个局部更新，由 LangGraph 合并回去。两个回流边是这套图的核心：research 循环补证据，verify 回炉重查。verify 返回带缺口说明的结论，而非通过 / 不通过二元值：「这两条结论还缺什么」会被显式写下。',
          },
          {
            type: 'points',
            items: [
              { k: '节点只做一件事', v: '7 个节点各自职责单一，这是能不能单独测的前提' },
              { k: '提示词与代码分离', v: 'prompts.py 独立，改提示词不用碰图的结构' },
              { k: '数据契约显式', v: 'schemas.py 定义节点之间的契约，加节点时漏字段会立刻暴露' },
            ],
          },
        ],
      },
      {
        id: 'gates',
        nav: '防失控',
        kicker: '03',
        title: '四道闸，各自防不同的失控',
        blocks: [
          {
            type: 'table',
            head: ['闸', '位置', '作用'],
rows: [
              ['max_iterations', '条件边 route_after_research', 'research 循环上限'],
              ['max_verify_attempts', '条件边 route_after_verify', '验证回炉上限'],
              ['MAX_FAILURE_STREAK', '条件边', '连续工具失败 2 次就不再重试'],
              ['recursion_limit=50', 'invoke config', 'LangGraph 层面最后保险'],
            ],
          },
          {
            type: 'text',
            body: '四道闸不是为了「限制 Agent」，是为了让失控有明确的停止点。上面两条管循环次数，第三条管单个工具反复失败，第四条是框架层面的兜底，任何一层改动导致前三条失效时，还有一道能拦住。',
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
            body: 'interrupt_before=["write"] 把人工确认放在出报告之前。确认节点位于图内，并非弹出式确认框。被打断后恢复，流程从 write 继续，不会重新跑一遍前面的检索。',
          },
          {
            type: 'points',
            items: [
              { k: '终态不可复活', v: 'completed / cancelled / failed 三种终态下再调 resume 返回 409' },
              { k: '恢复范围要说清', v: 'checkpointer 用 InMemorySaver，覆盖同进程内的两次请求；跨进程恢复切 SQLite 是配置级改动' },
              { k: '派生状态一起落库', v: '落库时把 awaiting_approval 之类的状态一并写入，重启后读到的与中断时一致' },
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
            body: '知识库走「解析 → 切块 → 向量化 → 索引 / 存储 → 检索」的纯检索链路。RAG 实验台把这条链路摊开成可逐步查看的实验页：切了多少块、命中哪些片段、相关度多少、五阶段各耗时多少，全部可查。',
          },
          {
            type: 'points',
            items: [
              { k: '门槛收紧', v: '引用相关度门槛从 0.35 提到 0.65，跨主题沾边的片段不再进依据来源' },
              { k: '三维分布图', v: '向量分布改成可旋转的三维视图，聚簇与离群点直接看得见' },
              { k: '索引落盘', v: '倒排索引带词与块号，落盘输出两个文件，重建前可人工核对' },
              { k: '示例语料', v: '知识库预置 10 篇文档，覆盖 MCP、Tool Calling、Agent 与 RAG' },
            ],
          },
          {
            type: 'text',
            body: '检索器不具备语义能力时（哈希后端），实验台会明确标注降级原因并回退联网检索。这条自适应降级来自一次实测：固定相似度阈值下，无关片段的相关度（0.473）反而高于相关片段（0.441），阈值这条路走不通，只能换成按能力降级的策略。',
          },
        ],
      },
      {
        id: 'scope',
        nav: '范围边界',
        kicker: '06',
        title: '有意识划出去的部分',
        blocks: [
          {
            type: 'text',
            body: '以下条目是明确不做，不属于待办。记录原因比列出待办更有用，后来者可以判断这是取舍还是遗漏。',
          },
          {
            type: 'table',
            head: ['不做', '原因'],
            rows: [
              ['Multi-Agent', '7 个节点共享同一份 State 和同一个 LLM client，它们是一个 Agent 的阶段。拆开只多一层消息传递与状态同步，职责没变'],
              ['复杂 Memory', 'messages 加 State 里的 evidence 列表够用。向量记忆是另一个问题，和「结论能不能溯源」无关'],
              ['并行子问题检索', '检索只占整轮耗时的零头，省不下时间，却要为状态合并与部分失败收敛多加一层判断'],
              ['跨进程恢复', '换成 SQLite checkpointer 是配置级改动，等真有多实例需求再上'],
            ],
          },
          {
            type: 'text',
            body: '判据同样简单：新需求如果不同时增强「证据可溯源 / 过程可观察 / 结论可复核」这三条之一，就不进这一版。',
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
            body: '这个项目最需要记录的教训关于测试本身。Vitest 默认按文件并行执行，在部分受限环境中，并行 worker 写模块缓存被拒绝，第二个测试文件被静默跳过，整个 run 仍报告通过。',
          },
          {
            type: 'points',
            items: [
              { k: '静默跳过比失败危险', v: '失败会被注意到，静默跳过不会。只跑了一个文件仍报告全部通过时，应按失败处理' },
              { k: '修法写进配置注释', v: '关闭文件级并行后 51 个用例在 4 秒内完成；原因写入注释，避免后续被误改回' },
              { k: '断言要限定范围', v: '搜整页会被导航栏污染，下拉菜单里列着所有项目名' },
            ],
          },
        ],
      },
    ],
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
    image: asset('/media/project-checkin.webp'),
    tag: '单文件 · React 工程化版',
    description: '以打卡驱动目标推进的个人工作台，核心算法按近 7 天速度估算剩余天数。',
    role: '独立开发',
    stack: '单文件 HTML · React 18 · TypeScript · Tailwind',
    site: 'https://github.com/2676136489-png/Check-in-activity',
    github: 'https://github.com/2676136489-png/Check-in-activity',
    lede: '多数打卡工具统计连续天数，不回答按当前速度还需多久完成。这个页面的核心是一个算法：取最近 7 天，按休息日规则剔除无效天，计算日均进度，再以剩余量除以日均速度。',
    metrics: [
      { value: '2338', label: '行单文件版' },
      { value: '51', label: '算法单测' },
      { value: '46', label: 'UI 断言' },
      { value: '7', label: '尺寸实拍' },
      { value: '4', label: '状态判定' },
      { value: '3', label: '张数据表' },
    ],
    note: '仓库包含两套功能一致的实现：单文件版用于日常使用，工程化版可直接打开。',
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
    image: asset('/media/project-gomoku.webp'),
    tag: 'Python / C++ · 博弈搜索与可学习评估',
    description: '15×15 国际连珠对弈平台：禁手判定、alpha-beta 搜索、可学习贪心与 Agent 决策层，八个页面已上线可玩。',
    role: '独立开发',
    stack: 'Python · FastAPI · C++17 · SQLite · React 19 · Docker',
    site: 'https://2676136489-png.github.io/personal-design/demo/gomoku.html',
    lede: '起点是 Botzone 的单文件 C++ Bot，以棋形模板打分选点。后续重写为 Python 引擎，并扩展为完整对弈平台：大厅、对弈、复盘、教程、代码工坊、竞技场与贪心学习，每个选点附棋形解释。',
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
            body: '重写分三步：引擎先迁到 Python，便于迭代与编写测试；再补搜索与棋形判定；最后长出完整的对弈平台。C++ 版本保留在 engine/bot.cpp，同时作为代码工坊 C++ 通道的样例。',
          },
          {
            type: 'points',
            items: [
              { k: '八个页面', v: '大厅、开局准备、对局、复盘、教程、代码工坊、竞技场、贪心学习' },
              { k: '对局可恢复', v: '每手落子写一行 moves 表，进程重启后按手数重放还原局面' },
              { k: '冷热分层', v: '内存保留 400 局热态，超出按最久未活动淘汰，回访时从库载入' },
              { k: '账户持久化', v: 'SQLite 单文件存储，token 仅存 SHA-256 摘要' },
            ],
          },
          {
            type: 'text',
            body: '页面按职责拆分是后期补上的调整。早期把模式选择、难度、规则、棋盘、胜率曲线与解说都放在同一个对局页，开局配置与对局操作混在一起，对局中改难度会误触发重开。拆分后开局与对局各自独立，复盘和贪心学习单独成页。',
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
            body: '网页对局默认走国际连珠：黑棋有禁手，白棋没有。三者的优先级是「长连 > 五连 > 三三 / 四四」，所以判定不能先查禁手再查胜负，必须一次算完再排序，黑棋一手既成五又成长连，算输。',
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
            caption: 'shapes.py 里的判定阶梯：后一档是前一档的前提，_rank() 是唯一的真相来源。',
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
            body: '活四与冲四的区分随之明确：可成五的空点为两个时无法拦截，为一个时可拦截。模块内只有 _rank() 一个判定入口，外层仅加 lru_cache，同一条线只计算一次。',
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
            body: '因此落子时只重算发生变化的局部：一颗子最多与距离 4 以内的子共用五连，超过 4 格不再影响。place() 先收集半径 4 内的已占位置，扣除这些子的旧贡献后落子并整体重算，undo() 反向执行。代价是需自行保证状态一致性。测试中有一条用例随机落子 120 步，逐步以全量重算校验增量分、候选集与邻域计数。',
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
            body: '搜索采用 negamax + alpha-beta，配合 Zobrist 置换表、迭代加深与按静态分排序的候选截断，展开宽度随剩余深度递减（6 / 6 / 8 / 10 / 12 / 14 / 16）。时间预算硬性生效，迭代加深超时返回上一层的完整结果，不返回不完整结果。另有两条确定性规则前置：己方可连五直接落子，对手可连五先行封堵，避免必胜与必防点因深度不足被漏算。',
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
            body: '难度不通过降低引擎棋力实现，该做法在体感上等同于 AI 水平下降。低难度采用在近优候选中加权随机：分数不低于最优值一定比例的候选进入候选池，噪声系数由入门 0.55 收敛至专家 0，体感为偶发失误而非规则性错误。',
          },
        ],
      },
      {
        id: 'greedy',
        nav: '可学习贪心',
        kicker: '06',
        title: '从手写分值表到棋谱训练的权重',
        blocks: [
          {
            type: 'text',
            body: '贪心策略的评估函数是一张十二项的棋形分值表，初始版本手工设定（活四 1000 万、冲四 15 万、活三 1500），数值之间只有粗略的倍数关系，缺少数据依据。贪心学习页用棋谱把这组权重训练出来，训练过程经 SSE 推送，页面上能看到每一轮的损失变化。',
          },
          {
            type: 'points',
            items: [
              { k: '19 维特征', v: '8 档己方棋形 + 8 档对方棋形，加邻域、离天元距离与手数占比' },
              { k: '12 个参数', v: '8 个棋形权重、3 个辅助权重与 1 个防守系数，优化器为手写 Adam' },
              { k: '领域约束投影', v: '每轮更新后拉回可行域：空棋形不值分，分值随棋形变强单调递增' },
              { k: '棋谱来源', v: '内置 50 盘 2067 手由双引擎对打生成，另收 SGF、JSON 与坐标三种上传' },
            ],
          },
          {
            type: 'text',
            body: '防守系数的设定经过一次调整。第一版给防守设了 8 个独立权重，训练后全部收敛到 0：样本只有数百条时，对手威胁与己方机会的梯度相互抵消，模型退化为只优化进攻。改为与进攻共用权重、只差一个标量 α 之后，α 收敛到 1.03，「对手的活三比己方活三略更值得封堵」由数据得出，不再依赖人工设定。',
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
            body: '早期棋谱用贪心加噪声自战生成，每盘只有 13 到 27 手，训练结果只是对手写分值表的模仿。换成带搜索的引擎对打棋谱之后，同一套代码的 top-1 从 24.2% 提到 46.4%。这三项衡量的是对棋谱的复现程度而不是棋力，实际对局表现可以到竞技场看「学习型贪心」这一档。',
          },
        ],
      },
      {
        id: 'limits',
        nav: '试过但放弃',
        kicker: '07',
        title: '价值网络的实测结论与放弃原因',
        blocks: [
          {
            type: 'text',
            body: '网络结构为 34 维特征 → 48 → 24 → 1，共 2881 个参数；前向传播手写 math.tanh 与矩阵乘法，运行时无需 numpy，避免为不足三千参数的模型引入数十兆依赖。训练采用蒸馏：深度 3 的搜索引擎自对弈产生局面，引擎实际走的那手为正样本、随机抽取的合法点为负样本，用二元交叉熵拟合；DAgger 继续训练的脚本也保留在 tools/ 下，实验可复现。',
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
            body: '网络策略不是只按分值落子：按分数取 Top-K 候选逐点试下，再用网络评估对手的最强应手，取净价值最高的一手，对手应手分打 0.75 折扣，因为对手未必能够落子。即便如此它仍不敌带搜索的引擎，评估函数替代不了搜索。',
          },
          {
            type: 'text',
            body: '也试过让网络缩小搜索宽度，两组对照均为负向收益：第一版采用硬剪枝，以网络 Top-12 作为根节点候选池，同预算下劣于不剪枝；第二版仅在静态分相同时以网络作为 tie-break，结果同样更差。诊断结果显示：以深度 5 全量搜索的根节点最优手为标准，网络 Top-12 与静态 Top-12 的命中率均为 100%，两列表重合 70%。网络未漏掉最优手，但它补充的三成落点质量更低，由网络决定宽度等于以较差落点替换静态排序中的优质落点。',
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
        title: '上线之后才暴露的问题',
        blocks: [
          {
            type: 'points',
            items: [
              { k: '网关覆盖鉴权头', v: '分享网关给每个请求注入自己的 Authorization，登录态静默失效' },
              { k: 'token 多通道读取', v: '按 cookie、query、自定义头、标准头的顺序取，并写 SameSite=Lax' },
              { k: '产物目录改名', v: '托管平台把 dist、build、out 当构建输出剔除，前端产物改叫 web/site' },
              { k: 'WAF 误判源码', v: '代码工坊提交的模板被当注入拦截，传输层提供 b64 备用通道重发' },
            ],
          },
          {
            type: 'text',
            body: '可观测性是自写的 340 行，没有引入第三方库：指标直接输出 Prometheus 文本格式，日志是单行 JSON 带请求 id，限流按固定窗口分桶。指标标签只按路由模板打点，不按真实路径，每个对局一个新 id，按真实路径打的话时间序列只增不减。测试分两块：453 项后端测试由脚本自启服务与临时库，181 项浏览器走查经 CDP 派发真实鼠标事件，覆盖五个宽度的横向溢出复检。',
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
    image: asset('/media/project-station.webp'),
    tag: 'C11 · 零依赖',
    description: '双角色（管理员 / 顾客）校园快递站系统，按 UI、认证、业务三层划分实现。',
    role: '独立完成',
    stack: 'C11 · 控制台可视化',
    lede: '纯 C 实现的快递驿站系统，仅依赖标准库与控制台 API。业务规则、状态流转与可视化界面分层实现，命令行下保持清晰的信息层级。',
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
        nav: '为什么是 C',
        kicker: '01',
        title: '依赖压到最少，复杂度留给业务',
        blocks: [
          {
            type: 'text',
            body: '课程设计通常停留在可运行的单文件练习。这个项目采用相反的路径：依赖压缩到 C 标准库与控制台 API，复杂度投入业务本身，包括计费规则、状态流转、权限边界与持久化格式。',
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
        title: '一张表决定一笔运费',
        blocks: [
          {
            type: 'text',
            body: '运费不是简单乘法。它由寄送方式（标准 / 加急）、距离（省内 / 省外）、重量三档决定首重与续重，再叠加价值加成与保价费，六条规则交叉出六种组合。',
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
            caption: '运费规则表。寄件时逐项计算并展示明细，而不是给一个总价。',
          },
          {
            type: 'text',
            body: '寄件界面会把基础运费、续重费、高价值加成、保价费拆开展示。用户在确认前即可看到费用构成，而不是只得到一个总价。',
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
            body: '包裹状态没有用枚举硬套，而是拆成四个彼此正交的状态位。正交的好处是组合自由：一个包裹可以同时在运输中、完好、未送达、正常计费，而不需要为每种组合定义一个枚举值。',
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
            body: '持久化选择文本文件而不是二进制结构体写入。代价是解析稍复杂，收益是数据可读、可 diff、可手工修复，并绕开结构体对齐在不同编译器与平台上的差异。验收人员可以直接打开 data/users.txt 核对。',
          },
          {
            type: 'text',
            body: '源码按 model / data / ui / auth / user / manager 六个模块分层，但仓库根目录同时放一份合并出来的 main.c。它不是手抄的副本：tools/build_single_file.py 会扫描 src/ 自动生成，改完源码跑一次脚本即可同步，避免出现两份不一致的代码。',
          },
          {
            type: 'points',
            items: [
              { k: '一份源码入口', v: 'src/ 是唯一真源，main.c 由脚本合并生成' },
              { k: '免配置编译', v: '仓库根目录备便携编译器，双击 run.bat 即可运行' },
              { k: '多入口支持', v: 'Visual Studio 解决方案、VS Code 任务、Makefile、命令行脚本都能编译' },
              { k: '纯 C 约束', v: '历史遗留的 .cpp 文件移入 legacy_replaced/ 备份，不参与编译' },
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
    image: asset('/media/project-wiki.webp'),
    tag: 'HTML · CSS · JavaScript',
    description: '面向 iGEM 团队的多页面 Wiki 模板，静态优先架构，附带可复用的界面与交互插件。',
    role: '独立开发',
    stack: '静态 HTML · 可选 PHP include',
    lede: '面向 iGEM 团队的多页面 Wiki 模板：19 个页面共用一套设计系统，9 个交互插件各自独立成页，可直接复用。零构建，打开 index.html 即可查看。',
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
        title: '竞赛 Wiki 不是普通网站',
        blocks: [
          {
            type: 'text',
            body: 'iGEM 的 Wiki 有硬约束：最终的内容、图片、脚本与样式必须全部放进 iGEM 自己的 GitLab 仓库里，评审在那套环境里看你的页面。这意味着任何依赖 Node 构建、CDN 资源或外部服务的方案都会在实际交付时失效，模板必须是静态优先的。',
          },
          {
            type: 'points',
            items: [
              { k: '离线自洽', v: '所有素材进仓库，页面双击即开，不依赖任何构建产物' },
              { k: '团队可改', v: '换人接手时不需要先配环境，改完 HTML 直接推仓库' },
              { k: '合规留痕', v: '保留 attribution 与 license 页脚，占位内容明确标记待替换' },
            ],
          },
        ],
      },
      {
        id: 'map',
        nav: '页面地图',
        kicker: '02',
        title: '十个交付页，一条评审动线',
        blocks: [
          {
            type: 'text',
            body: '页面按评审阅读顺序排列：先看项目描述，再看设计、建模、工程与结果，然后是安全、人类实践、贡献与 attribution。每条对应评审表格中的一项，团队无需自行决定内容归属。',
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
        title: '九个可直接搬走的交互模块',
        blocks: [
          {
            type: 'text',
            body: '每个插件都是独立单页，带自己的 demo 与说明。团队按需取用对应的 HTML 与 JS 初始化片段，无需为一个滚动效果引入整套框架。',
          },
          {
            type: 'table',
            head: ['插件', '解决什么问题'],
            rows: [
              ['command-palette', '⌘K 唤起，在一个框里跳转所有页面'],
              ['scrollytelling', '滚动驱动的分步叙事，用于讲实验流程'],
              ['evidence-filter', '按标签实时筛选证据卡片'],
              ['floating-dock', '移动端底部悬浮导航'],
              ['glossary', '科技术语悬浮释义'],
              ['magnetic-cards', '卡片跟随指针的磁吸反馈'],
              ['comparison', '方案横向对比表'],
              ['particles', '动态粒子背景'],
              ['plugin-all', '全部插件的集中演示页'],
            ],
            caption: '九个插件页。共享同一份设计系统，风格自动一致。',
          },
          {
            type: 'text',
            body: '基础交互统一放在 assets/js/main.js 里：移动端导航、主题切换、阅读进度条、标签页、折叠面板、滚动揭示与数字滚动。页面只要挂 class，不需要各自写一遍脚本。',
          },
        ],
      },
      {
        id: 'choices',
        nav: '工程取舍',
        kicker: '04',
        title: '静态优先，PHP 只是可选加成',
        blocks: [
          {
            type: 'text',
            body: '仓库根是一个可直接打开的静态站，但 includes/ 下同时提供了 nav.php、footer.php 与 config.php 三个片段。想要抽公共导航的团队可以用 PHP include 引入，不想的就各页各写，两条路都不影响静态版本独立运行。',
          },
          {
            type: 'points',
            items: [
              { k: '单一设计源', v: 'assets/css/style.css 统一色板、圆角、阴影与组件，改一处全局生效' },
              { k: '单一脚本源', v: 'assets/js/main.js 承载全部通用交互，页面只做声明式挂接' },
              { k: '低接手成本', v: '成员不必理解构建工具，改 HTML 与 Markdown 式内容即可' },
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
    image: asset('/media/project-dashboard.webp'),
    tag: 'React 19 · Vite 6',
    description: '纯黑底 3D 视觉作品集，九个作品共用一份数据与一套详情渲染，同一份源码发布到两个域名。',
    role: '独立开发 · AI 辅助工程',
    stack: 'React 19 · Vite 6 · 手写 CSS',
    lede: '视觉经过一版重做，保留的是可长期维护的结构：内容同源，详情共用一套渲染，部署分两条链路。',
    metrics: [
      { value: '9', label: '个收录作品' },
      { value: '45', label: '张 WebP 素材' },
      { value: '2', label: '个线上域名' },
      { value: '4', label: '类自动化验证' },
    ],
    github: 'https://github.com/2676136489-png/personal-design',
    site: 'https://2676136489-png.github.io/personal-design/',
    chapters: [
      {
        id: 'arch',
        nav: '信息架构',
        kicker: '01',
        title: '九个作品，一套详情渲染',
        blocks: [
          {
            type: 'text',
            body: '首页用于快速判断方向。九个作品位于后半段，点进任意一个，都由同一套章节渲染器排版。',
          },
          {
            type: 'text',
            body: '路由是手写的 hash 解析，没有引入 react-router。章节数据写在 data.js 里，六种块类型覆盖正文、要点、表格、截图、代码与架构分组。',
          },
          {
            type: 'points',
            items: [
              { k: '首页', v: '八个板块按阅读顺序排，首屏只讲项目' },
              { k: '作品', v: '九张堆叠卡共用一份数据，详情页不再重复写页面' },
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
        title: '黑底、大标题、留白',
        blocks: [
          {
            type: 'text',
            body: '上一版为浅色风格，当前整站改为纯黑底：标题使用 Kanit 超大字重，以字号与留白建立层级。',
          },
          {
            type: 'text',
            body: '强调色只出现在渐变标题与主按钮里。正文用灰蓝色，分隔线是 1px 的半透明线，不堆阴影。',
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
            body: '白底区用于分隔长内容，并非主题切换。能力与简历放在这里，黑底区只留作品与首屏。',
          },
        ],
      },
      {
        id: 'motion',
        nav: '动效层',
        kicker: '03',
        title: '动效跟着滚动走',
        blocks: [
          {
            type: 'text',
            body: '进场用 Framer Motion 的 whileInView，滚出视口就不再执行。滚动带是唯一常驻的循环，帧率交给一个 rAF。',
          },
          {
            type: 'table',
            head: ['动效', '实现'],
            rows: [
              ['进场', 'FadeIn 只触发一次，位移不超过 40px'],
              ['首屏主视觉', 'Magnet 跟随鼠标，最大位移约三分之一'],
              ['关于段落', 'AnimatedText 按字显影，区间压在进度 0 到 0.9'],
              ['作品堆叠', 'sticky 卡片随滚动逐层缩放，偏移按总数摊平'],
              ['滚动带', '双行反向，鼠标进入只冻结当前行'],
            ],
          },
          {
            type: 'text',
            body: 'prefers-reduced-motion 打开时，滚动带速度归零，进场动画退化为静态。',
          },
        ],
      },
      {
        id: 'assets',
        nav: '素材与性能',
        kicker: '04',
        title: '20MB 源图压到 2.8MB',
        blocks: [
          {
            type: 'text',
            body: '截图源文件放在 media-src，公开目录只留 WebP。45 张素材合计 2.8MB，源图 20.3MB。',
          },
          {
            type: 'points',
            items: [
              { k: '转换', v: '脚本批量转 WebP，作品卡素材统一压到 1400 宽' },
              { k: '尺寸', v: '每张图给 width 与 height，加载完成不把页面顶下去' },
              { k: '加载', v: '首屏主视觉直接加载，其余图片懒加载' },
              { k: '唯一性', v: '九张作品卡的三格素材互不重复，未用封面重复填充' },
            ],
          },
          {
            type: 'text',
            body: '没有线上界面的项目，用章节名与实测数据做信息面板，不复制同一张封面。',
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
            body: '主站跑在 WorkBuddy，镜像站是 GitHub Pages 的项目站。两边基路径不同，构建参数不能写死。',
          },
          {
            type: 'text',
            body: 'Vite 只改写 HTML 与 import 的路径，JS 字符串里的图片地址要自己拼 BASE_URL，否则子路径下整片 404。',
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
              "image: asset('/media/project-gomoku.webp'),",
            ],
          },
          {
            type: 'text',
            body: 'GitHub Pages 由脚本构建到 dist-pages，再强推 gh-pages 分支。主分支只放源码，产物不进版本库。',
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
              { k: '滚动带', v: '鼠标进入某一行只停那一行，移开缓升回原速' },
              { k: '堆叠卡', v: '锚点跳转留 76px 顶部间距，标题不会被导航压住' },
              { k: '移动端', v: '窄屏让导航横向滚动，堆叠卡改成单列' },
              { k: '联系', v: '邮箱与电话直接走 mailto 与 tel，不额外做表单' },
              { k: '回退', v: '旧版外观保留在隐藏参数里，回归测试仍能跑' },
            ],
          },
          {
            type: 'text',
            body: '旧版入口不对访客展示。它用于承载 SSR 断言，也可在出现问题时快速回退。',
          },
        ],
      },
    ],
  },
  {
    id: 'identity',
    accent: '#C26D6D',
    accentInk: 'dark',
    slug: 'identity',
    title: '校园服务视觉系统',
    category: '品牌视觉',
    year: '概念',
    period: 'Exploration',
    image: asset('/media/project-identity.webp'),
    tag: 'Brand Direction',
    description: '面向校园服务场景的视觉方向，以网格、克制用色与固定留白节奏建立可信度。',
    role: '视觉方向探索',
    stack: 'Grid · Type · Color',
    lede: '一次未投产的视觉方向探索，讨论校园服务如何在年轻感与可信度之间取得平衡。',
    note: '这是一个概念项目，页面所示为视觉方向与方法，不是已上线的品牌系统。',
    chapters: [
      {
        id: 'tension',
        nav: '核心张力',
        kicker: '01',
        title: '年轻感与可信度往往互相打架',
        blocks: [
          {
            type: 'text',
            body: '校园产品常走向两个极端：一是学生会海报式的撞色，专业感不足；二是过度克制，接近办事大厅的冷硬风格，使用意愿低。难点在于同时满足两端：既要有使用意愿，也要让人相信信息真实可信。',
          },
          {
            type: 'points',
            items: [
              { k: '不可太轻', v: '涉及实名、通知、申诉的功能，视觉必须承载严肃性' },
              { k: '不可太重', v: '使用者是二十岁上下的人，官僚感会降低使用意愿' },
              { k: '要能扩展', v: '从一张海报到一个后台界面，同一套语言必须都成立' },
            ],
          },
        ],
      },
      {
        id: 'method',
        nav: '方法',
        kicker: '02',
        title: '用秩序替代装饰',
        blocks: [
          {
            type: 'text',
            body: '这里的取舍是：把表达欲压到最低，让结构本身承担视觉识别。具体的颜色可以换，网格和层级的骨架一旦立住，换谁来做都不会跑偏。',
          },
          {
            type: 'arch',
            groups: [
              {
                title: '骨架',
                items: ['统一基线网格', '固定留白节奏', '一致的圆角与分隔线规则'],
              },
              {
                title: '色彩',
                items: ['一个高识别主色', '大量中性面', '彩色仅用于状态而非装饰'],
              },
              {
                title: '字体',
                items: ['一套字族两种字重', '负字距标题', '克制的中英混排规则'],
              },
              {
                title: '延展',
                items: ['界面与物料同源', '深浅两套场景', 'AI 辅助批量生成候选方案再人工收敛'],
              },
            ],
          },
        ],
      },
      {
        id: 'status',
        nav: '当前状态',
        kicker: '03',
        title: '为什么把它放在这里',
        blocks: [
          {
            type: 'text',
            body: '这一项没有包装成完整案例。它在作品集中的作用有两点：说明界面设计之前先要确定定位；同时保留一个诚实的样本：项目不一定都有上线产品，但每个都应说明当前完成度。',
          },
          {
            type: 'text',
            body: '这套判断在校园圈子与本站中已经应用：单一强调色、大留白、结构优先于装饰。这两个项目是方法的实际验证。',
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
    text: '大模型参与需求拆解、架构设计与代码迭代，覆盖从设计到交付的完整链路。',
    tags: ['LLM / RAG', 'Agent / MCP', 'Prompt Engineering'],
  },
  {
    title: '工程与算法',
    text: 'C/C++ 算法与数据结构为基础，延伸至 Python 服务端与 PHP / MySQL 后端。',
    tags: ['C / C++', 'FastAPI · Docker', 'PHP · MySQL'],
  },
  {
    title: '前端与界面',
    text: 'TypeScript、React 与 Vite 构建界面，负责信息层级与操作路径设计。',
    tags: ['React · TypeScript', 'Vite', 'SSE'],
  },
  {
    title: '组织与推进',
    text: '将模糊需求拆解为可执行任务，明确优先级与验收标准，推进到交付。',
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
    text: '状态机驱动的 Agent 覆盖从发现到复盘的九个环节，15 个图节点、22 个工具、135 个后端测试。线上可注入故障跑完整流程。',
  },
  {
    year: '2026',
    title: 'AI 研究工作台',
    text: '研究流程拆为 7 步流水线，256 个后端测试覆盖四道失控防护闸门。',
  },
  {
    year: '2026',
    title: '校园圈子',
    text: '实名社交平台，架构、实现与部署独立完成，线上稳定运行，19 位实名学生。',
  },
  {
    year: '2026',
    title: '五子棋对弈引擎 Gomoku Match',
    text: '由单文件 C++ Bot 扩展为完整对弈平台：连珠禁手判定、递归棋形识别、alpha-beta 搜索、棋谱训练的可学习贪心，以及一层只在候选点里取舍的 Agent，已上线可玩。',
  },
  {
    year: '2026',
    title: '个人作品集',
    text: '本站本身。同一份构建产物发布至 GitHub Pages 子路径与云托管根路径，两处内容保持一致。',
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
