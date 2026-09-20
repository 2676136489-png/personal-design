/* 图片素材统一走 WebP（scripts/optimize-images.py 生成）。
   截图原 PNG 单张接近 1MB，首屏大图弱网下要等 1 秒以上、看起来像加载失败，
   转 WebP 后整站图片从 12.7MB 降到 0.85MB。 */
export const media = {
  avatar: '/media/avatar-lky.webp',
  campus: {
    desktop: '/media/campus-desktop.webp',
    phone: '/media/campus-phone.webp',
  },
  campusShots: (name) => `/media/campus/${name}.webp`,
};

export const profile = {
  name: '卢柯宇',
  initials: 'LKY',
  tagline: '把校园里的想法，做成真正能用的产品。',
  email: 'luky2124@mails.jlu.edu.cn',
  phone: '15144167675',
  city: '重庆',
  school: '吉林大学',
  education: '吉林大学 · 计算机科学与技术',
  github: 'https://github.com/2676136489-png',
  status: '本科在读',
};

export const heroFacts = [
  { label: '在吉林大学', value: '计算机科学' },
  { label: 'GPA', value: '3.1 / 4' },
  { label: '专业排名', value: '前 30%' },
  { label: '已交付项目', value: '6 个' },
];

export const navItems = [
  { id: 'top', label: '首页', href: '#/' },
  { id: 'campus', label: '校园圈子', href: '#/campus' },
  { id: 'work', label: '全部作品', href: '#/#work' },
  { id: 'skills', label: '能力', href: '#/#skills' },
  { id: 'about', label: '关于', href: '#/#about' },
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
  slug: 'campus',
  name: '校园圈子',
  en: 'Campus Circle',
  site: 'https://www.lucky-campus.top',
  period: '2026.05 — 2026.08',
  role: '独立开发 · AI 辅助工程',
  stack: 'PHP · MySQL · SSE · Docker',
  headline: '一个真正在运行的校园社交平台。',
  lede: '从实名认证到实时私信，从敏感词过滤到运营后台——它不仅仅是一次普通的课程作业，更是一个有真实用户、完整业务闭环、已经在线运行的产品。',
  cover: '/media/campus/dashboard-1960.webp',

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
          body: '校园里的信息是碎的：失物招领发在班级群，社团招新贴在公告栏，找人问事只能靠熟人转发。我想做的不是又一个聊天工具，而是一个把「同校的人」这件事真正利用起来的地方——所有用户都要实名审核，每条内容都能追溯到人。',
        },
        {
          type: 'text',
          body: '这也决定了它的技术重点不在花哨的界面，而在三件事：身份必须可信、内容必须可管、系统必须扛得住真实使用。',
        },
        {
          type: 'points',
          items: [
            { k: '可信身份', v: '注册后需管理员核验学生证，通过才能发布内容' },
            { k: '内容治理', v: '敏感词过滤 + 举报审核 + 管理员审计日志' },
            { k: '真实使用', v: 'SSE 实时私信、无限滚动、图片上传与重编码' },
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
          body: '学生端围绕「进来 → 看动态 → 找人 → 聊起来」这条主线设计。登录页把品牌主张和表单分成左右两栏，左侧用雷达图隐喻「发现同校的人」，右侧是干净的表单，验证码和协议勾选一个不少。',
        },
        {
          type: 'shot',
          src: '/media/campus/login.webp',
          alt: '校园圈子学生登录页',
          caption: '登录页：左侧品牌区用同心圆雷达表达「认识同校的人」，右侧表单含图形验证码、用户协议勾选与管理员入口。',
        },
        {
          type: 'text',
          body: '登录后是学生中心。这一屏的信息密度是刻意做高的——实名状态、贡献动态数、未读通知、未读私信四个数字直接摆在最显眼的位置，下面是校园公告和快捷操作。学生一进来就知道自己该做什么。',
        },
        {
          type: 'shot',
          src: '/media/campus/dashboard-1960.webp',
          alt: '校园圈子学生中心',
          caption: '学生中心：左侧固定导航（学生中心 / 动态广场 / 同学），顶部实名状态胶囊，四格数据卡与校园公告。',
        },
        {
          type: 'text',
          body: '动态广场是使用最频繁的页面。支持按关键词、标签、学院三重筛选，右侧常驻发布入口和广场公约。动态卡片带标签（如「代码」「网站」）和图片，图文混排不会挤成一团。',
        },
        {
          type: 'shot',
          src: '/media/campus/feed.webp',
          alt: '校园圈子动态广场',
          caption: '动态广场：三重筛选（关键词 / 标签 / 学院）、共 17 条动态计数、右侧发布区与广场公约。',
        },
        {
          type: 'text',
          body: '「同学」页把 19 位实名认证用户按卡片铺开，每人显示姓名、性别、兴趣标签、学院、年级和专业，点「查看主页」进入个人页。这是校园社交里最关键的一步——把 ID 变成具体的人。',
        },
        {
          type: 'shot',
          src: '/media/campus/students.webp',
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
          body: '站内集成了一个 AI 助手，用自然语言就能查同学、查动态、查公告。它不是一个挂在页面角落的装饰——底层通过工具调用（Tool Calling）去查真实数据库，回答里会显示「已使用 queryCampusInfo」这样的调用痕迹。',
        },
        {
          type: 'shot',
          src: '/media/campus/ai-assistant.webp',
          alt: 'AI 校园小助手对话界面',
          caption: 'AI 助手：支持多轮对话与追问，回答前展示「已深度思考」状态，并标注实际调用的查询工具。',
        },
        {
          type: 'text',
          body: '比如问「有没有一个姓王的同学」，助手会先说明自己的职责边界，再调用查询工具返回真实结果，而不是编一个人名出来。这个设计上的取舍很重要：校园场景里，编造信息的代价比查不到更高。',
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
          body: '后台是 12 个模块的完整体系，不是一个简单的删除列表。总览页给出待审核、已通过、已停用、违规动态四个关键计数，并支持管理员二次验证（登录后额外校验 6 位动态验证码）。',
        },
        {
          type: 'shot',
          src: '/media/campus/admin-overview.webp',
          alt: '校园圈子管理后台总览',
          caption: '后台总览：四项核心计数、管理员二次验证开关，以及 12 个管理功能的快捷入口网格。',
        },
        {
          type: 'text',
          body: '学生管理承担实名审核。每位待审学生都带学生证照片、学号、真实姓名、联系方式、学院年级专业和出生日期，管理员可以「通过」「退回」「停用」，每一条操作都留痕。',
        },
        {
          type: 'shot',
          src: '/media/campus/admin-students.webp',
          alt: '学生实名审核与账号管理',
          caption: '学生管理：19 名学生名单，含学生证照片预览与「通过 / 退回 / 停用」三态操作。',
        },
        {
          type: 'text',
          body: '内容侧有四套独立的管理面板，各自带搜索、计数与 CSV 导出：动态管理可删除违规动态；评论管理可按内容或评论者检索；私信审计能看到完整对话内容（包括与 AI 助手的交互）；举报审核则是待处理队列。',
        },
        {
          type: 'shot',
          src: '/media/campus/admin-dynamics.webp',
          alt: '动态内容管理',
          caption: '动态管理：22 条动态列表，显示发布者、内容、图片、点赞评论数、状态，支持 CSV 导出。',
        },
        {
          type: 'shot',
          src: '/media/campus/admin-comments.webp',
          alt: '评论管理',
          caption: '评论管理：31 条评论，可按评论内容或评论者搜索，标注所属动态发布者。',
        },
        {
          type: 'shot',
          src: '/media/campus/admin-messages.webp',
          alt: '私信审计',
          caption: '私信审计：75 条私信记录，含发送者、接收者、内容、已读状态与时间。',
        },
        {
          type: 'shot',
          src: '/media/campus/admin-reports.webp',
          alt: '举报审核队列',
          caption: '举报审核：待处理举报队列，含举报人、对象、原因、目标内容与操作。',
        },
        {
          type: 'text',
          body: '最值得一提的是审计日志。每一条管理员操作都被记录下来，并且支持「回滚」。删除过的私信、动态都能恢复——这在校园场景里非常必要，因为误删一个学生的内容可能意味着丢失证据或引发争议。',
        },
        {
          type: 'shot',
          src: '/media/campus/admin-audit.webp',
          alt: '管理员审计日志',
          caption: '审计日志：39 条管理员操作记录，含管理员、目标对象、操作类型、详情与时间，删除类操作可一键回滚。',
        },
        {
          type: 'text',
          body: '管理员账号本身也做了分级：超级管理员可以创建运营管理员并分配角色、设置启用状态，避免权限集中在单一账号上。',
        },
        {
          type: 'shot',
          src: '/media/campus/admin-accounts.webp',
          alt: '管理员账号管理',
          caption: '管理员账号：支持新建管理员、分配角色（超级管理员 / 运营管理员）、设置启用状态。',
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
          body: '后端用 PHP + MySQL，没有引入重框架。这个选择是有意的：整套服务部署在我自己购买并维护的云服务器上，从环境搭建、域名解析到上线运维都要自己扛，技术栈越轻越可控。所有数据库操作走预处理语句，表单加 CSRF token，密码用 bcrypt 加盐哈希，登录有频率限制。',
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
          body: '最大的转变发生在测试上。一开始我觉得校园小项目不需要端到端测试，直到一次改动打乱了登录流程却没人发现。加上 Playwright 之后，每次提交都能自动跑一遍关键路径，改功能才敢改得动。',
        },
        {
          type: 'points',
          items: [
            { k: '安全要前置', v: '预处理语句和 CSRF 不是"以后再加"，是写第一行代码时就要有的习惯' },
            { k: '实时要留退路', v: 'SSE 很好用，但不是所有网络环境都稳定，轮询回退让消息不会真的丢' },
            { k: '管理要留痕', v: '审计日志加回滚，比事后道歉有用得多' },
            { k: 'AI 要有边界', v: '让助手查真实数据、明确说自己能力范围，比让它自由发挥更可信' },
          ],
        },
      ],
    },
  ],
};

