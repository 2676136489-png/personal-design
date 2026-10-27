/**
 * 文案检查：把「别有 AI 味」这条要求变成能跑的断言。
 *
 * 为什么要有这个脚本：
 * 文案的问题（抽象名词堆砌、三段排比、破折号当停顿号用）
 * 靠肉眼容易漏，改动一多也保不住。所以把判据写成规则，
 * 每次改完跑一遍，风格不会随时间退回去。
 *
 * ⚠️ 规则要准，不要滥。
 * 第一版把「Python、PHP、C / C++」这种技术栈清单也报成排比，
 * 804 处噪声等于没有断言 —— 报出来的东西得是能改的。
 * 技术名词罗列是事实陈述，不算修辞，所以排比规则只抓
 * 「同一个词反复起头」和「从 A 到 B，从 C 到 D」这类真排比。
 *
 * 用法：node scripts/check-copy.mjs
 */
import { readFileSync } from 'node:fs';

/* ── 规则一：禁用词 ──────────────────────────────────────────────
   这些词在技术语境里偶尔能用（比如「业务闭环」确实是行业说法），
   但大多数时候是「把话写大」的信号，一律替换。 */
const BANNED_WORDS = [
  '赋能', '助力', '打造', '一站式', '全方位', '沉浸式', '引领', '开创',
  '革命性', '无与伦比', '匠心', '生态闭环', '旨在', '致力于', '专注于',
  '深度赋能', '海量', '一网打尽', '全新升级', '完美呈现', '尽在掌握',
  '触手可及', '强强联合', '保驾护航', '与时俱进', '势不可挡',
];

/* ── 规则二：破折号 ──────────────────────────────────────────────
   破折号（——）在中文技术文案里常被当成停顿号用，
   一句话里出现就说明作者没想好怎么断句。
   代码注释里允许出现（那是给开发者看的，不是给读者看的），
   这里只查用户能读到的文案。 */
const DASH = '——';

/* ── 规则三：单句长度与分句长度 ────────────────────────────────────
   参考大厂 README 的通行做法：中文单句不超过 25 字。
   ⚠️ 判定要按句号切，不能按逗号切 ——
   中文里逗号后仍是同一句话，「后端以 PHP 为主，具备 A、B、C 经验」
   是一句 40 字的话，不该算成三句短的。
   另外要排除代码结构行（`label: '9 个'` 这种），
   那是字段值不是句子，长度没有意义。
   ⚠️ 阈值分三档：界面文案 32 字、简历条目与技术清单 40 字、README 55 字。
   25 字是给「叙事正文」的，但界面上的 lede 常常要在一个句子里
   交代「是什么 + 怎么做的 + 现在什么状态」，压到 25 字会拆成碎句。
   32 字能容下这类完整的一句，又仍然拦得住真正的啰嗦。
   简历的项目分点本来就要把「做了什么 + 怎么做的」写在一句里，
   按 32 字卡会把信息砍掉，而信息量正是简历页存在的理由。 */
const MAX_SENTENCE = 32;
/** 简历条目与技术清单：允许更长，但仍有上限。 */
const MAX_SENTENCE_LIST = 40;
/** 这几行是简历的分点与技能清单，阈值放宽。 */
const LIST_LINE = /^\s*(advantages|projectHighlights|skillGroups|points|items)\b|^\s*'[^']*：/;
/** README 这类长文档的表格行、目录项、文件清单 —— 结构化信息不是散文。
 *  README 的正文已经是「开发者笔记」的口吻，句子天然比界面文案长；
 *  按界面文案的 25 字去卡它，会把表格行和目录全捞出来（74 处噪声）。 */
const DOC_TABLE_LINE = /^\s*\|/;
/** 文档里的缩进清单项（`- xxx` / `xxx  说明` 那种对齐的清单）。 */
const DOC_LIST_LINE = /^\s*[-*]\s+\S|^\s{2,}\S+\s{2,}\S/;

/* ── 分句长度：真正决定中文好不好读的指标 ──────────────────────────
   整句 130 字在简历分点里是正常的 —— 一条分点本来就要把
   「做了什么 + 怎么做的 + 实测数据」讲完。但中文读起来累不累，
   看的不是整句多长，而是**一个逗号之间有多长**。
   所以简历正文按分句卡，界面文案整句和分句都卡。 */
const MAX_CLAUSE = 32;

