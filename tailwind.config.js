/**
 * Tailwind 只服务于新加的「我的项目」横向画廊板块（ProjectShowcase.tsx）。
 *
 * 为什么这样配：
 * - content 只指向板块文件：其他文件里就算出现同名 class 也不会生成规则，构建产物可控；
 * - corePlugins.preflight 关闭：Tailwind 的全局 reset 不注入，
 *   站点原有的手写 CSS 体系（styles.css）完全不受影响。
 *   ⚠️ 代价：base 层的 transform 变量默认值（--tw-translate-x 等）也没了，
 *   需要在 src/tw.css 里按板块作用域补回，否则 hover:translate-y /
 *   group-hover:scale 的 transform 声明会因变量无回退而整体失效；
 * - prefix "tw-"：板块里所有 utility 都要写成 tw-xxx / hover:tw-xxx，
 *   与站点既有 class 名永不冲突。
 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/ProjectShowcase.tsx'],
  corePlugins: { preflight: false },
  prefix: 'tw-',
  theme: {
    extend: {},
  },
  plugins: [],
};