/* ============================================================
   其他项目
   ============================================================ */

export const projects = [
  {
    id: 'gomoku',
    slug: 'gomoku',
    title: 'Transformer Gomoku 对弈 Bot',
    category: '算法系统',
    year: '2026',
    period: '2026.04 — 2026.06',
    image: '/media/project-gomoku.webp',
    tag: 'C++ · Game AI',
    description: '15×15 五子棋对弈 Bot，支持换手规则，通过 JSON 协议与对弈平台交互。',
    detail: {
      challenge:
        '五子棋的棋形组合极其庞大：评估既要覆盖活二、活三、冲四、活四、连五，也要处理双活三、四三等复合威胁，同时还要把搜索耗时压住。',
      solution:
        '用候选点生成收窄搜索空间，以棋形库加加权估值快速打分，将进攻与防守权重分离调参，再通过大量自我对弈验证策略稳定性。',
      modules: ['候选点生成与棋形库', '加权估值与组合威胁', '换手规则支持', 'JSON 协议交互'],
    },
    github: 'https://github.com/2676136489-png/Gomoku-match',
  },
  {
    id: 'station',
    slug: 'station',
    title: '菜鸟驿站快递管理系统',
    category: '系统设计',
    year: '2024',
    period: '2024.09 — 2024.12',
    image: '/media/project-station.webp',
    tag: 'C Language · 独立完成',
    description: '双角色（管理员 / 顾客）校园快递站系统，按 UI、认证、业务三层划分实现。',
    detail: {
      challenge:
        '快递、用户、费用与库存状态彼此关联，需要在命令行环境中保持清晰的角色边界和可追踪的数据流。',
      solution:
        '通过链表组织快件数据，实现智能计费、取件码、状态机流转、物流轨迹、库存预警与操作日志等完整的增删改查闭环。',
      modules: ['智能计费模型', '状态机流转与物流轨迹', '库存预警与操作日志', '用户权限管理'],
    },
    github: 'https://github.com/2676136489-png/Cainiao-Station',
  },
  {
    id: 'wiki',
    slug: 'wiki',
    title: 'iGEM Glass Wiki 插件',
    category: 'Web 组件',
    year: '2026',
    period: '2026.07',
    image: '/media/project-wiki.webp',
    tag: 'HTML · CSS · JavaScript',
    description: '面向 iGEM 团队的多页面 Wiki 模板，静态优先架构，附带可复用的界面与交互插件。',
    detail: {
      challenge:
        '竞赛 Wiki 页面数量多、证据密度高，还要兼顾评审浏览顺序、跨页面一致性、移动端体验与静态仓库部署约束。',
      solution:
        '用共享设计系统统一导航、卡片与内容结构，把命令面板、悬浮 Dock、证据筛选、术语提示和滚动叙事拆成可复用模块。',
      modules: ['多页面信息架构', '可复用交互插件', '主题与响应式导航', '静态优先部署'],
    },
    github: 'https://github.com/2676136489-png/wiki-plugin',
  },
  {
    id: 'portfolio',
    slug: 'portfolio',
    title: '个人作品集',
    category: '前端开发',
    year: '2026',
    period: '2026.07 — 2026.08',
    image: '/media/project-dashboard.webp',
    tag: 'React · Vite',
    description: '从零搭建的响应式作品集，包含项目分页、主题切换、命令面板与实时状态组件。',
    detail: {
      challenge:
        '作品集要在第一屏说清「我是谁」，同时承载项目、能力、成绩三类信息，还要保证手机端的阅读节奏不被打断。',
      solution:
        '以信息层级优先组织结构，把交互能力（搜索、复制、分享、快捷键）收进克制的组件里，让内容本身成为主角。',
      modules: ['多页路由架构', '主题与动效系统', '命令面板交互', '移动端适配'],
    },
    github: 'https://github.com/2676136489-png/personal-design',
  },
  {
    id: 'identity',
    slug: 'identity',
    title: '校园服务视觉系统',
    category: '品牌视觉',
    year: '概念',
    period: 'Exploration',
    image: '/media/project-identity.webp',
    tag: 'Brand Direction',
    description: '围绕校园服务场景建立理性、清晰、可信赖的视觉方向，用克制的色彩与网格表达科技感。',
    detail: {
      challenge: '校园服务既要有年轻感，也要保持公共服务所需的清晰、可靠与可扩展性。',
      solution:
        '以网格为骨架统一版式，用有限的高识别色连接图形、界面与传播物料，并探索 AI 辅助的视觉延展。',
      modules: ['品牌语气', '信息架构', '视觉系统', 'AI 辅助延展'],
    },
  },
];