/** 这几个 key 下面的字符串是简历正文（分点、课程、技能清单）。
 *  它们是事实陈述，一条要把「做了什么 + 怎么做的 + 数据」讲完，
 *  整句长是正常的；但分句太长读者要读两遍才断得开，所以按分句卡。 */
const RESUME_TEXT_KEYS = new Set([
  'summary', 'advantages', 'projectHighlights', 'points', 'skillGroups',
]);

/** 阅读长度：中文一字算 1，英文单词算 1，标点不算。
 *  ⚠️ 不用原始字符数 —— 「后端用 PHP / MySQL 与 Python / FastAPI」
 *  原始 42 字，读者眼里其实只有 10 个单位（后端用 / 与 / PHP / MySQL / Python / FastAPI）。
 *  按原始字符数卡，这句话会被误判成超长；按阅读长度卡才反映真实负担。 */
function readingLength(s) {
  const cjk = (s.match(/[一-龥]/g) || []).length;
  const words = (s.match(/[A-Za-z]+(?:[0-9]+)?/g) || []).length;
  const nums = (s.match(/[0-9]+(?:\.[0-9]+)?/g) || []).length;
  return cjk + words + nums;
}

/** 一句话里最长的那个分句有多长（按逗号、顿号、分号切）。 */
function longestClause(sentence) {
  return sentence
    .split(/[，；、]/)
    .map((c) => c.trim())
    .filter(Boolean)
    .reduce((m, c) => Math.max(m, readingLength(c)), 0);
}

