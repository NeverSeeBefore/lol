# Proposal

## Why

工具集已有 JSON 格式化、颜色转换、时间戳转换、Base64/URL 编解码四个工具。正则表达式调试是前端日常高频需求（表单校验、日志解析、批量替换前的验证），市面在线工具（regex101 等）需联网且粘贴敏感日志有隐私顾虑，值得做一个纯本地、实时反馈的正则测试器。同时 `CodeEditor` 目前不具备内容高亮能力，本工具需要一处小型向后兼容扩展。

## What Changes

- **CodeEditor 扩展**：新增可选 `highlightRegex?: RegExp | null` prop——内部用 Compartment + `MatchDecorator` + `Decoration.mark`（类名 `cm-live-match`）对匹配内容实时高亮；不传时行为完全不变（既有四个工具零改动）
- 新增工具页 `src/views/Tools/RegexTester/`：正则输入行（antd Input，mono 字体）+ flags 开关（Checkbox.Group：g/i/m/s/u/y）+ 测试文本 CodeEditor（`language="text"`，匹配实时高亮）
- 匹配统计：命中数实时显示；捕获组表格（antd Table：第 N 个匹配 × 匹配全文 × 各捕获组内容），上限 100 条防大表卡顿
- 正则语法错误实时提示：RegExp 构造的 SyntaxError 转为说明原因的友好文案（不道歉）
- 防护：测试文本超过 10 万字符时提示并跳过匹配与高亮；正则可匹配空串时跳过编辑器高亮（MatchDecorator 的 iterMatches 对空匹配不前进 lastIndex，会死循环）并提示；匹配执行全程 try/catch 兜底
- 常用正则模板 7 个（手机号、邮箱、URL、身份证号、IPv4、日期 YYYY-MM-DD、中文字符），点击填入图案与 flags——模板库是后续博客联动点
- `src/views/Tools/tools.tsx` 注册 `{ name: '正则测试', path: 'regex' }`
- theme.less 登记 `--tool-regex: #87df49;`（草绿 95°，暗层，已预分配）与 `--tool-regex-bg: rgb(135 223 73 / 12%);`（匹配高亮底，沿用 `--accent-bg` 的 12% 透明度写法）；docs/design/ui-spec.md §2.4 表格同步加一行

## Capabilities

### New Capabilities

- `regex-tester`: 正则表达式测试能力——图案 + flags 的实时匹配、编辑器内匹配高亮、命中数与捕获组统计、语法错误友好提示、超长文本/空匹配防护、常用模板一键填入

### Modified Capabilities

（无现有 specs 覆盖 CodeEditor，不涉及；CodeEditor 扩展为纯内部实现调整，对外向后兼容）

## Impact

- **代码**：`src/components/CodeEditor/index.tsx`（向后兼容扩展）、新增 `src/views/Tools/RegexTester/`（index.tsx、index.module.less、utils.ts）、`src/views/Tools/tools.tsx`、`src/static/styles/theme.less`、`docs/design/ui-spec.md`
- **依赖**：无新增依赖（原生 RegExp + 已装 `@codemirror/view` 的 MatchDecorator/Decoration + `@codemirror/state` 的 Compartment）
- **兼容性**：CodeEditor 扩展向后兼容，既有工具行为不变（JsonFormatter 页 Playwright 回归验证）；`pnpm build` 与 `pnpm lint` 必须通过
- **规范**：遵守 docs/design/ui-spec.md，颜色一律用 theme.less 令牌，不新增硬编码色值
