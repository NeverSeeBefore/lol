# Design

## Context

资产盘点（已核实）：

- `src/components/CodeEditor/index.tsx`：CodeMirror 6 受控封装（value/onChange/readOnly/lint/placeholder/language），编辑器实例只在挂载时创建一次；已支持 `language="text"`（Base64 工具在用）
- `@codemirror/view` 已装（6.43.14），含 `MatchDecorator`/`Decoration`/`ViewPlugin`；`@codemirror/state` 含 `Compartment`。已核实 `MatchDecorator` 的 `iterMatches` 对**空匹配不前进 lastIndex**——正则可匹配空串时会死循环，必须防护
- 布局范式：Base64UrlCodec 的「标题 + 工具栏 + 编辑器区 + 状态栏」结构可复刻
- 工具注册机制：`src/views/Tools/tools.tsx` 数组，路由与子导航共用
- theme.less 已有 `--tool-json/color/time/base64`；草绿 `#87DF49`（95°，暗层 L≈58%）已预分配。校验间距：与 `--tool-base64` 128° 同层间距 33° ≥20°，与琥珀 ≈31° 间距 64° ≥30°，与 success ≈153° 间距 58° ≥20°，合法
- pnpm 严格隔离：只用原生 RegExp 与已声明的 codemirror 包，无新增依赖

## Goals / Non-Goals

**Goals:**

- CodeEditor 高亮扩展（向后兼容，既有工具零改动）
- 正则 + flags 实时匹配：编辑器内高亮、命中数、捕获组表格
- 语法错误友好提示；超长文本（>10 万字符）与空匹配正则的防护
- 常用模板 7 个一键填入
- `pnpm build` + `pnpm lint` 通过，Playwright 截图验收 + JsonFormatter 回归

**Non-Goals:**

- 不做替换（replace）功能、不做正则解释器/可视化铁路图
- 不做匹配耗时监控与超时中断（JS 同步正则无法中断；以输入规模与 try/catch 兜底替代）
- 不持久化用户输入（无 localStorage）
- 不改 CodeEditor 除 highlightRegex prop 外的任何行为

## Decisions

### D1: CodeEditor 扩展——`highlightRegex?: RegExp | null` prop

内部实现：挂载 effect 内创建 `Compartment`，初始 extension 由 regex 生成；regex 变更时 `view.dispatch({ effects: compartment.reconfigure(buildHighlight(regex)) })`。

`buildHighlight(regex)`：regex 为 null → 空 extension；否则构造 `MatchDecorator({ regexp: regex, decoration: Decoration.mark({ class: 'cm-live-match' }) })` + 经典 `ViewPlugin.fromClass`（decorations 规格）。MatchDecorator 要求 `g` flag（否则 RangeError），由调用方保证。

高亮样式类 `cm-live-match` 由调用方在自己的 module.less 里以 `:global(.cm-live-match)` 定义（背景 `var(--tool-regex-bg)`）——CodeEditor 不感知工具色，保持组件中立。

备选：调用方传 `extensions?: Extension[]` 完全自行注入——需要暴露 EditorView 才能 reconfigure，破坏封装边界，否决。备选：mutate `decorator.regexp`——依赖未公开内部字段，否决。Compartment 是 CM6 官方重配置机制。

### D2: 匹配计算纯函数层 `RegexTester/utils.ts`

- `buildRegex(pattern, flags): { ok: true, regex } | { ok: false, error }`——`new RegExp(pattern, flags)`，SyntaxError 捕获后 `friendlyRegexError(message)` 转中文友好文案（说明原因，如「无效的标志」「括号未闭合：存在多余的 ( 」），不道歉
- `canMatchEmpty(regex): boolean`——`regex.exec('') !== null`（用于跳过编辑器高亮防护）
- `collectMatches(regex, text, limit = 100): { matches: MatchRow[], total: number, truncated: boolean }`——手动 `exec` 循环，空匹配时 `lastIndex++` 前进防死循环；`MatchRow = { index: number; full: string; groups: (string | undefined)[] }`；表格只收前 limit 条，total 继续累计（total 也设上限 10000，防病态正则拖慢统计）
- `MAX_TEXT_LENGTH = 100_000` 常量导出

### D3: 页面状态模型——输入即匹配，无「执行」按钮

状态：`pattern` / `flags: string[]` / `text`。派生（useMemo 链）：

1. `regexResult = buildRegex(pattern, flags)`——语法错误显示在正则输入行下方（`--error` 文案）
2. 文本超长 → 跳过匹配，状态栏提示；可匹配空串 → 统计照算（手动循环有防护）但高亮置 null 并提示
3. 高亮用 regex：统计用 regex 的基础上确保 `g` flag（无 g 时统计语义为「首个匹配」，高亮仍需 g——统一为：高亮 regex 恒带 g；统计 regex 尊重用户 flags，无 g 时只报首个匹配）

flags 用 antd Checkbox.Group，选项 g/i/m/s/u/y 各附悬停提示（title 属性说明含义）。

模板：常量数组 `{ name, pattern, flags, sample }`，点击 Tag/Button 填入 pattern 与 flags（不动测试文本）。7 个模板：手机号、邮箱、URL、身份证号（18 位）、IPv4、日期 YYYY-MM-DD、中文字符。

### D4: 布局与配色

复刻 Base64UrlCodec 布局：标题（`--tool-regex`）→ 正则输入行（`/` + Input + `/` + Checkbox.Group）→ 模板行（标签 + 7 个可点击 Tag）→ 测试文本 CodeEditor（`language="text"`，传 highlightRegex）→ 统计状态栏（命中数/组数/防护提示）→ 捕获组表格（antd Table 小尺寸，仅在有匹配时渲染，列：# / 匹配全文 / 组 1…N，N 取最大组数）。

配色：标题 `--tool-regex`；匹配高亮底 `--tool-regex-bg`（theme.less 新登记，`rgb(135 223 73 / 12%)`，沿用 `--accent-bg` 写法）；错误 `--error`；说明文字 `--text-tertiary`。无硬编码色值。

## Risks / Trade-offs

- [空匹配正则使 MatchDecorator 死循环（已核实 iterMatches 不前进 lastIndex）] → `canMatchEmpty` 检测后置 null 高亮 + 提示；统计手动循环自带 `lastIndex++` 防护
- [病态正则灾难性回溯冻结页面] → 无法从根上中断同步正则；取舍：>10 万字符跳过 + try/catch 兜底 + 统计上限 1 万条。工具场景可接受
- [Compartment reconfigure 每次输入都重建插件] → 装饰只算可视区间（MatchDecorator 特性），实测开销可忽略
- [flags 含 `d`（hasIndices）可精确定位但 antd Checkbox 更多选项] → 取舍：只暴露 6 个常用 flag（g/i/m/s/u/y），d/v 暂不暴露
- [捕获组表格列数动态] → 取首个匹配的组数建列，空组显示 `-`（`--text-tertiary`）

## Migration Plan

1. theme.less 登记 `--tool-regex` 与 `--tool-regex-bg`；ui-spec.md §2.4 加行
2. CodeEditor 加 `highlightRegex` prop（向后兼容）
3. 新建 `RegexTester/utils.ts`（纯函数）
4. 新建 `RegexTester/index.tsx` + `index.module.less`
5. `tools.tsx` 注册
6. `pnpm build` + `pnpm lint`
7. `pnpm dev` + Playwright 验收（高亮、表格、语法错误、模板填入、超长防护、JsonFormatter 回归），截图 /tmp/lolf-review/regex.png
8. 单提交 `feat(tools): add regex tester tool`，无回滚压力

## Open Questions

- 无
