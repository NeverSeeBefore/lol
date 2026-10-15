# Proposal

## Why

写 README、接口文档、博客草稿时，「Markdown 渲染出来长什么样」是高频需求。在线预览站要求把内容贴到第三方（常含未公开文档/内网信息），工具集主张纯本地处理；且 Markdown 预览天然涉及把用户输入渲染为 HTML，XSS 消毒是硬性安全要求，必须采用业界标准方案（DOMPurify）并实测注入拦截。新增「Markdown 预览」补齐文档类工具链。

## What Changes

- 新增工具页 `src/views/Tools/MarkdownPreview/`（index.tsx、index.module.less、utils.ts）：左编辑（CodeEditor text 模式）右预览，输入即渲染（useMemo 派生）
- **Markdown 解析选型 `marked`**：轻量（~40KB min），默认 GFM（表格、删除线、代码围栏），自带 TS 类型
- **XSS 消毒（硬性安全要求）**：所有渲染输出经 **DOMPurify** 消毒后才注入 DOM（dangerouslySetInnerHTML）；design.md 列出攻击面（`<script>`、`<img onerror>`、`javascript:` 链接、`data:` URI、iframe、style 表达式）并给出逐项拦截策略
- 预览区 HTML 全套暗色化：h1-h6/ul/ol/table/code/blockquote/hr/链接/图片等，颜色一律 theme.less 令牌（正文 --text-primary、代码块 --bg-base 底 + code-token 色、表格边框 --border、链接 --accent-text、引用块左边条 --accent 等）；代码围栏不做第三方高亮库（论证见 design.md），以令牌化单色块呈现
- 工具栏：插入常用语法快捷按钮（加粗/斜体/链接/代码块/表格模板，按光标处插入并回填选区）、复制渲染后 HTML、下载 .md
- 状态栏：字数/行数统计
- `src/views/Tools/tools.tsx` 注册 `{ name: 'Markdown 预览', path: 'markdown' }`
- theme.less 工具专属色区块登记 `--tool-markdown: #d2df49;`（橄榄绿 65°，亮层，已预分配）；docs/design/ui-spec.md §2.4 表格同步加行（保留他人行）

## Capabilities

### New Capabilities

- `markdown-preview`: Markdown 编辑与实时预览能力——左侧 CodeMirror 输入、右侧 GFM 渲染（标题/列表/表格/代码围栏/删除线/引用/链接/图片）、DOMPurify 全量输出消毒（拦截 script/事件属性/javascript: URI/iframe/data:text/html/style 注入）、语法快捷插入工具栏、复制 HTML、下载 .md、字数行数统计；纯本地、无网络请求

### Modified Capabilities

（无现有 specs 覆盖工具注册或 CodeEditor，不涉及）

## Impact

- **代码**：新增 `src/views/Tools/MarkdownPreview/`（index.tsx、index.module.less、utils.ts）；改 `src/views/Tools/tools.tsx`、`src/static/styles/theme.less`、`docs/design/ui-spec.md`（§2.4 表格加一行）
- **依赖**：新增直接依赖 `marked`（解析）与 `dompurify`（消毒），两者均自带 TS 类型，无需 @types；pnpm 严格隔离要求显式声明
- **兼容性**：纯新增，`pnpm build` 与 `pnpm lint` 必须通过；其他工具页 Playwright 抽查回归
- **安全**：渲染输出唯一入口经 DOMPurify 消毒；Playwright 实测六类注入全部拦截
- **规范**：遵守 docs/design/ui-spec.md，颜色一律 theme.less 令牌，无硬编码色值
