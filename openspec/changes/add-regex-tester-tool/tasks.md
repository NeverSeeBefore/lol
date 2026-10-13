# Tasks

## 1. 令牌登记与 CodeEditor 扩展（向后兼容）

- [x] 1.1 theme.less 工具专属色区块追加 `--tool-regex: #87df49;`（草绿 95°，暗层）与 `--tool-regex-bg: rgb(135 223 73 / 12%);`；ui-spec.md §2.4 表格加一行
- [x] 1.2 `CodeEditorProps` 新增可选 `highlightRegex?: RegExp | null`：内部 Compartment + MatchDecorator + Decoration.mark（类名 `cm-live-match`），regex 变更经 compartment.reconfigure 生效；不传时行为不变

## 2. 匹配纯函数层 `RegexTester/utils.ts`

- [x] 2.1 `buildRegex(pattern, flags)`：RegExp 构造，SyntaxError 转中文友好文案（说明原因不道歉）
- [x] 2.2 `canMatchEmpty(regex)` 与 `collectMatches(regex, text, limit)`（空匹配手动前进 lastIndex；表格限 100 行、总数上限 1 万）
- [x] 2.3 `MAX_TEXT_LENGTH = 100_000` 常量；`REGEX_TEMPLATES` 模板库 7 个（手机号/邮箱/URL/身份证号/IPv4/日期/中文字符）

## 3. 工具页面

- [x] 3.1 新建 `RegexTester/index.tsx` + `index.module.less`：标题 + 正则输入行（Input + Checkbox.Group flags）+ 模板行 + 测试文本 CodeEditor（`language="text"` + highlightRegex）+ 状态栏 + 捕获组表格
- [x] 3.2 输入即匹配：regex/统计/高亮由 useMemo 派生；语法错误红字提示并清空高亮与统计
- [x] 3.3 防护：文本 >10 万字符跳过匹配并提示；可匹配空串跳过编辑器高亮并提示；执行全程 try/catch
- [x] 3.4 捕获组表格：antd Table（# / 匹配全文 / 组 1…N），空组显示 `-`，限 100 行并提示截断
- [x] 3.5 模板点击填入图案与 flags，不动测试文本
- [x] 3.6 暗色规范：标题 `--tool-regex`、高亮底 `--tool-regex-bg`（`:global(.cm-live-match)`），无新增硬编码色值

## 4. 注册与验证

- [x] 4.1 `tools.tsx` 注册 `{ name: '正则测试', path: 'regex' }`
- [x] 4.2 `pnpm build` 通过
- [x] 4.3 `pnpm lint` 无 error、无新增 warning
- [x] 4.4 Playwright 实测：匹配高亮渲染、捕获组表格、语法错误提示、模板填入、超长文本防护、JsonFormatter 页回归
- [x] 4.5 截图 `/tmp/lolf-review/regex.png`，kill dev server
- [x] 4.6 git 提交 `feat(tools): add regex tester tool`（含 openspec change 目录）

## Workflow follow-up

- 用户确认验收后运行 openspec archive 归档本变更
