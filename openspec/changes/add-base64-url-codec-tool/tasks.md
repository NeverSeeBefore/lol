# Tasks

## 1. CodeEditor 前置重构（向后兼容）

- [x] 1.1 `CodeEditorProps` 新增可选 `language?: 'json' | 'text'`（默认 `'json'`），`json()` 扩展按 prop 条件加入
- [x] 1.2 JsonFormatter 不传该 prop，行为完全不变（不做其他顺手修改）

## 2. 令牌登记与编解码纯函数

- [x] 2.1 theme.less 工具专属色区块追加 `--tool-base64: #49df5d; // Base64/URL 编解码 · 松绿 128°（机器编码）`
- [x] 2.2 新建 `Src/views/Tools/Base64UrlCodec/utils.ts`：`encodeBase64`（TextEncoder → 分块 binary string → btoa，Unicode 安全）
- [x] 2.3 `decodeBase64`（去空白 → URL-safe 映射 → 字符集校验 → 补 padding → atob → TextDecoder fatal；区分「非法 Base64」与「非法 UTF-8」两类错误）
- [x] 2.4 `encodeUrl`（encodeURIComponent）/`decodeUrl`（`+` 先转空格再 decodeURIComponent，URIError 转明确错误）

## 3. 工具页面

- [x] 3.1 新建 `Src/views/Tools/Base64UrlCodec/index.tsx` + `index.module.less`：工具栏（Segmented 四模式 + 复制 + 清空）+ 左右双栏 CodeEditor（`language="text"`，输出栏 readOnly）+ 状态栏
- [x] 3.2 输入即转换：output/error 由 useMemo 派生；切模式保留输入、清空错误；空输入不报错
- [x] 3.3 状态栏：输入/输出的 UTF-8 字节数与字符数（TextEncoder 统计），错误红字（`--error`）
- [x] 3.4 说明文案：写清「URL 编码空格为 %20；解码时 + 按 form 约定还原为空格」
- [x] 3.5 暗色规范：标题用 `--tool-base64`，其余引用 theme.less 令牌，无新增硬编码色值

## 4. 注册与验证

- [x] 4.1 `tools.tsx` 注册 `{ name: 'Base64/URL', path: 'codec' }`
- [x] 4.2 `pnpm build` 通过
- [x] 4.3 `pnpm lint` 无 error、无新增 warning
- [x] 4.4 Playwright 实测：中文/emoji Base64 往返一致、URL-safe 变体与缺失 padding 解码、非法输入明确提示、URL 编解码（含 `+`）、JsonFormatter 页回归（JSON 格式化仍正常）
- [x] 4.5 截图 `/tmp/lolf-review/codec.png`，kill dev server
- [x] 4.6 git 提交 `feat(tools): add base64/url codec tool`（含 openspec change 目录）

## Workflow follow-up

- 用户确认验收后运行 openspec archive 归档本变更
