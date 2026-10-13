# Proposal

## Why

工具集已有 JSON 格式化、颜色转换两个工具。Unix 时间戳与日期时间互转是开发调试日志、排查接口的高频需求，现有在线工具广告多、不支持批量。本工具的差异化点是「批量模式」：粘贴多行日志文本，逐行识别其中的时间戳并就地替换为可读时间，一步完成日志可读化。

## What Changes

- 新增工具页 `src/views/Tools/TimestampConverter/`（index.tsx + index.module.less + utils.ts）：
  - 「当前时间戳」卡片：秒级实时跳动（setInterval，卸载清理），显示秒/毫秒两种精度，一键复制
  - 时间戳 → 日期：输入 Unix 时间戳，**自动识别秒/毫秒**（按位数阈值判断），输出本地时区与 UTC 双行可读时间
  - 日期 → 时间戳：输入 `YYYY-MM-DD HH:mm:ss` 格式的本地时间字符串，输出秒/毫秒两种时间戳
  - 批量模式：粘贴多行日志文本，正则逐行匹配其中的时间戳（自动识别秒/毫秒），就地替换为可读时间
  - 非法输入给出明确提示（说明原因，不道歉）；负数（1970 前）、0、超出 Date 范围的超大值行为在 design.md 中定义
- 日期处理只用原生 `Date` + `Intl`，**不引入 dayjs**（pnpm 严格隔离，dayjs 是 antd 传递依赖，禁止 import）
- `src/views/Tools/tools.tsx` 注册新工具（路径 `timestamp`，路由与子导航自动生效）
- 页面标题/身份点缀使用工具专属色 `--tool-time`（#E879C6 洋红，已登记于 theme.less）；交互元素仍用琥珀系令牌

## Capabilities

### New Capabilities

- `timestamp-convert`: 时间戳转换工具能力——当前时间戳实时展示与复制、Unix 时间戳（自动识别秒/毫秒）与本地日期时间字符串双向转换（本地 + UTC 双行显示）、日志文本批量就地替换时间戳、非法输入与边界值的明确错误提示

### Modified Capabilities

（无现有 specs，不涉及）

## Impact

- **代码**：新增 `src/views/Tools/TimestampConverter/`（index.tsx、index.module.less、utils.ts）、修改 `src/views/Tools/tools.tsx`
- **依赖**：无新增依赖（原生 Date + Intl）
- **兼容性**：纯新增页面，不影响既有工具；`pnpm build` 与 `pnpm lint` 必须通过
- **规范**：遵守 docs/design/ui-spec.md，颜色一律用 theme.less 令牌，不新增硬编码色值