/** 这行是不是「字段名: 值」的代码结构，而不是一段话。 */
function isCodeShape(line) {
  const t = line.trim();
  /* key: '...'  或  { k: '...', v: '...' } */
  if (/^[A-Za-z_$][\w$]*\s*:\s*['"/]/.test(t)) return true;
  if (/^\{\s*[A-Za-z_$][\w$]*\s*:\s*['"/]/.test(t)) return true;
  /* 引号键：'前端开发': { slug: 'frontend', blurb: '...' }
     键名本身是中文标签，整行是对象字面量，不是散文。
     ⚠️ 漏掉这一条时，按中文句末标点切句会切出
     「'前端开发': { slug: 'frontend', blurb: '把信息层级和操作路径理清楚」
     这一整串（含代码）当成一句话，误报成超长句。 */
  if (/^['"][^'"]*['"]\s*:/.test(t)) return true;
  /* 纯数组项 ['xxx', 'yyy'] */
  if (/^\[\s*['"]/.test(t)) return true;
  /* 数组字面量里的一整行：'a', 'b', 'c' —— 技术清单，不是句子 */
  if (/^['"].*['"],\s*['"]/.test(t)) return true;
  /* items: [...] 这种整行数组 */
  if (/^[A-Za-z_$][\w$]*\s*:\s*\[/.test(t)) return true;
  return false;
}

/* ── 规则四：三段排比 ────────────────────────────────────────────
   只抓真排比，不抓技术名词罗列。
   判据：把句子按 、/， 切成并列项，若有三项**起头字相同**且**长度相近**，
   就是排比 —— 「读需求、读代码、读文档」。
   ⚠️ 这条规则用正则写过两版，都不行：
   正则要求整词重复（「读需求」≠「读代码」），真排比抓不到；
   放宽成首字相同又会把「新建管理员、分配角色（超级管理员 / 运营管理员）」
   这类括号里的重复词算进来 —— 那是三个不同功能，不是一句话的三段排比。
   长度相近这一条能把后者排除掉：三项字数差得多。
   「从 A 到 B」连用三次是另一类句式对仗，单独一条。
   ⚠️ 每段要从**第一个汉字**开始算，不能拿整段的开头。
   这一行是 `tagline: '读需求、读代码、读文档'`，切出来第一段是
   `tagline: '读需求` —— 起头字是字母 t，不是汉字，规则直接 return false，
   于是**带属性名的行永远检不出排比**。
   这类行恰恰是最容易写排比的地方（tagline、blurb、lede 都是这种写法）。 */
function isParallelism(text) {
  const parts = text
    .split(/[、，]/)
    .map((s) => {
      const i = s.search(/[一-龥]/);
      return i >= 0 ? s.slice(i).trim() : '';
    })
    .filter(Boolean);
  if (parts.length < 3) return false;
  const head = parts[0][0];
  if (!/^[一-龥]$/.test(head)) return false;
  const same = parts.filter((p) => p[0] === head);
  if (same.length < 3) return false;
  const lens = same.slice(0, 3).map((p) => p.length);
  return Math.max(...lens) - Math.min(...lens) <= 3;
}

const PARALLEL_PATTERNS = [
  /* 「从 A 到 B，从 C 到 D」连用三次 */
  /从[^，。！？]{1,8}到[^，。！？]{1,8}[，。]\s*从[^，。！？]{1,8}到[^，。！？]{1,8}[，。]\s*从[^，。！？]{1,8}到[^，。！？]{1,8}/,
];

/* ── 规则五：标签式套话 ──────────────────────────────────────────
   把一个具体动作说成一个概念，读起来像 PPT。
   ⚠️ 前两版都太宽：
   第一版把「能力」「体系」算进去，命中大半是「测试与部署」这种正常说法；
   第二版只留「化」字后缀，又把「自动化测试」「可视化」「工程化」全捞出来了 ——
   「化」是构词法，不是套话。
   现在只列确定的几个：这些词单独出现就说明在写 PPT 而不是写说明。 */
const LABEL_SUFFIX = [
  /(?:基建|心智|触点|颗粒度|护城河|抓手|闭环化|能力化|生态化|平台化战略)(?![一-龥])/g,
];

/* 要检查的文件范围：用户能读到的文案。
 *  注释（// 与 /* *）会被剥掉后再查，代码标识符不参与。 */
const TARGETS = [
  { file: 'src/data.js', label: '界面文案' },
  { file: 'src/main.jsx', label: '组件文案' },
  { file: 'index.html', label: '页面元信息' },
  /* README 是技术文档，一句话要讲清「为什么这么选」，天然比界面文案长。
     界面文案超 25 字是啰嗦，README 超 25 字是省略了前提。 */
  { file: 'README.md', label: 'README', max: 55 },
];

/** 剥掉 JS/JSX 注释与 import 语句，只留真正会显示给用户的文本。
 *  ⚠️ 多行块注释只有首行以 /* 开头，后续行可能是普通文字，
 *  所以要用状态机跟着注释块，不能逐行判断行首。 */
function stripComments(lines) {
  let inBlock = false;
  return lines.map((raw) => {
    let s = raw;
    if (inBlock) {
      const end = s.indexOf('*/');
      if (end < 0) return '';
      inBlock = false;
      s = s.slice(end + 2);
    }
    /* 本行开始的块注释 */
    const start = s.indexOf('/*');
    if (start >= 0) {
      const end = s.indexOf('*/', start + 2);
      if (end < 0) {
        inBlock = true;
        s = s.slice(0, start);
      } else {
        s = s.slice(0, start) + s.slice(end + 2);
      }
    }
    /* 行注释（避开 URL 里的 //） */
    const c = s.indexOf('//');
    if (c >= 0 && !/https?:\/\//.test(s.slice(0, c + 2))) s = s.slice(0, c);
    /* import 行 */
    if (/^\s*import\s/.test(s)) return '';
    return s;
  });
}

/** 取出一行里所有中文句子（按中文句末标点切）。 */
function chineseSentences(text) {
  return text
    .split(/[。！？!?]/)
    .map((s) => s.trim())
    .filter((s) => /[一-龥]/.test(s));
}

/* ── 上下文：这一行属于哪个字段 ──────────────────────────────────────
   简历正文（summary / advantages / projectHighlights / points / skillGroups）
   的字符串与界面文案不能用同一把尺子量。
   ⚠️ 不能只看行首：`projectHighlights: {` 下面还有 `campus: [`、
   `research: [` 两层，用正则只匹配字段名会认不出来，
   必须靠缩进维护一个栈，把「这行嵌在哪些字段里」算出来。 */
function fieldPaths(rawLines) {
  const out = new Array(rawLines.length).fill('');
  const stack = []; // { indent, key }
  /* 先剥注释：注释里出现「某某:」不该被当成字段开块 */
  const lines = stripComments(rawLines);
  lines.forEach((line, i) => {
    const indent = line.match(/^\s*/)[0].length;
    /* 缩进回到栈顶那一层，说明那个块已经结束 */
    while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
    /* 两种写法都算开块：`key: [` / `key: {`，
       以及 `key:` 后面换行写值（summary 就是这么写的）。
       ⚠️ 收尾的 `[` / `{` 必须是**可选的整个**（`(?:[\[{])?`），
       不能写成 `(\[[{]|)` —— 那个 `|` 落在分组内部，
       意思变成「`[{` 或空」，反而匹配不上 `{`。
       这个坑很隐蔽：正则不报错，只是不命中。 */
    const m = line.match(/^\s*([A-Za-z_$][\w$]*)\s*:\s*(?:[\[{])?$/);
    if (m) stack.push({ indent, key: m[1] });
    out[i] = stack.map((s) => s.key).join('.');
  });
  return out;
}

/** 去掉句子里的代码片段（反引号、尖括号内容、URL），它们不算文案。 */
function withoutCode(s) {
  return s
    .replace(/`[^`]*`/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/https?:\/\/\S+/g, '')
    /* JSX 表达式插值：{category.projects.length}
       ⚠️ 只去**不含引号和冒号**的那种。含冒号的是对象字面量
       （{ slug: 'frontend', blurb: '...' }），那里面的中文是真实文案，
       一并剥掉就等于放过了一段没检查的文案。 */
    .replace(/\{[^{}'":]*\}/g, '');
}

const findings = [];

/** 报告一处问题。
 *  ⚠️ id 要是**稳定**的断言名（不含具体数字），
 *  这样反例脚本才能锚住「哪条规则该拦住」。
 *  rule 里的数字是给人看的，id 是给机器锚的，两者不能混。 */
function report(file, label, line, id, rule, text) {
  findings.push({ file, label, line, id, rule, text: text.trim().slice(0, 90) });
}

for (const { file, label, max } of TARGETS) {
  const baseLimit = max || MAX_SENTENCE;
  let raw;
  try {
    raw = readFileSync(file, 'utf8');
  } catch {
    console.log(`· 跳过 ${file}（不存在）`);
    continue;
  }

  const rawLines = raw.split('\n');
  const lines = stripComments(rawLines);
  const paths = fieldPaths(rawLines);
  lines.forEach((line, i) => {
    if (!line.trim()) return;
    /* 跳过纯代码行：不含中文，或中文只出现在注释里 */
    const cleaned = withoutCode(line);
    if (!/[一-龥]/.test(cleaned)) return;

    /* 规则一：禁用词 */
    for (const w of BANNED_WORDS) {
      if (cleaned.includes(w)) {
        report(file, label, i + 1, '文案禁用词', `禁用词「${w}」`, cleaned);
      }
    }

    /* 规则二：破折号 */
    const dashCount = (cleaned.match(/——/g) || []).length;
    if (dashCount > 0) {
      report(file, label, i + 1, '文案破折号', `破折号 ×${dashCount}`, cleaned);
    }

    /* 规则三：单句过长 / 分句过长 */
    if (!isCodeShape(line)) {
      const raw = rawLines[i];
      const limit = LIST_LINE.test(raw) ? MAX_SENTENCE_LIST : baseLimit;
      /* 文档的表格行与清单项不参与长度检查 —— 它们是结构化信息不是散文。 */
      const docRow = DOC_TABLE_LINE.test(raw) || DOC_LIST_LINE.test(raw);
      /* 这行是不是简历正文？简历正文按分句卡，不按整句卡。 */
      const path = paths[i] || '';
      const inResume = path
        .split('.')
        .some((k) => RESUME_TEXT_KEYS.has(k));
      for (const s of chineseSentences(cleaned)) {
        const pure = withoutCode(s).trim();
        if (!pure || docRow) continue;
        const len = readingLength(pure);
        if (inResume) {
          /* 简历正文：整句长是正常的，分句太长才难读。 */
          const cl = longestClause(pure);
          if (cl > MAX_CLAUSE) {
            report(file, label, i + 1, '文案分句过长', `分句 ${cl} 字（>${MAX_CLAUSE}）`, pure);
          }
        } else if (len > limit) {
          report(file, label, i + 1, '文案单句过长', `单句 ${len} 字（>${limit}）`, pure);
        }
      }
    }

    /* 规则四：三段排比
       ⚠️ 按**句子**判，不能按整行判 ——
       一行里往往有好几句话（「读需求、读代码、读文档。这句话是另一句。」），
       按整行切分会把上一句的尾巴和下一句的头凑成「排比」。 */
    for (const s of chineseSentences(cleaned)) {
      const pure = withoutCode(s).trim();
      if (!pure) continue;
      if (isParallelism(pure)) {
        report(file, label, i + 1, '文案三段排比', '三段排比', pure);
      }
      for (const p of PARALLEL_PATTERNS) {
        if (p.test(pure)) {
          report(file, label, i + 1, '文案三段排比', '三段排比', pure);
        }
      }
    }

    /* 规则五：标签式套话 */
    for (const p of LABEL_SUFFIX) {
      const m = cleaned.match(p);
      if (m) {
        report(file, label, i + 1, '文案标签式套话', `套话后缀「${m.join('')}」`, cleaned);
      }
    }
  });
}

console.log(`检查 ${TARGETS.length} 个文件\n`);

/* ── 判据自测 ────────────────────────────────────────────────────
   规则被改坏时（收得太紧抓不到真排比，或放得太松误报满屏），
   光看「当前文案 0 命中」是发现不了的 —— 可能只是这份文案恰好没有排比。
   所以每条判据都要有一组固定的正反例。 */
const SELF_TESTS = [
  ['三段排比', isParallelism, true, '读需求、读代码、读文档，三件事都做完了。'],
  ['三段排比', isParallelism, true, '写代码、写文档、写测试。'],
  ['三段排比', isParallelism, false,
    '管理员账号：支持新建管理员、分配角色（超级管理员 / 运营管理员）、设置启用状态。'],
  ['三段排比', isParallelism, false,
    '评论管理：31 条评论，可按评论内容或评论者搜索，标注所属动态发布者。'],
  ['三段排比', isParallelism, false, 'Python、PHP、C / C++、TypeScript / JavaScript、SQL'],
  /* 阅读长度：英文技术词算一「词」，不是一串字符。
     不用原始字符数的话，「PHP / MySQL」会被算成 12，
     整句话凭空多出十几个字，把好文案误判成超长。
     「后端用 PHP / MySQL 与 Python / FastAPI，做过表结构设计」
     = 中文 11 字 + 英文 4 词 = 15。 */
  ['阅读长度', (s) => readingLength(s) === 15, true,
    '后端用 PHP / MySQL 与 Python / FastAPI，做过表结构设计'],
  ['阅读长度', (s) => readingLength(s) === 11, true, '后端用  与 ，做过表结构设计'],
  /* 分句：按逗号切，取最长那一截。 */
  ['分句长度', (s) => longestClause(s) === 5, true, '甲乙丙，丁戊，己庚辛壬癸'],
  ['分句长度', (s) => longestClause(s) === 10, true, '甲乙丙丁戊己庚辛壬癸'],
  /* ⚠️ 带代码前缀的行也必须能判出排比。
     tagline 那行是 `tagline: '读需求、读代码、读文档'`，切出来第一段是
     `tagline: '读需求` —— 起头字是字母，不从汉字开始截就永远检不出来。
     下面这条就是这条 bug 的守门断言。
     ⚠️ 样例里带单引号，用反引号包起来，
     否则字符串里的 ' 会把外层的 ' 提前关掉，语法直接报错。 */
  ['三段排比', isParallelism, true, `tagline: '读需求、读代码、读文档。'`],
  ['三段排比', isParallelism, true, `blurb: '读需求、读代码、读文档。'`],
  /* 英文前缀不该把「起头字相同」的判断带偏。
     「做前端、做后端、做部署」按定义就是排比（起头字都是「做」），
     不能拿它当反例 —— 那是在拿真排比说它不是排比。
     真正要验的是：前缀被剥掉之后，起头字算的是**汉字**那个。 */
  ['三段排比', isParallelism, false, `blurb: '前端干净、后端稳当、部署省心。'`],
];
let selfBad = 0;
for (const [name, fn, want, sample] of SELF_TESTS) {
  const got = fn(sample);
  if (got !== want) {
    console.log(`❌ 判据自测失败：「${name}」对「${sample.slice(0, 24)}…」判成 ${got}，应为 ${want}`);
    selfBad += 1;
  }
}
if (selfBad) {
  console.log(`\n❌ ${selfBad} 条判据自测没过 —— 规则可能被改坏了，先修规则再改文案`);
  process.exit(1);
}
console.log(`判据自测 ${SELF_TESTS.length} 条全过\n`);

if (!findings.length) {
  console.log('✅ 没有发现问题');
  process.exit(0);
}

const byRule = new Map();
for (const f of findings) {
  const key = f.id;
  if (!byRule.has(key)) byRule.set(key, []);
  byRule.get(key).push(f);
}

for (const [id, list] of byRule) {
  console.log(`${list[0].rule}：${list.length} 处`);
  for (const f of list) {
    /* FAIL 行格式与 smoke 系列一致：反例脚本靠它判断「哪条规则该拦住」 */
    console.log(`FAIL  ${id}  ${f.file}:${f.line}  ${f.text}`);
  }
  console.log('');
}

console.log(`共 ${findings.length} 处`);
process.exit(1);
