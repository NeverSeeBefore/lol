# Design

## Context

现状：`src/views/Tools/index.tsx` 顶部横排 NavLink，" | " 分隔，`.active` 仅 `--accent-text` 变色加粗——未落地规范 §5 的路由级选中裁决（工具专属色 12% 底）。`theme.less` 已登记 9 个 `--tool-*` 专属色令牌。`tools.tsx` 的 `tools` 数组是导航与路由的单一数据源。

约束：

- CSS Modules 下 NavLink 的 `active` 类不会被 module 哈希匹配，必须用 `className={({isActive}) => ...}` 回调（Nav 组件已踩过此坑）
- 工具色是 hex 令牌，12% 底无法直接从 hex 变量派生——需选定派生方案
- 另一 agent 可能占用 5173 端口，验证前先 `lsof -ti:5173`

## Goals / Non-Goals

**Goals:**

- 左侧竖向侧边栏 + 右侧内容区，高对比菜单按钮，专属色选中态（12% 底 + 专属色文字 + 3px 左指示条）
- <768px 降级为顶部横向滚动条
- Tab 焦点可见（沿用全局 `:focus-visible` 描边）

**Non-Goals:**

- 不改任何工具内部实现
- 不改路由结构、不加工具搜索/分组（9 个工具一屏可放下）
- 不做侧边栏折叠交互

## Decisions

### D1: 侧边栏 220px、`--bg-raised` 底

220px 容得下最长工具名「时间戳转换」+ 圆点 + 内边距，又不挤占工具工作区。侧边栏比内容区亮一级（`--bg-raised` vs `--bg-base`），符合「层级靠明度」原则，外加右侧 1px `--border` 发丝线。顶部加 12px `--text-tertiary` 的「工具」小标题作分区提示。

### D2: 12% 底用 `color-mix(in srgb, var(--item-accent) 12%, transparent)`

不为 9 个工具各建 `*-bg` 令牌（theme.less 会膨胀 9 行且新增工具要登记两处）。`color-mix` 从现有 hex 令牌现场派生，与 `--accent-bg`/`--tool-regex-bg` 的 12% 写法语义一致；Chrome/Safari/Firefox 近两年版本均支持。组件通过内联 style 把 `tool.colorVar` 写入局部自定义属性 `--item-accent`，CSS Modules 只管结构、颜色由数据驱动——绕开「active 类不被哈希匹配」的坑：选中态类名由 NavLink 回调拼接，颜色值根本不经过 module 类。

### D3: 选中指示条用 `::before` 伪元素

3px 宽、圆角、纵向居中（上下各留 6px），`--item-accent` 实色。相比 `border-left` 不挤占布局、不需要 box-sizing 补偿。移动端横向模式下同一伪元素改写为底部条（左右留 12px）。

### D4: 专属色圆点常显、未选中降透明度

6px 圆点，未选中 opacity .45（身份提示但不抢眼），hover/选中时 opacity 1。圆点 + 选中态专属色文字满足「凭颜色认出工具」，且两种色不与琥珀同现于一个元素（琥珀只出现在焦点环）。

### D5: 断点 768px，降级为顶部横滚条

`flex-direction: row` + `overflow-x: auto` + 每项 `flex: none`，发丝线从右侧改为底部。横滚条高度靠内容撑，不固定。scrollbar 细化和隐藏交给 `color-scheme: dark` 的原生暗色滚动条。

### D6: tools.tsx 每项加 `colorVar: 'var(--tool-json)'` 字段

数据数组仍是唯一数据源；路由配置不受影响（只读 `path`/`element`）。

## Risks / Trade-offs

- [color-mix 旧浏览器不支持] → 项目无旧浏览器要求；降级表现仅为选中项无底色的纯文字变色，可接受
- [横滚条上焦点环被 overflow 裁切] → 横向模式给容器加 4px 纵向 padding 缓冲，focus outline-offset 2px 不越界
- [stylelint 对 color-mix / 属性序报错] → 跑 `pnpm lint` 验证，必要时调整
