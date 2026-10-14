# Proposal

## Why

YAML 是 K8s / CI 配置的事实标准，JSON 是接口数据的事实标准，两者互转是调试与配置搬运的高频需求。在线转换站要求把配置贴到第三方（配置常含内网地址/密钥），工具集主张纯本地处理，新增「YAML ↔ JSON 转换」补齐格式转换工具链。

## What Changes

- 新增工具页 `src/views/Tools/YamlJsonConverter/`（index.tsx、index.module.less、utils.ts）：双栏 CodeEditor，Segmented 切换转换方向（YAML → JSON / JSON → YAML），输入即转换（useMemo 派生，模式同 Base64UrlCodec）
- YAML 解析错误定位：利用 `yaml` 库错误的 `linePos` 提取行/列号，给出「第 N 行：原因」式友好提示（剥掉库报错里重复的代码片段回显）
- YAML 特性边界处理（详见 design.md）：
  - 多文档（`---`）：单文档输出单个 JSON；多文档合并为 JSON 数组输出，UI 提示文档数
  - 锚点/别名（`&ref` / `*ref`）：解析时自动展开为内联值（JSON 无引用概念）
  - 注释：YAML → JSON 注释必然丢失，方向为 YAML → JSON 时 UI 常驻提示
  - 特殊类型：日期保持字符串（yaml 2.x 默认不实例化 Date，往返安全）；`~` / `null` / `Null` / 空值统一为 JSON null
- JSON → YAML 输出风格固定 2 空格缩进（`yaml.stringify(obj, { indent: 2 })`）
- 一键复制输出；状态栏统计（输入/输出字符与字节数）
- `src/views/Tools/tools.tsx` 注册 `{ name: 'YAML/JSON', path: 'yaml' }`
- theme.less 工具专属色区块登记 `--tool-yaml: #84ebaa;`（碧绿 142°，亮层，已预分配）；docs/design/ui-spec.md §2.4 表格同步加行

## Capabilities

### New Capabilities

- `yaml-json-convert`: YAML ↔ JSON 双向转换能力——方向切换、YAML 解析（含多文档合并、锚点展开、错误行列定位）、JSON → YAML 2 空格缩进序列化、注释丢失提示、一键复制与状态栏统计；纯本地、无网络请求

### Modified Capabilities

（无现有 specs 覆盖工具注册或 CodeEditor，不涉及）

## Impact

- **代码**：新增 `src/views/Tools/YamlJsonConverter/`（index.tsx、index.module.less、utils.ts）；改 `src/views/Tools/tools.tsx`、`src/static/styles/theme.less`、`docs/design/ui-spec.md`（§2.4 表格加一行）
- **依赖**：**新增直接依赖 `yaml`**（计划内，pnpm 严格隔离要求显式声明）；无其他新增
- **兼容性**：纯新增，`pnpm build` 与 `pnpm lint` 必须通过；其他工具页 Playwright 抽查回归
- **规范**：遵守 docs/design/ui-spec.md，颜色一律 theme.less 令牌，无硬编码色值
