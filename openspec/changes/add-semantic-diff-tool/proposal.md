# Proposal

## Why

日常调试与 code review 中，「两段文本/两份配置 JSON 差在哪」是高频需求：比配置版本、比接口响应、比构建产物。在线 diff 站要求把内容贴到第三方（常含内网地址/密钥），工具集主张纯本地处理，新增「文本/JSON 语义 Diff」补齐对比类工具链。JSON 语义 diff 解决键序无关、按路径定位变更的痛点——普通文本 diff 对重排键序的 JSON 会满屏误报。

## What Changes

- 新增工具页 `src/views/Tools/SemanticDiff/`（index.tsx、index.module.less、utils.ts）：双栏 CodeEditor（左旧右新）+ 下方 Diff 结果视图，Segmented 切换文本/JSON 两种模式
- **文本模式**：基于 jsdiff 的行级 diff（Myers），渲染行号、+/- 标记；相邻删+增块按行配对为「修改」，三类着色——新增绿（--success 系）/删除红（--error 系）/修改琥珀（--accent-text 系），全部引用 theme.less 语义令牌
- **JSON 模式**：键序无关递归比对，产出路径化变更列表（如 `a.b[2].c: old → new`），分新增/删除/修改三类；值类型变化（如 string → number、对象 → 数组）单独标注「类型变化」；输入非法 JSON 时友好报错（指明左/右面板、行列号）
- 统计条：文本模式 `+N 行 / -N 行 / 修改 M 处`；JSON 模式 `+N 键 / -N 键 / 修改 M 处`
- 性能边界（详见 design.md）：两侧合计 ≤2 万行且 ≤2MB 时输入即对比（useMemo 派生）；超阈值降级为手动触发「对比」按钮；diff 结果渲染设行数上限，超限截断并提示
- `src/views/Tools/tools.tsx` 注册 `{ name: 'Diff 对比', path: 'diff' }`
- theme.less 工具专属色区块登记 `--tool-diff: #84ebd0;`（青碧 164°，亮层，已预分配），语义色区块登记 `--success-bg` / `--error-bg`（12% 透明行底，沿用 --accent-bg 惯例）；docs/design/ui-spec.md §2.3/§2.4 表格同步加行（保留他人新增行）

## Capabilities

### New Capabilities

- `semantic-diff`: 文本/JSON 语义对比能力——双栏输入、文本行级 diff（增删改三类配对）、JSON 键序无关路径化比对（含类型变化标注）、非法 JSON 行列定位报错、变更统计、大输入降级策略；纯本地、无网络请求

### Modified Capabilities

（无现有 specs 覆盖工具注册或 CodeEditor，不涉及）

## Impact

- **代码**：新增 `src/views/Tools/SemanticDiff/`（index.tsx、index.module.less、utils.ts）；改 `src/views/Tools/tools.tsx`、`src/static/styles/theme.less`、`docs/design/ui-spec.md`（§2.4 表格加一行）
- **依赖**：**新增直接依赖 `diff`（jsdiff）**（计划内，pnpm 严格隔离要求显式声明；若无自带类型则补 `@types/diff`）；无其他新增
- **兼容性**：纯新增，`pnpm build` 与 `pnpm lint` 必须通过；其他工具页 Playwright 抽查回归
- **规范**：遵守 docs/design/ui-spec.md，颜色一律 theme.less 令牌，无硬编码色值
