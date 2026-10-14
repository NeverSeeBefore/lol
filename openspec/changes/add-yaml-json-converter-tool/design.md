# Design

## Context

工具集新增「YAML ↔ JSON 转换」。YAML 语法远比 JSON 复杂（缩进敏感、多文档、锚点、注释、多种标量写法），手写解析不现实，引入 `yaml` 库（计划内直接依赖，pnpm 严格隔离要求显式 `pnpm add yaml`）。解析全部在浏览器本地同步完成，无网络请求。已用 yaml 2.9.1 实测确认关键行为（见下）。

## Decisions

### 转换层（utils.ts，纯函数）

- `convertYamlToJson(input): CodecResult`：`yaml.parseAllDocuments(input, { merge: true })` 解析（多文档支持；`merge: true` 让 `<<: *ref` 合并键也按 YAML 1.1 语义展开）→ 逐文档 `doc.toJSON()` → 单文档输出 `JSON.stringify(data, null, 2)`，多文档输出为 JSON 数组。
  - **实测关键坑**：`parseAllDocuments` 解析失败**不抛异常**，错误收进 `doc.errors`，`toJSON()` 仍返回尽力而为的错误结果——必须显式检查 `doc.errors`，非法 YAML 才能正确报错（否则静默产出残缺 JSON）。
  - 实测：解析错误对象含 `linePos: [{ line, col }, ...]` 与 `code`，但 `message` 内嵌输入代码片段回显（如 `\n\n 2\n ^\n`），直接展示会剧透输入且冗长 → **错误格式化函数**从 `message` 截取首行并剥离「 at line N, column M」尾巴，用 `linePos` 重组为「第 N 行：原因」；无 `linePos` 时只给原因。
  - 实测：锚点/别名（`&x`/`*x`）解析后自动展开为内联值；`doc.toJSON()` 的结果 JSON.stringify 即可（极端循环引用 JSON.stringify 会抛错，归入错误提示兜底）。
- `convertJsonToYaml(input): CodecResult`：`JSON.parse` → `yaml.stringify(data, { indent: 2 })`（实测输出 2 空格缩进，中文不转义）。
  - V8 的 JSON.parse 错误消息含「at position N」时换算为行列号（按 `\n` 分段累计），给出「第 N 行：原因」；无位置信息时直接给原因。
- 判别联合 `CodecResult = { ok: true; result: string; docCount?: number } | { ok: false; error: string }`——`docCount > 1` 时页面提示「输入含 N 个文档，已合并为 JSON 数组」。

### YAML 特性边界（实测确认）

| 特性         | 行为                                                     | 处理                                              |
| ------------ | -------------------------------------------------------- | ------------------------------------------------- |
| 多文档 `---` | parseAllDocuments 逐个解析                               | 单文档 → 单 JSON；多文档 → JSON 数组 + 文档数提示 |
| 锚点/别名    | 解析即展开为内联值；`merge: true` 使 `<<` 合并键同样展开 | 库选项处理，JSON 无引用概念                       |
| 注释         | `toJSON` 必然丢失                                        | YAML → JSON 方向工具栏常驻提示「注释不会保留」    |
| null 写法    | `~`/`null`/`Null`/空值 → null                            | 库默认行为，无需处理                              |
| 日期标量     | yaml 2.x 默认保持字符串（`2024-01-15` 不实例化 Date）    | 往返安全，无需处理                                |
| 制表符缩进   | 报 `TAB_AS_INDENT`，linePos 定位                         | 走错误定位流程                                    |

### 页面结构（index.tsx）

- 复刻 Base64UrlCodec 布局：`Segmented`（YAML → JSON / JSON → YAML）+ 复制 + 清空 + note 提示条 + 双栏 CodeEditor + 状态栏。
- 输入栏 `language="text"`（YAML 模式无现成扩展，text 即可；JSON → YAML 方向输入是 JSON，用 json 模式会有 lint 红波浪线干扰容错——统一 text 更稳，且 CodeEditor language 仅挂载时读取，切换方向不换语言）。
  - 再斟酌：JSON → YAML 方向输入用 `language="json"` 可获得语法高亮且 CodeEditor 只在挂载时读取 language——切换方向会重挂载（key 或条件渲染）。决定：**按方向给输入编辑器 language**（y2j → text，j2y → json），输出编辑器同理（y2j → json，j2y → text），切换方向时通过 `key={mode}` 强制重挂载编辑器，代价是切换方向丢失输入内容 undo 栈——可接受（输入 state 保留在 React 侧，编辑器内容经 value 同步不丢）。
- note 提示按方向切换：YAML → JSON 显示「YAML 注释不会保留；多文档（---）将合并为 JSON 数组」；JSON → YAML 显示「输出为 2 空格缩进 YAML」。
- 多文档提示：转换成功且 `docCount > 1` 时状态栏追加「N 个文档 → JSON 数组」。
- 状态栏：`输入 N 字符 / M 字节 | 输出 …`，错误时 `--error` 色追加错误文案（同 Base64UrlCodec 的 `.invalid`）。

### 颜色

- 页面标题 `--tool-yaml`（碧绿 `#84EBAA`，142°，亮层，已预分配）。
- 错误用语义色 `--error`；其余一律 theme.less 令牌，无硬编码色值。

## Risks

- **CodeMirror language 仅挂载时读取**：切换方向需要换语言 → 用 `key={mode}` 强制重挂载，React state 保住文本，实测验证内容不丢。
- **大输入**：转换是同步 O(n)，yaml 解析万行级配置毫秒级，不做防抖（同 Base64UrlCodec 决策）。
- **循环引用别名**：`a: &x {b: *x}` 会产出循环对象，JSON.stringify 抛错 → try/catch 兜底为错误提示「含循环引用，无法转为 JSON」。
