# Tasks

## 1. 令牌登记与依赖

- [x] 1.1 theme.less 工具专属色区块追加 `--tool-markdown: #d2df49; // Markdown 预览 · 橄榄绿 65°（亮层）`
- [x] 1.2 docs/design/ui-spec.md §2.4 表格同步加行（保留他人新增行）
- [x] 1.3 `pnpm add marked dompurify`（显式直接依赖；两者均自带 TS 类型，无需 @types）

## 2. 渲染管线与插入纯函数（utils.ts）

- [x] 2.1 `renderMarkdown(src)`：marked.parse（显式 `{ gfm: true, breaks: false }`）→ DOMPurify.sanitize（默认配置）→ 返回消毒后 HTML；空输入返回空串
- [x] 2.2 插入语法定义：加粗/斜体/链接/行内代码/代码块/表格模板的片段与选区包裹规则

## 3. 工具页面

- [x] 3.1 新建 `src/views/Tools/MarkdownPreview/index.tsx` + `index.module.less` + `utils.ts`：标题（--tool-markdown）+ 工具栏（插入按钮组 + 复制 HTML + 下载 .md + 清空）+ 左 CodeEditor（text 模式）右预览 + 状态栏（字符数/行数）
- [x] 3.2 CodeEditor 增加可选 `editorRef` prop（向后兼容，不改既有调用点），MarkdownPreview 经它读写选区并派发插入事务
- [x] 3.3 预览区暗色化全套：h1-h6/ul/ol/table/pre/code/blockquote/hr/del/a/img，一律 theme.less 令牌，无硬编码色值
- [x] 3.4 复制 HTML 复制消毒后版本并 message 反馈；下载 .md 经 Blob + URL.createObjectURL

## 4. 注册与验证

- [x] 4.1 `tools.tsx` 注册 `{ name: 'Markdown 预览', path: 'markdown' }`
- [x] 4.2 `pnpm build` 通过
- [x] 4.3 `pnpm lint` 无 error、无新增 warning
- [x] 4.4 Playwright 实测：标题/列表/表格/代码块/引用/链接/图片渲染正确；XSS 六项注入全部拦截；中文排版；暗色样式抽查（computed color 符合令牌）；其他工具页回归 1 个（左侧竖向侧边栏导航）
- [x] 4.5 截图 `/tmp/lolf-review/markdown.png`，kill dev server
- [x] 4.6 git 提交 `feat(tools): add markdown preview tool`（含 openspec change、package.json、pnpm-lock），提交前 git status 确认只 stage 自己的文件

## Workflow follow-up

- 用户确认验收后运行 openspec archive 归档本变更
- 遗留：大文档输入未做防抖——实测 1 万行解析+消毒 0.12-0.18s，可接受，暂不加；任务列表渲染为 `[ ]`/`[x]` 文本（marked 原生限制，预览场景够用）