export const capabilities = [
  {
    title: 'AI 原生开发',
    text: '熟练使用主流大模型完成需求拆解、架构设计、代码实现、测试与迭代，把 AI 融入真实交付流程。',
    tags: ['LLM / RAG', 'Agent / MCP', 'Prompt Engineering'],
  },
  {
    title: '工程与算法',
    text: 'C/C++ 算法与数据结构打底，贯通 Python 工程化、PHP/MySQL 后端与前端实现。',
    tags: ['C / C++', 'FastAPI · Docker', 'PHP · MySQL'],
  },
  {
    title: '前端与界面',
    text: 'HTML / CSS / JavaScript 与 TypeScript、React、Vite、SSE，关注信息层级与真实可用。',
    tags: ['React · TypeScript', 'Vite', 'SSE'],
  },
  {
    title: '组织与推进',
    text: '校优秀学生干部。持续训练沟通、任务拆解与协作推进，把共识变成具体行动。',
    tags: ['沟通协调', '任务拆解', '团队协作'],
  },
];

export const achievements = [
  { title: '吉林大学三等奖学金', meta: '2024 — 2025 学年' },
  { title: '校优秀学生干部', meta: '2024 — 2025 学年' },
  { title: '数学建模竞赛省级三等奖', meta: '2025' },
  { title: '大学英语四级 CET-4', meta: '已通过' },
  { title: '专业排名前 30%', meta: 'GPA 3.1 / 4' },
  { title: '开源项目持续维护', meta: 'GitHub 6 个仓库' },
];

export const timeline = [
  { year: '2026', title: '校园圈子上线', text: '独立完成实名社交平台，从架构到测试全部落地并部署运行。' },
  { year: '2026', title: 'Transformer Gomoku Bot', text: 'C++ 五子棋对弈 Bot，棋形库加权估值覆盖复合威胁。' },
  { year: '2026', title: 'iGEM Wiki 插件', text: '为竞赛团队搭建多页面 Wiki 模板与可复用交互组件。' },
  { year: '2024', title: '菜鸟驿站管理系统', text: '独立完成 C 语言系统项目，从数据结构到业务闭环。' },
  { year: '2024', title: '进入吉林大学', text: '计算机科学与技术本科，GPA 3.1/4，专业排名前 30%。' },
];
