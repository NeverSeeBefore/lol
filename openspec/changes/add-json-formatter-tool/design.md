# Design

## Context

见 proposal.md - Why。技术现状：Vite 8 + React 19 + antd 6 + react-router 7，已有 `/test` 分区用 `TestNav + Outlet` 实现"子导航 + 内容区"模式（可复用）；项目尚无编辑器组件。动机与范围见 proposal.md。

## Goals / Non-Goals

**Goals:**

- 立起 `/tools` 分区骨架（布局 + 子导航），后续工具零成本接入
- CodeMirror 6 封装为可复用组件 `src/components/CodeEditor/`，后续工具（格式转换、代码美化）直接用
- 错误定位做到行内标记（红波浪线）+ 行列号 + 原因

**Non-Goals:**

- 树形视图、JSONPath、diff、JSON→TS/YAML（后续迭代）
- Web Worker 大文件解析、本地历史记录、账号/云存储
- 迁移 `/test` 下已有的 color-transform（本次不动，后续单独 change）

## Decisions

### D1: 编辑器选 CodeMirror 6 而非 Monaco / textarea

- Monaco：~3MB+ 体积，个人站首屏代价高；textarea：高亮/行号/行内 lint 全要自造
- CodeMirror 6 模块化按需引入（`@codemirror/view`、`state`、`language`、`lint`、`lang-json`），体积几百 KB
- 封装 `<CodeEditor value onChange readOnly lintMarkers? />`，隔离 CM 的 EditorView 生命周期（useEffect 内创建/销毁），React 侧只见受控 value

### D2: 错误定位双通道：`json5`/`JSON.parse` 异常 + `@codemirror/lint`

- 严格模式 `JSON.parse`，容错模式 `JSON5.parse`；两者异常信息都含位置（json5 报错带 lineNumber/columnNumber；JSON.parse 的 message 含 position，需解析）
- 把解析错误转成 CM 的 lint Diagnostic（from/to/severity/message），行内红波浪线 + 状态栏文字双展示
- 备选：引入 `jsonc-parser` 拿更精确的错误——暂不需要，异常信息已够用

### D3: `/tools` 复用 `/test` 的布局模式，但独立成目录

- `src/views/Tools/index.tsx`（子导航 + `<Outlet/>`）+ `src/views/Tools/JsonFormatter/`
- 路由：`/tools` index 重定向到 `/tools/json`；工具列表抽成数组配置（name/path/element），加工具 = 加一项
- 备选：直接改 `/test`——否决，`/test` 语义是 demo 实验区，工具是正式功能

### D4: 解析纯函数化，与 UI 解耦

- `src/utils/jsonFormat.ts`：`parse(input, { tolerant })`、`format(input, { indent, tolerant })`、`minify(...)` 返回 `{ ok, result?, error? { message, line, column } }`
- UI 只消费结果对象，便于后续单测与 Worker 化

### D5: 布局为左右分栏 + 顶部操作条 + 底部状态栏

- 操作条：格式化/压缩按钮、缩进 Select（2/4/Tab）、容错模式 Switch、复制/下载/清空
- antd 6 组件（Button/Select/Switch/message）与 CodeMirror 混排，CM 主题用默认 light，不定制

## Risks / Trade-offs

- [antd 6 与 CM6 样式互相污染（全局 reset/盒模型）] → CM 容器限定作用域类名，问题出现时再处理
- [大输入（>1MB）时同步解析卡顿] → 暂接受；状态栏展示输入体积，超 2MB 提示但不拦截，Worker 化留作后续迭代
- [JSON.parse 各浏览器错误消息格式不一致，position 解析可能失效] → 解析失败时降级为只展示原始 message，不展示行内标记

## Open Questions

- 容错模式开关的默认值（默认开 or 关）——实现时定，倾向默认关（严格优先）
