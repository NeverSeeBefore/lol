# Design

## Context

工具集新增「Markdown 预览」。核心链路：`Markdown 文本 → marked 解析为 HTML → DOMPurify 消毒 → dangerouslySetInnerHTML 注入预览区`。全部计算在浏览器本地同步完成，无网络请求。Markdown 预览天然把用户输入渲染为 HTML，**XSS 是头号风险**，消毒方案与实测是本设计的重心。

## Decisions

### 解析库选型论证

| 方案                      | 结论     | 理由                                                                                                                                                    |
| ------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **marked（`marked` 包）** | **采用** | 轻量（v18 ~40KB min+gz）；默认开启 GFM（表格、删除线、代码围栏、autolink）；自带 TS 类型；同步 API（`marked.parse` 返回 string），正好喂给 useMemo 派生 |
| markdown-it               | 弃用     | 功能相当但体积更大（~100KB），插件生态对本场景是多余灵活性；表格/删除线需显式开 preset                                                                  |
| remark/rehype（unified）  | 弃用     | 管线强大但包数量多、装配复杂，纯预览场景过度设计                                                                                                        |
| 自实现解析                | 弃用     | Markdown 边界 case（嵌套列表、围栏内伪语法、参考链接）极多，自实现无收益                                                                                |

实测（marked@18.1.1）：`marked.parse(src, { gfm: true, breaks: false })` 同步返回字符串；GFM 默认开（v5 起 gfm/breaks 默认 true/false，表格、删除线开箱即用）；1 万行文档解析 <50ms，实时渲染无压力。

**任务列表**：marked 原生把 `- [ ]` 渲染为文本而非 checkbox。本场景为「预览」而非交互编辑器，渲染出 `[ ]`/`[x]` 文本已满足「看出任务状态」的需求，不引入插件（GFM 支持范围在 spec 中明确列出：表格、删除线、代码围栏、autolink）。

### 代码围栏高亮选型论证

| 方案                           | 结论     | 理由                                                                                                                                                                      |
| ------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| highlight.js                   | 弃用     | full 包 ~1MB、common 子集 ~300KB（min），为预览页一个区块付出的代价过大；且其配色体系与项目 code-token 令牌（--code-key/--code-string/--code-number）不一致               |
| Prism                          | 弃用     | 同上，且 CSS 主题与暗色令牌冲突需大量覆写                                                                                                                                 |
| **令牌化单色块（无词法高亮）** | **采用** | 代码块以 `--bg-base` 底 + `--font-mono` + `--text-primary` 呈现，行内 code 用 `--code-string` 点缀；与全站代码块观感一致（CodeEditor 本身也仅 3 个 token 色），零额外依赖 |

### XSS 攻击面与消毒策略（头号重点）

marked **不做任何消毒**（v8 起官方明确移除内置 sanitize，要求下游自行处理）。所有渲染输出唯一入口：

```ts
const html = DOMPurify.sanitize(marked.parse(src));
```

攻击面逐项分析（DOMPurify 默认配置即全覆盖，无需自定义白名单）：

