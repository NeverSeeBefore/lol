# Proposal

## Why

调试接口时查看 JWT 是高频需求，但在线 JWT 解码器要求把 token 贴到第三方站点，存在泄露风险。工具集主张纯本地处理（无后端、无网络请求），新增一个「JWT 本地解析器」：粘贴 token 即拆解 Header / Payload / Signature 三段并展示，token 不离开浏览器。

## What Changes

- 新增工具页 `src/views/Tools/JwtParser/`（index.tsx、index.module.less、utils.ts）：粘贴 JWT → 实时解析三段
  - Header / Payload：base64url 解码 + JSON 格式化，用 CodeEditor（readOnly + `language="json"`）展示
  - Signature：显示原始 base64url 文本，明确标注「不验证签名」（纯解析，无密钥、无验签逻辑）
- 时间戳声明智能展示：Payload 中的 `exp` / `iat` / `nbf` 自动转为可读时间（本地时区 + UTC）；`exp` 额外显示过期状态——已过期（红色 `--error`）或剩余时间（绿色 `--success`）
- 错误处理三类分明：段数不等于 3、base64url 非法、Header/Payload 非合法 JSON——各自给出说明原因的明确提示，不道歉
- 页面顶部 info 提示条（antd Alert，`--info` 语义）：「纯本地解析，token 不会离开浏览器」——核心卖点
- 各段一键复制按钮（复制解码后的 JSON / 原始签名段）
- `src/views/Tools/tools.tsx` 注册 `{ name: 'JWT 解析', path: 'jwt' }`
- theme.less 工具专属色区块登记 `--tool-jwt: #d384eb;`（紫罗兰 286°，亮层，已预分配）；docs/design/ui-spec.md §2.4 表格同步加行

## Capabilities

### New Capabilities

- `jwt-parser`: JWT 本地解析能力——三段拆解、base64url 解码与 JSON 展示、时间戳声明（exp/iat/nbf）的可读化与过期状态判定、分类错误提示、一键复制；不验签、纯本地、无网络请求

### Modified Capabilities

（无现有 specs 覆盖工具注册或 CodeEditor，不涉及）

## Impact

- **代码**：新增 `src/views/Tools/JwtParser/`（index.tsx、index.module.less、utils.ts）；改 `src/views/Tools/tools.tsx`、`src/static/styles/theme.less`、`docs/design/ui-spec.md`（§2.4 表格加一行）
- **依赖**：无新增依赖（原生 atob + TextDecoder + JSON.parse，手写 base64url 解码）
- **兼容性**：纯新增，`pnpm build` 与 `pnpm lint` 必须通过；其他工具页 Playwright 抽查回归
- **规范**：遵守 docs/design/ui-spec.md，颜色一律 theme.less 令牌，无硬编码色值
