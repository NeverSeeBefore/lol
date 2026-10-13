# Design

## Context

资产盘点（已核实）：

- `src/components/CodeEditor/index.tsx`：CodeMirror 6 受控封装（value/onChange/readOnly/lint/placeholder），**硬编码 `json()` 语言扩展**，目前唯一调用方是 JsonFormatter
- 布局范式：JsonFormatter 的「工具栏 + 左右双栏 CodeEditor + 状态栏」结构（`index.module.less` 的 wrap/toolbar/panes/pane/statusbar）可直接复刻
- 工具注册机制：`src/views/Tools/tools.tsx` 数组，路由与子导航共用
- theme.less 工具专属色区块已有 `--tool-json`/`--tool-color`/`--tool-time`；松绿 `#49DF5D`（128°，暗层）已为本工具预分配。校验间距：与 `--tool-json` 青 190° 同层间距 62° ≥20°，与琥珀 ≈31° 间距 97° ≥30°，与 success `#4cc38a`（≈153°）间距 25° ≥20°，合法
- pnpm 严格隔离：编解码只能用原生 API（btoa/atob、TextEncoder/TextDecoder、encodeURIComponent），无新增依赖

## Goals / Non-Goals

**Goals:**

- CodeEditor 语言扩展 prop 化（向后兼容，JsonFormatter 零改动）
- 四模式（Base64 编码/解码、URL 编码/解码）双栏工具页，Unicode 安全、解码容错、错误提示明确
- 一键复制 + 状态栏字节/字符统计
- `pnpm build` + `pnpm lint` 通过，Playwright 截图验收 + JsonFormatter 回归

**Non-Goals:**

- 不做 Base64 到文件/图片的转换（纯文本进、文本出）
- 不做全 URL 编码（encodeURI 语义）、不做批量/多行处理
- 不改 CodeEditor 除 language prop 外的任何行为
- 不抽公共布局组件（JsonFormatter 与新工具各自持有样式，避免顺手重构）

## Decisions

### D1: CodeEditor 重构——可选 `language?: 'json' | 'text'` prop

`CodeEditorProps` 新增 `language?: 'json' | 'text'`（默认 `'json'`），`json()` 扩展按 prop 条件加入 extensions 数组。编辑器实例只在挂载时创建一次（既有设计），language 在挂载时读取、不做运行时切换——本工具实例固定 `'text'`，JsonFormatter 不传 prop，行为逐字节不变。

备选：language 纳入 effect 依赖、运行时用 compartment 重配置——本场景无运行时切换需求，徒增复杂度，否决。备选：把语言扩展完全移出 CodeEditor、由调用方传 extensions——改动面大且破坏现有封装边界，否决。

### D2: 编解码纯函数层 `Src/views/Tools/Base64UrlCodec/utils.ts`

四个纯函数，统一返回 `Result<string> = { ok: true, result } | { ok: false, error }`（沿用 jsonFormat 的风格）：

- `encodeBase64(text)`：`new TextEncoder().encode(text)` → `Uint8Array` → 逐字节 `String.fromCharCode` 拼 binary string（分块处理防栈溢出，单次 32KB）→ `btoa`
- `decodeBase64(text)`：剔除空白 → `-`→`+`、`_`→`/` → 校验字符集（`[A-Za-z0-9+/]`）→ 补齐 padding 至 4 的倍数（长度 mod 4 = 1 时必非法，直接报错）→ `atob`（try/catch 转明确错误）→ 字节数组 → `new TextDecoder('utf-8', { fatal: true })` 解码（fatal 模式让非法 UTF-8 抛错而非替换为 U+FFFD）→ 区分两类错误：「不是合法 Base64（含非法字符/长度错误）」与「字节序列不是合法 UTF-8」
- `encodeUrl(text)`：直接 `encodeURIComponent`
- `decodeUrl(text)`：先 `text.replace(/\+/g, ' ')` 再 `decodeURIComponent`（try/catch：`URIError` → 「百分号序列非法或不完整」；`fatal` 不适用，decodeURIComponent 内部已抛）

### D3: 页面状态模型——输入即转换，无「执行」按钮

页面持有 `input` / `mode` 两个状态；`output` 与 `error` 由 `useMemo(() => convert(input, mode), [input, mode])` 派生——编解码是纯函数且输入量小，实时转换比按钮触发顺手，也省去输出状态同步。输入为空时输出与错误均清空。切换 mode 时输入保留、输出自动重算（满足 spec 的「清空错误」语义）。

Segmented 选项值用字面量 `'b64-encode' | 'b64-decode' | 'url-encode' | 'url-decode'`。左右双栏 CodeEditor 均用 `language="text"`；输出栏 `readOnly`。

### D4: 状态栏与说明文案

状态栏：`输入 N 字符 / M 字节 | 输出 N 字符 / M 字节`（字节数用 `new TextEncoder().encode(s).length`，不用 Blob.size，语义更直白）；错误时追加红色错误文本（复用 `--error` 令牌）。工具栏右侧放一行说明（`--text-tertiary`）：「URL 编码空格为 %20；解码时 + 按 form 约定还原为空格」。

### D5: 工具注册与配色

`tools.tsx` 追加 `{ name: 'Base64/URL', path: 'codec', element: <Base64UrlCodec /> }`。theme.less 工具专属色区块追加一行 `--tool-base64: #49df5d; // Base64/URL 编解码 · 松绿 128°（机器编码）`。页面标题用 `var(--tool-base64)`，Segmented/按钮继承既有 antd 暗色映射，无新增硬编码色值。

## Risks / Trade-offs

- [超长输入逐字节转 binary string 栈溢出] → 分块（32KB）拼接 + apply 展开；工具场景输入量有限，分块已足够
- [TextDecoder fatal 模式在低版本浏览器缺失] → 项目目标为现代浏览器（Vite 8 baseline），Chrome/Edge/Firefox/Safari 均支持，不兼容
- [URL 解码把 `+` 一律转空格，对「字面 + 号」场景过度转换] → 取舍：form 编码（+ 表空格）远比字面 + 号常见于解码场景；说明文案写清规则，用户可自行判断
- [CodeEditor 编辑器实例只创建一次，language 不支持运行时切换] → 本工具与 JsonFormatter 均静态指定，无需求；若未来需要再用 compartment 扩展
- [stylelint 字母序/prettier 冲突] → 提交前跑 `pnpm lint` 与 lint-staged，--fix 整理

## Migration Plan

1. CodeEditor 加 `language` prop（向后兼容）
2. theme.less 登记 `--tool-base64`
3. 新建 `Base64UrlCodec/utils.ts`（四个纯函数）
4. 新建 `Base64UrlCodec/index.tsx` + `index.module.less`
5. `tools.tsx` 注册
6. `pnpm build` + `pnpm lint`
7. `pnpm dev` + Playwright 验收（中文/emoji 往返、URL-safe 容错、非法输入、URL 编解码、JsonFormatter 回归），截图 /tmp/lolf-review/codec.png
8. 单提交 `feat(tools): add base64/url codec tool`，无回滚压力

## Open Questions

- 无
