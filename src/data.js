/* 图片素材统一走 WebP（scripts/optimize-images.py 生成）。
   截图原 PNG 单张接近 1MB，首屏大图弱网下要等 1 秒以上、看起来像加载失败，
   转 WebP 后整站图片从 12.7MB 降到 0.85MB。 */
/* 部署基路径：WorkBuddy 主站是 '/'，GitHub Pages 项目站是 '/personal-design/'。
   public/ 下的图片以 JS 字符串字面量引用时 Vite 不会改写路径，
   必须自己拼 import.meta.env.BASE_URL，否则子路径部署时图片全部 404。 */
const BASE = import.meta.env.BASE_URL;
export const asset = (path) => `${BASE}${path.replace(/^\//, '')}`;

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
  tagline: '把校园里的想法，做成真正能用的产品。',
  heroIntro: '用工程能力承载想法，用设计判断组织信息，把课堂里的题目做成别人真的会打开来用的东西。',
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

/* 简历页数据：与 D:\UserData\Desktop\简历制作\简历\卢柯宇简历_2026新版 保持一致。
   改简历时这里要同步改，否则线上简历页会和 PDF 对不上。 */
export const resume = {
  updated: '2026 年 9 月',
  summary:
    '计算机科学与技术本科，独立交付多个 GitHub 项目，熟悉 C/C++ 算法系统，了解 HTML、CSS、JavaScript 与 React/TypeScript 等前端内容与 PHP/MySQL 全栈；熟练使用 GPT、DeepSeek、Kimi 等大模型完成需求拆解、架构设计、代码实现、测试与迭代，形成 AI 原生开发工作流。',
  education: [
    {
      school: '吉林大学',
      major: '计算机科学与技术 · 本科',
      period: '2024.09 - 2028.06',
      gpa: 'GPA 3.1 / 4',
      points: [
        '专业排名前 30%',
        '核心课程：数据结构、算法设计与分析、操作系统、计算机组成原理、计算机系统结构',
      ],
    },
  ],
  skillGroups: [
    ['Python 工程化', 'FastAPI、PostgreSQL/MySQL、Redis、Docker'],
    ['LLM / RAG', 'Embedding、向量数据库、Rerank、Prompt Engineering'],
    ['Agent', 'LangGraph、MCP、Tool Calling、Evaluation'],
    ['算法 / 系统', 'C/C++、数据结构、机器学习、PyTorch、Transformer'],
    ['后端', 'PHP、MySQL、REST API、Docker Compose、GitHub Actions'],
    ['前端', 'HTML/CSS/JS、TypeScript、Vite、SSE'],
  ],
  honors: [
    { title: '大学英语四级（CET-4）', period: '' },
    { title: '吉林大学三等奖学金', period: '2024.09 - 2025.09' },
    { title: '吉林大学校优秀学生干部', period: '2024.09 - 2025.09' },
    { title: '数学建模省三', period: '2025.08 - 2025.09' },
  ],
  /* 简历页只列 PDF 里出现过的那几个项目，与投递版本保持一致。
     顺序按简历原文：校园圈子 → Gomoku → 菜鸟驿站 → 个人作品集。 */
  projectSlugs: ['campus', 'gomoku', 'station', 'portfolio'],
};

