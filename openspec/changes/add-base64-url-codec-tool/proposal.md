# Proposal

## Why

工具集已有 JSON 格式化、颜色转换、时间戳转换三个工具。Base64/URL 编解码是前端日常高频需求（接口调试、token 查看、URL 参数处理），且原生 `btoa`/`atob` 对中文与 emoji 会直接抛 `InvalidCharacterError`，市面在线工具质量参差，值得做一个 Unicode 安全的本地工具。同时 `CodeEditor` 组件目前硬编码 `json()` 语言扩展，本工具需要纯文本编辑器，需先做一处小型向后兼容重构。

## What Changes

- **前置重构**：`src/components/CodeEditor/index.tsx` 把硬编码的 `json()` 语言扩展提取为可选 prop `language?: 'json' | 'text'`（默认 `'json'`），不传时行为完全不变（JsonFormatter 无需改动）
- 新增工具页 `src/views/Tools/Base64UrlCodec/`：左右双栏 CodeEditor（输入/输出）+ antd Segmented 切换四种模式（Base64 编码 / Base64 解码 / URL 编码 / URL 解码）
- Base64 编解码 Unicode 安全：编码经 TextEncoder → 字节 → binary string → btoa；解码反向经 atob → 字节 → TextDecoder，中文/emoji 往返一致
- Base64 解码容错：容忍 URL-safe 变体（`-`/`_`）与缺失 padding；非法输入给出说明原因的明确错误提示
- URL 编解码：encodeURIComponent/decodeURIComponent 语义；解码前把 `+` 还原为空格（兼容 form 编码），UI 说明文案写清 `+` 与 `%20` 的差异
- 一键复制输出；状态栏显示输入/输出的字节数（UTF-8）与字符数
- `src/views/Tools/tools.tsx` 注册 `{ name: 'Base64/URL', path: 'codec' }`
- theme.less 工具专属色区块登记 `--tool-base64: #49df5d;`（松绿 128°，暗层，已预分配），页面标题与选中态使用

## Capabilities

### New Capabilities

- `text-codec`: Base64/URL 编解码工具能力——Unicode 安全的 Base64 双向转换（容错 URL-safe 变体与缺失 padding）、encodeURIComponent 语义的 URL 双向转换（兼容 `+` 空格约定）、一键复制与字节/字符统计

### Modified Capabilities

（无现有 specs 覆盖 CodeEditor，不涉及；CodeEditor 重构为纯内部实现调整，对外向后兼容）

## Impact

- **代码**：`src/components/CodeEditor/index.tsx`（向后兼容扩展）、新增 `src/views/Tools/Base64UrlCodec/`（index.tsx、index.module.less、utils.ts）、`src/views/Tools/tools.tsx`、`src/static/styles/theme.less`（登记令牌）
- **依赖**：无新增依赖（原生 btoa/atob + TextEncoder/TextDecoder + encodeURIComponent）
- **兼容性**：CodeEditor 重构向后兼容，JsonFormatter 行为不变（Playwright 回归验证）；`pnpm build` 与 `pnpm lint` 必须通过
- **规范**：遵守 docs/design/ui-spec.md，颜色一律用 theme.less 令牌，不新增硬编码色值