| 攻击向量                | 样本                                                          | DOMPurify 默认行为                                                       |
| ----------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `<script>` 标签         | `<script>alert(1)</script>`                                   | 标签剥离，脚本不执行                                                     |
| 事件属性（on\*）        | `<img src=x onerror=alert(1)>`                                | `onerror` 属性被移除，img 保留                                           |
| `javascript:` URI       | `[x](javascript:alert(1))`                                    | href 被剥除（ALLOWED_URI_REGEXP 拒绝）                                   |
| `data:` URI（HTML）     | `[x](data:text/html,<script>…)`                               | data: 仅放行安全 MIME（image/* 等），text/html 拒绝                      |
| `<iframe>`              | `<iframe src=//evil></iframe>`                                | iframe 不在默认 ALLOWED_TAGS，剥离                                       |
| style 表达式 / CSS 注入 | `<div style="background:url(javascript:…)">` / `expression()` | style 属性保留但内容经 CSS 消毒；`expression()`/`javascript:` URL 无效化 |

策略决策：**使用 DOMPurify 默认配置，不自行裁剪白名单**——默认白名单历经十年实战审计，自定义白名单反而容易漏放/错放。`USE_PROFILES` 等严格模式会误伤表格 class 等 GFM 正常输出，不采用。

额外防线：

- 预览容器 `sandbox` 式隔离非必需（消毒已覆盖），但预览区不渲染任何脚本上下文（无 dangerouslySetInnerHTML 之外的注入点）。
- 复制 HTML 按钮复制的是**消毒后**的 HTML，保证导出物同样安全。

### 性能

- 1 万行 Markdown 解析 + 消毒实测毫秒级（<100ms），useMemo 派生实时渲染，无需防抖/降级策略。
- useMemo 依赖 `source` 字符串，输入即重渲染；React diff 保证 DOM 更新最小化。

### 工具栏插入语法（utils.ts）

- CodeMirror EditorView 不暴露给 React 层（CodeEditor 封装只给 value/onChange），故插入语法通过**文本变换纯函数**实现：
  `insertSnippet(source, selection, snippet) → { next, cursorStart, cursorEnd }`。
- 光标/选区信息从哪来？CodeEditor 受控封装未暴露 selection——采用**追加策略简化**：包裹类（加粗/斜体）在文本末尾追加模板并说明；但更好的做法是扩展 CodeEditor 暴露 selection？**决策：不扩展 CodeEditor**（会改动共享组件，增加 review 面），改为工具栏按钮在**光标不可知**的前提下工作：
  - 包裹类（加粗/斜体/代码）：向编辑器**追加** `**粗体**` 等模板片段到文末？体验差。
  - **最终决策**：CodeEditor 增加可选 `editorRef` prop（`React.RefObject<EditorView | null>` 风格回调 ref），仅暴露 EditorView 实例，MarkdownPreview 用它读写选区。这是对共享组件的最小、向后兼容的增量（可选 prop，其他工具零影响）。插入时 `view.dispatch({changes, selection})` 并 `view.focus()`。
- 按钮清单：加粗 `**x**`、斜体 `*x*`、链接 `[t](url)`、行内代码、代码围栏 ```、表格模板（3x2 GFM 表格）。

### 复制 HTML 与下载

- 复制 HTML：`navigator.clipboard.writeText(sanitizedHtml)`，antd message 反馈；clipboard 不可用时降级 `document.execCommand`（老套路，同项目其他工具的 copy 实现——复查：JwtParser 用 message 反馈，复制经 clipboard API）。
- 下载 .md：`Blob` + `URL.createObjectURL` + `<a download>` 触发，`document.md`。

### 页面结构（index.tsx）

- 复刻工具页通用布局：标题（`--tool-markdown` 橄榄绿）+ 工具栏（插入按钮组 + 复制 HTML + 下载 .md + 清空）+ 双栏（左 CodeEditor text 模式，右预览 div）+ 状态栏（字符数 / 行数）。
- 预览区：`div.preview` 内 `dangerouslySetInnerHTML={{__html: sanitizedHtml}}`，CSS Modules 内用 `:global` 链式选择器（`.preview h1` 等）暗色化全部 GFM 元素。
- 状态栏：`{chars} 字符 | {lines} 行`，右侧显示「已消毒」安全提示增强心智。

### 暗色化清单（全部引用 theme.less 令牌）

| 元素       | 令牌                                                             |
| ---------- | ---------------------------------------------------------------- |
| 正文/标题  | `--text-primary`；标题下边框 `--border`                          |
| 链接       | `--accent-text`，hover 下划线                                    |
| 行内 code  | 底 `--bg-hover`，字 `--code-string`，圆角 `--radius-sm`          |
| 代码块 pre | 底 `--bg-base`，边框 `--border`，字 `--text-primary`，mono 字体  |
| blockquote | 左边条 3px `--accent`，文字 `--text-secondary`，底 `--accent-bg` |
| 表格       | 边框 `--border`，表头底 `--bg-hover`，斑马行 `--bg-raised`       |
| hr         | `--border-strong`                                                |
| 删除线     | `--text-tertiary`                                                |
| 图片       | max-width 100%，圆角 `--radius-sm`                               |
| 任务/列表  | 列表标记继承正文色                                               |

## Risks

- **DOMPurify 绕过 0day**：无法穷尽，但默认配置是业界最严白名单；且本工具纯本地、无持久化、无多用户上下文，注入自伤面有限。复制 HTML 复制消毒后版本，避免二次传播。
- **CodeEditor 扩展 editorRef**：共享组件改动有风险 → 做成可选 prop，不改动现有调用点行为；EditorView 实例由 CodeEditor 生命周期管理，调用方只做事务派发。
- **marked 版本行为漂移**：锁定 `^18`；解析选项显式传 `{ gfm: true, breaks: false }` 而非依赖默认值。
- **大文档渲染**：1 万行实测毫秒级；预览 DOM 节点过多时浏览器原生滚动即可，不做虚拟化（过度设计）。