export const navItems = [
  { id: 'top', label: '首页', href: '#/' },
  { id: 'campus', label: '校园圈子', href: '#/campus' },
  { id: 'work', label: '全部作品', href: '#/#work' },
  { id: 'skills', label: '能力', href: '#/#skills' },
  { id: 'resume', label: '简历', href: '#/resume' },
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
  cover: asset('/media/campus/dashboard-1960.webp'),

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
          src: asset('/media/campus/login.webp'),
          alt: '校园圈子学生登录页',
          caption: '登录页：左侧品牌区用同心圆雷达表达「认识同校的人」，右侧表单含图形验证码、用户协议勾选与管理员入口。',
        },
        {
          type: 'text',
          body: '登录后是学生中心。这一屏的信息密度是刻意做高的——实名状态、贡献动态数、未读通知、未读私信四个数字直接摆在最显眼的位置，下面是校园公告和快捷操作。学生一进来就知道自己该做什么。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/dashboard-1960.webp'),
          alt: '校园圈子学生中心',
          caption: '学生中心：左侧固定导航（学生中心 / 动态广场 / 同学），顶部实名状态胶囊，四格数据卡与校园公告。',
        },
        {
          type: 'text',
          body: '动态广场是使用最频繁的页面。支持按关键词、标签、学院三重筛选，右侧常驻发布入口和广场公约。动态卡片带标签（如「代码」「网站」）和图片，图文混排不会挤成一团。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/feed.webp'),
          alt: '校园圈子动态广场',
          caption: '动态广场：三重筛选（关键词 / 标签 / 学院）、共 17 条动态计数、右侧发布区与广场公约。',
        },
        {
          type: 'text',
          body: '「同学」页把 19 位实名认证用户按卡片铺开，每人显示姓名、性别、兴趣标签、学院、年级和专业，点「查看主页」进入个人页。这是校园社交里最关键的一步——把 ID 变成具体的人。',
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
          body: '站内集成了一个 AI 助手，用自然语言就能查同学、查动态、查公告。它不是一个挂在页面角落的装饰——底层通过工具调用（Tool Calling）去查真实数据库，回答里会显示「已使用 queryCampusInfo」这样的调用痕迹。',
        },
        {
          type: 'shot',
          src: asset('/media/campus/ai-assistant.webp'),
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
          src: asset('/media/campus/admin-overview.webp'),
          alt: '校园圈子管理后台总览',
          caption: '后台总览：四项核心计数、管理员二次验证开关，以及 12 个管理功能的快捷入口网格。',
        },
        {
          type: 'text',
          body: '学生管理承担实名审核。每位待审学生都带学生证照片、学号、真实姓名、联系方式、学院年级专业和出生日期，管理员可以「通过」「退回」「停用」，每一条操作都留痕。',
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
          body: '最值得一提的是审计日志。每一条管理员操作都被记录下来，并且支持「回滚」。删除过的私信、动态都能恢复——这在校园场景里非常必要，因为误删一个学生的内容可能意味着丢失证据或引发争议。',
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

/* ============================================================
   其他项目
   数据取自各仓库 README 与本机实测，不做超出来源的推断。
   ============================================================ */

export const projects = [
  {
    id: 'gomoku',
    slug: 'gomoku',
    title: 'Transformer Gomoku 对弈 Bot',
    category: '算法系统',
    year: '2026',
    period: '2026.04 — 2026.06',
    image: asset('/media/project-gomoku.webp'),
    tag: 'C++17 · jsoncpp',
    description: '15×15 五子棋对弈 Bot，支持换手规则，通过 JSON 协议与对弈平台交互。',
    role: '独立开发',
    stack: 'C++17 · jsoncpp',
    lede: '跑在 Botzone 上的五子棋 Bot。不靠搜索树堆算力，而是把「棋形识别 + 加权估值」这条路线做到足够扎实，并诚实地标出它的能力边界。',
    metrics: [
      { value: '15×15', label: '标准棋盘' },
      { value: '7', label: '基础棋形' },
      { value: '3', label: '组合威胁类型' },
      { value: '1.2', label: '防守权重系数' },
      { value: '2', label: '候选点生成半径' },
      { value: '1', label: '单文件实现' },
    ],
    github: 'https://github.com/2676136489-png/Gomoku-match',
    chapters: [
      {
        id: 'brief',
        nav: '项目约束',
        kicker: '01',
        title: '在这个平台上，规则比算法更难缠',
        blocks: [
          {
            type: 'text',
            body: 'Botzone 的对弈方式很克制：程序从标准输入读一行 JSON，向标准输出写一行 JSON，一局棋就是若干次这样的往返。这意味着 Bot 必须自己从历史 requests / responses 里把棋盘还原出来——平台不会给你一份现成的棋盘数组。',
          },
          {
            type: 'text',
            body: '另一个约束是换手规则：白棋可以在开局阶段选择换手，把先手优势收回来。这直接决定了开局策略不能只看当前局面，还要预判对手会不会把局面丢回来。',
          },
          {
            type: 'points',
            items: [
              { k: '协议驱动', v: '每行一个 JSON，输入输出严格对齐 Botzone 的 requests / responses 格式' },
              { k: '无状态', v: '每次调用需从历史记录重建棋盘，并处理换手去重' },
              { k: '轻量依赖', v: '仅用平台自带的 jsoncpp，单文件 bot.cpp 即可提交' },
            ],
          },
        ],
      },
      {
        id: 'pipeline',
        nav: '决策流程',
        kicker: '02',
        title: '每一步怎么落子',
        blocks: [
          {
            type: 'text',
            body: '整套决策是一条五步流水线。它的关键点在第 3 步——不只对「我下这里」打分，也对「对手下这里」打分，把两个分数合起来决定落点。这相当于在没有搜索树的前提下塞进了一层防守直觉。',
          },
          {
            type: 'points',
            items: [
              { k: '01 还原棋盘', v: '依据历史 requests / responses 重建双方落子，并处理换手' },
              { k: '02 收窄范围', v: '调用 exploreNewPoint，只在已有棋子周围 2 格生成候选点' },
              { k: '03 双向打分', v: '对每个候选点分别计算己方得分与对方得分' },
              { k: '04 综合取舍', v: '综合得分 = 己方得分 + 对方得分 × 1.2' },
              { k: '05 胜负判定', v: '己方有连五点直接取胜；对方有连五点优先封堵' },
            ],
          },
          {
            type: 'text',
            body: '那个 1.2 是整个 Bot 最重要的手工参数。它大于 1，意味着对手在同一位置的威胁权重更高——宁可自己慢一步，也不能让对手先成型。',
          },
        ],
      },
      {
        id: 'shapes',
        nav: '棋形与估值',
        kicker: '03',
        title: '把棋感翻译成数字',
        blocks: [
          {
            type: 'text',
            body: '棋力上限取决于棋形库覆盖得够不够、分值拉得开不开。这里采用指数级分档：成形越强，分值跨越越大，确保 Bot 永远优先处理最紧迫的那一侧。',
          },
          {
            type: 'table',
            head: ['棋形', '分值'],
            rows: [
              ['活二 / 跳活二', '100'],
              ['眠二', '50'],
              ['活三 / 跳活三', '1000'],
              ['眠三', '500'],
              ['冲四', '10000'],
              ['活四', '50000'],
              ['连五', '10000000'],
              ['双活三', '8000'],
              ['四三', '9000'],
              ['双冲四', '100000'],
            ],
            caption: '基础棋形与组合威胁分值表。连五取一千万，保证任何情况下必胜点都被优先命中。',
          },
          {
            type: 'text',
            body: '组合威胁的分值并不简单等于两个基础棋形相加。四三给 9000，比双活三的 8000 略高一档——这是按「对手能否单步化解」排的顺序，而不是按子元素分值累加。',
          },
        ],
      },
      {
        id: 'swap',
        nav: '换手处理',
        kicker: '04',
        title: '先手不一定是好东西',
        blocks: [
          {
            type: 'text',
            body: '换手规则下，黑棋开局落得太强反而会被对手直接要走。当前策略是：黑棋首手落在中腹 3~11 区域时选择换手，否则依据首手估值决定是否换手；同时黑棋首手从四角 2×2 开局池中随机选取，避免被对手预判。',
          },
          {
            type: 'code',
            lang: 'json',
            caption: 'Botzone 输入输出示例：所有坐标均以 -1 表示换手。',
            lines: [
              '// 轮到黑棋先手',
              '{"requests":[{"x":-1,"y":-1}],"responses":[]}',
              '',
              '// 落子于 (1, 1)',
              '{"response":{"x":1,"y":1}}',
              '',
              '// 选择换手',
              '{"response":{"x":-1,"y":-1}}',
            ],
          },
        ],
      },
      {
        id: 'stack',
        nav: '技术构成',
        kicker: '05',
        title: '一个小 Bot 的工程面',
        blocks: [
          {
            type: 'arch',
            groups: [
              {
                title: '语言与依赖',
                items: ['C++17 或更高', 'jsoncpp 解析 JSON', '单文件 bot.cpp 提交'],
              },
              {
                title: '棋盘处理',
                items: ['历史记录还原棋局', '换手去重', '15×15 边界判定'],
              },
              {
                title: '策略层',
                items: ['exploreNewPoint 候选点生成', '棋形匹配', '双向加权估值'],
              },
              {
                title: '本地运行',
                items: ['g++ -std=c++17 -O2', '链接 -ljsoncpp', 'Botzone 内置环境免配置'],
              },
            ],
          },
        ],
      },
      {
        id: 'limits',
        nav: '已知边界',
        kicker: '06',
        title: '它做不到什么',
        blocks: [
          {
            type: 'text',
            body: '这是一个单层贪心估值 Bot，没有搜索树。对需要多步计算的杀棋（VCF / VCT）识别能力有限——这一点不打算含糊过去，因为对 Bot 来说，承认边界本身就是设计的一部分。',
          },
          {
            type: 'points',
            items: [
              { k: '无前向搜索', v: '纯单步估值，看不到两步以上的连续威胁组合' },
              { k: '棋形库不完整', v: '带空位冲四、部分活三与边界眠三尚未完整收录' },
              { k: '权重待调优', v: '候选点半径与防守系数仍依赖经验取值' },
              { k: '已知后续', v: '可引入 minimax / alpha-beta 或蒙特卡洛方法继续提升' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'station',
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
    lede: '一个用纯 C 写的快递驿站系统，只依赖标准库和控制台 API。把业务规则、状态流转和可视化界面分层拆开，让命令行程序也有可读的信息层次。',
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
        title: '用最薄的依赖，做最完整的闭环',
        blocks: [
          {
            type: 'text',
            body: '这门课的设计常常停在「能跑就行」的单文件练习上。我想看看反过来的路径：把依赖压到只剩 C 标准库和控制台 API，把复杂度全部投到业务本身——计费规则、状态流转、权限边界、持久化格式，这些才是系统里真正难的部分。',
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
            body: '运费不是简单乘法。它由寄送方式（标准 / 加急）、距离（省内 / 省外）、重量三档决定首重与续重，再叠加价值加成与保价费——六条规则交叉出六种组合。',
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
            body: '寄件界面会把基础运费、续重费、高价值加成、保价费拆开展示。这样做的好处是：用户在按回车确认之前就知道钱花在哪一项上。',
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
            body: '时间维度上有两条自动流转规则：入库超过 3 天未取件标记为超时滞留；运输超过 3 天自动模拟送达并转为待取件。程序每次启动时会跑一次业务仿真，把该变的都变掉，而不是让数据停在写库那一刻。',
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
            body: '持久化选择文本文件而不是二进制结构体写入。代价是解析稍麻烦，收益是数据可读、可 diff、可手工修复，而且彻底绕开了结构体对齐在不同编译器与平台上的差异。对课程项目来说，这个取舍很重要——验收的人能直接打开 data/users.txt 看懂。',
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
    lede: '一套给竞赛团队用的多页面 Wiki 模板：19 个页面共享同一份设计系统，9 个交互插件拆成可直接搬走的单页 demo。全程零构建——双击 index.html 就能看。',
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
            body: 'iGEM 的 Wiki 有硬约束：最终的内容、图片、脚本与样式必须全部放进 iGEM 自己的 GitLab 仓库里，评审在那套环境里看你的页面。这意味着任何依赖 Node 构建、CDN 资源或外部服务的方案都会在实际交付时失效——模板必须是静态优先的。',
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
            body: '页面不是随手堆的，而是按评审阅读顺序排的：先看项目描述，再看设计、建模、工程与结果，然后是安全、人类实践、贡献与 attribution。每条都对应评审表格里的一项，团队填内容时不用自己想信息放哪。',
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
            body: '每个插件都是独立单页，带自己的 demo 与说明。团队需要哪个就把那段 HTML 与对应的 JS 初始化部分剪到自己的页面里——不用为了一个滚动效果引入一整套框架。',
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
            body: '仓库根是一个可直接打开的静态站，但 includes/ 下同时提供了 nav.php、footer.php 与 config.php 三个片段。想要抽公共导航的团队可以用 PHP include 引入，不想的就各页各写——两条路都不影响静态版本独立运行。',
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
    slug: 'portfolio',
    title: '个人作品集',
    category: '前端开发',
    year: '2026',
    period: '2026.07 — 2026.08',
    image: asset('/media/project-dashboard.webp'),
    tag: 'React 19 · Vite 6',
    description: '从零搭建的响应式作品集，包含项目分页、主题切换、命令面板与实时状态组件。',
    role: '独立开发 · AI 辅助工程',
    stack: 'React 19 · Vite 6 · 手写 CSS',
    lede: '你现在正在看的这个站点。它同样是一次完整交付：多页面信息架构、手写设计系统、自建动效层，以及一条打通两个不同域名的一键同步流程。',
    metrics: [
      { value: '6', label: '动效子系统' },
      { value: '23', label: '张 WebP 素材' },
      { value: '93%', label: '图片体积降幅' },
      { value: '2', label: '个线上域名' },
      { value: '5', label: '个邮箱客户端' },
      { value: '0', label: 'UI 框架依赖' },
    ],
    github: 'https://github.com/2676136489-png/personal-design',
    site: 'https://2676136489-png.github.io/personal-design/',
    chapters: [
      {
        id: 'arch',
        nav: '信息架构',
        kicker: '01',
        title: '主打项目值得单独一页',
        blocks: [
          {
            type: 'text',
            body: '一开始所有内容挤在一张长页面上，结果项目只能放三行简介。改成分页之后，校园圈子这种有真实运营数据的项目有了完整展开的空间：六个章节、左侧目录跟随、20 张真实截图按业务流排布。',
          },
          {
            type: 'text',
            body: '路由只有 36 行，是自己实现的 hash 路由，没有引入 react-router。站点是纯内容展示，不需要路由守卫、懒加载分包这些能力，一个 useState 加 hashchange 监听就够了。',
          },
          {
            type: 'points',
            items: [
              { k: '首页', v: '一句话定位 + 数据条 + 作品概览，负责让人留下' },
              { k: '项目详解页', v: '主打项目的六个章节，校园圈子在这一层展开' },
              { k: '普通项目页', v: '同一套文档布局，按项目各自的素材密度编排' },
              { k: '锚点回跳', v: '从子页面回首页的具体区块，URL 里保留锚点并平滑滚动' },
            ],
          },
        ],
      },
      {
        id: 'design',
        nav: '设计语言',
        kicker: '02',
        title: '把「不像 AI 做的」当成需求',
        blocks: [
          {
            type: 'text',
            body: '第一版做出来的东西有一股明显的模板味：玻璃拟态卡片、彩色渐变光斑、装饰性网格背景，标题字重用到 800 以上。这些元素单独看都很炫，堆在一起就露怯了。',
          },
          {
            type: 'text',
            body: '重做时定的规矩很简单——只允许一种强调色，剩下的层次交给留白、字距和一条 1px 的发丝线去做。',
          },
          {
            type: 'arch',
            groups: [
              {
                title: '字体',
                items: ['SF Pro Display / Text 优先', '回退到 PingFang SC', '标题负字距 -0.015em', '字重只用 400 / 500 / 600'],
              },
              {
                title: '色彩',
                items: ['浅色 #0071e3 / 深色 #2997ff 单一蓝', '页面 #ffffff，抬升面 #f5f5f7', '分隔线 1px rgba(0,0,0,.09)', '不出现第二个彩色体系'],
              },
              {
                title: '版面',
                items: ['内容宽度 1080px，宽屏 1320px', '顶栏 48px 黏性毛玻璃', '胶囊按钮 980px 圆角', '章节之间用大留白而非分割线'],
              },
              {
                title: '删除项',
                items: ['玻璃拟态', '彩色光斑背景', '装饰网格', '渐变文字', '超重字重'],
              },
            ],
          },
        ],
      },
      {
        id: 'motion',
        nav: '动效层',
        kicker: '03',
        title: '自己写动效，而不是装依赖',
        blocks: [
          {
            type: 'text',
            body: '动效没有引入任何第三方库。src/motion.jsx 里是六个 Hook，页面只调一次 usePageMotion() 就全部接上。好处除了体积，更重要的是手感可以逐个微调——比如卡片倾斜到底转几度，是靠眼睛定的。',
          },
          {
            type: 'table',
            head: ['子系统', '职责'],
            rows: [
              ['useReveal', '滚动到视口时揭示，五种入场变体，支持 --i 错峰延迟'],
              ['useScrollEngine', '全局单一 rAF 循环驱动视差与阅读进度'],
              ['usePointerTilt', '卡片跟随指针做不超过 4° 的三维微倾 + 跟随高光'],
              ['useMagneticPointer', '按钮朝指针方向平移约 3px 的磁吸反馈'],
              ['useCountUp', '指标数字缓动到目标值'],
              ['useSlidingIndicator', '导航高亮滑块跟随滚动 section 移动'],
            ],
            caption: '六个 Hook 各管一件事，互不耦合，可以单独关掉任意一个。',
          },
          {
            type: 'text',
            body: '性能上有两条硬约束：位移只碰 transform 与 opacity，全程只跑一个 rAF 循环。另外触摸设备自动跳过所有指针效果，prefers-reduced-motion 打开时整套退化为静态。',
          },
        ],
      },
      {
        id: 'assets',
        nav: '素材与性能',
        kicker: '04',
        title: '12.7MB 压到 0.85MB',
        blocks: [
          {
            type: 'text',
            body: '校园圈子的 14 张界面截图原本是 PNG，单张接近 1MB。在托管服务器上实测下载速率只有约 1MB/s，首屏大图要等一秒以上——用户看到的就是一张白板，很容易误判成图片挂了。',
          },
          {
            type: 'points',
            items: [
              { k: '转换策略', v: '写脚本批量转 WebP，并按 980 / 1960 两档输出响应式版本' },
              { k: '实际收益', v: '整站图片 12.7MB → 0.85MB，降幅 93%' },
              { k: '加载策略', v: '首屏图 fetchPriority=high，其余 lazy；给出宽高避免回流' },
              { k: '素材来源', v: '全部换成真实界面截图，不使用 AI 生成的示意配图' },
            ],
          },
        ],
      },
      {
        id: 'deploy',
        nav: '双域名部署',
        kicker: '05',
        title: '同一个源码，两种基路径',
        blocks: [
          {
            type: 'text',
            body: '站点同时部署在两个域名上：一个是根目录 base 的国内托管，另一个是 GitHub Pages 的项目站，路径带 /personal-design/ 前缀。问题出在这里——Vite 只会改写 HTML 与 import 的资源路径，不会动 JS 里的字符串字面量。',
          },
          {
            type: 'text',
            body: '于是所有写在 JS 里的图片路径都保持根绝对路径，在 Pages 上被请求到了缺少仓库名的地址，全站图片集体 404。修法是在数据层加一个基路径助手，让每条路径都经过它：',
          },
          {
            type: 'code',
            lang: 'js',
            caption: 'src/data.js —— 让图片路径感知部署基路径。',
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
            body: '配套的 scripts/deploy-pages.mjs 把构建、写入 .nojekyll、强制推送 gh-pages 三件事合成一条命令。产物走独立分支，主分支只留源码——20 多张截图塞进主仓库会让克隆变得很难看。',
          },
        ],
      },
      {
        id: 'interaction',
        nav: '交互细节',
        kicker: '06',
        title: '那些不起眼但会被用到的地方',
        blocks: [
          {
            type: 'points',
            items: [
              { k: '发邮件', v: 'mailto: 依赖本机邮件客户端，很多人点了没反应；改成下拉选择 QQ / 163 / Outlook / Gmail / Foxmail 后跳转对应网页写信页' },
              { k: '命令面板', v: '⌘K 唤起，一次搜索直达任意页面与任意项目' },
              { k: '主题记忆', v: '深浅色跟随系统偏好，手动切换后写入 localStorage' },
              { k: '移动端', v: '顶栏折叠为抽屉，文档页的左侧目录转为横向滚动胶囊' },
              { k: '联系方式', v: '页脚邮箱改为点击复制，避免移动端长按选中的麻烦' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'identity',
    slug: 'identity',
    title: '校园服务视觉系统',
    category: '品牌视觉',
    year: '概念',
    period: 'Exploration',
    image: asset('/media/project-identity.webp'),
    tag: 'Brand Direction',
    description: '围绕校园服务场景建立理性、清晰、可信赖的视觉方向，用克制的色彩与网格表达科技感。',
    role: '视觉方向探索',
    stack: 'Grid · Type · Color',
    lede: '一次尚未投产的视觉方向探索。它解决的不是「长什么样」，而是「校园服务应该在年轻感和可信赖之间站在哪一边」。',
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
            body: '校园产品容易被做成两种极端：要么是学生会海报式的活泼撞色，一眼就显得不专业；要么过度克制，端着一副办事大厅的冷面孔，学生根本不想点开。真正的难点在于两边都要——既要有人愿意用，也要让人相信上面的信息是真的。',
          },
          {
            type: 'points',
            items: [
              { k: '不可太轻', v: '涉及实名、通知、申诉的功能，视觉必须承载严肃性' },
              { k: '不可太重', v: '使用者是二十岁上下的人，官僚感会直接劝退' },
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
            body: '这一项刻意没有包装成完整案例。它在作品集里的作用有两个：一是说明我在做界面之前会先想定位问题；二是留一个诚实的样本——简历里的每个项目不一定都是上线产品，但每一个都该说清楚它到底到了哪一步。',
          },
          {
            type: 'text',
            body: '这套判断已经在别处落了地：校园圈子与这个作品集采用的都是同一种思路——单一强调色、大留白、结构优先于装饰。它们才是这套方法的实际验证。',
          },
        ],
      },
    ],
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
