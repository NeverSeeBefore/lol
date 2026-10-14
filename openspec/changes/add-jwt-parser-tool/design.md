# Design

## Context

工具集新增「JWT 本地解析器」。JWT = `base64url(header).base64url(payload).base64url(signature)`。解析是纯字符串操作（split + 解码 + JSON.parse），不需要任何第三方库（pnpm 严格隔离，不引入未声明包），也不做签名校验——页面需把「不验证签名」说清，避免误导用户把解析成功当作 token 可信。

## Decisions

### 解码层（utils.ts，纯函数）

- `decodeBase64Url(segment)`：`-`→`+`、`_`→`/` 归一 → 字符集校验 → 补 padding → `atob` → `TextDecoder('utf-8', { fatal: true })`。与 Base64UrlCodec 的 `decodeBase64` 思路一致，但独立实现、不跨工具 import（工具间保持自治，避免误耦合）。
- `parseJwt(token)` 返回判别联合：
  - 段数 ≠ 3 → `{ ok: false, error }`（指明实际段数）
  - 段数正确 → 逐段解析 Header / Payload：`{ ok, header: SegmentResult, payload: SegmentResult, signature: string }`，其中 `SegmentResult = { ok: true; json: string; data: unknown } | { ok: false; error: string }`——单段失败不牵连其他段。
- 错误文案三类分明：段数错误 / base64url 非法 / JSON 非法，均说明原因、不道歉（ui-spec §5 错误提示条）。

### 时间戳声明

- 从 `payload.data`（仅当为对象时）读取 `exp` / `iat` / `nbf`，值为 number 才处理。
- 格式化：本地时区 `YYYY-MM-DD HH:mm:ss`（手写 padStart 拼接，不引入 dayjs）+ UTC（`date.toISOString()` 截取）。TimestampConverter 若已有格式化函数可复用，否则本地实现（实现时确认）。
- `exp` 状态判定：`exp * 1000` 与 `Date.now()` 比较；剩余/已过时长用「Xd Xh Xm Xs」人类可读格式；已过期 `--error`、未过期 `--success`。
- 倒计时不做 setInterval 实时跳动（输入即解析的静态工具，动效规范「只回应用户动作」）；展示的是解析时刻的剩余时间。

### 页面结构（index.tsx）

- 顶部 antd `Alert`（`type="info"`）：「纯本地解析，token 不会离开浏览器」。
- 输入：单个 CodeEditor（`language="text"`），输入即解析（useMemo 派生，模式同 Base64UrlCodec）。
- 输出：上中下三个面板（Header / Payload / Signature）：
  - Header、Payload：CodeEditor readOnly + `language="json"`，面板标题旁放复制按钮与错误提示。
  - Signature：等宽只读文本 + 「不验证签名」标注 + 复制按钮。
- 时间戳区块：Payload 面板下方，Descriptions 或简单表格列出 exp/iat/nbf 的本地 + UTC 时间与过期状态。
- 三段固定纵向布局（非双栏），因为 JWT 通常一段输入、三段输出，纵向堆叠阅读顺序自然。

### 颜色

- 页面标题 `--tool-jwt`（紫罗兰 `#d384eb`，286°，亮层，已预分配）。
- 过期/未过期用语义色 `--error` / `--success`（语义色只管状态，不违反「专属色不管交互」）。
- 其余一律 theme.less 令牌，无硬编码色值。

### 隐私

- 无任何网络请求：解析全在 useMemo 内同步完成。Alert 文案作为核心卖点固定在顶部。

## Risks

- **CodeMirror json 模式对非法 JSON 的红波浪线**：输出区只在解析成功时挂载 JSON，失败时显示错误文案，不渲染编辑器，避免误导。
- **大 token**：JWT 通常 < 2KB，useMemo 同步解析无性能问题；不做防抖。
