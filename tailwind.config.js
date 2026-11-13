/**
 * Tailwind 服务于「作品画廊 + 六个新页面」。
 *
 * 为什么这样配：
 * - content 指向 src 下全部组件：新页面（pages/*.tsx）与画廊都用 utility；
 * - corePlugins.preflight 关闭：Tailwind 的全局 reset 不注入，
 *   站点原有的手写 CSS 体系（styles.css / design-system.css）不受影响。
 *   ⚠️ 代价：base 层的 transform 变量默认值（--tw-translate-x 等）也没了，
 *   需要在 src/tw.css 里按站点作用域补回，否则 hover:translate-y /
 *   group-hover:scale 的 transform 声明会因变量无回退而整体失效；
 * - prefix "tw-"：所有 utility 写成 tw-xxx / hover:tw-xxx，与既有 class 永不冲突；
 * - colors 映射到 CSS 变量：深浅两套主题自动跟随，页面里只写语义色。
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{jsx,tsx}'],
  corePlugins: { preflight: false },
  prefix: 'tw-',
  theme: {
    extend: {
      colors: {
        page: 'var(--page)',
        surface: 'var(--surface)',
        ink: 'var(--ink)',
        soft: 'var(--ink-soft)',
        muted: 'var(--muted)',
        faint: 'var(--faint)',
        line: 'var(--line)',
        strong: 'var(--line-strong)',
        accent: 'var(--accent)',
        accent2: 'var(--accent-2)',
        /* 画廊米白纸面：两套主题下都保持纸色，像夹在站里的一张印刷品 */
        band: 'var(--band)',
        bandink: 'var(--band-ink)',
        bandmuted: 'var(--band-muted)',
      },
      borderRadius: {
        ds: '16px',
      },
      fontFamily: {
        serif: ['Georgia', '"Songti SC"', '"Noto Serif SC"', 'serif'],
      },
    },
  },
  plugins: [],
};
