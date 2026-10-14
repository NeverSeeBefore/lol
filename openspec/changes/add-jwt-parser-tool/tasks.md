# Tasks

## 1. 令牌登记与解析纯函数

- [x] 1.1 theme.less 工具专属色区块追加 `--tool-jwt: #d384eb; // JWT 解析 · 紫罗兰 286°（亮层）`
- [x] 1.2 docs/design/ui-spec.md §2.4 表格同步加行（保留他人新增行）
- [x] 1.3 新建 `src/views/Tools/JwtParser/utils.ts`：`decodeBase64Url`（归一 → 校验 → 补 padding → atob → TextDecoder fatal）
- [x] 1.4 `parseJwt`：段数校验 → 逐段解码 Header/Payload JSON（判别联合，单段失败不牵连）→ Signature 原始透传
- [x] 1.5 时间格式化与时长格式化辅助函数（本地 + UTC；人类可读时长）

## 2. 工具页面

- [x] 2.1 新建 `src/views/Tools/JwtParser/index.tsx` + `index.module.less`：info Alert（纯本地解析提示）+ 输入 CodeEditor（text）+ Header/Payload/Signature 三面板
- [x] 2.2 输入即解析：结果由 useMemo 派生；空输入不报错、展示清空
- [x] 2.3 时间戳区块：exp/iat/nbf 本地 + UTC 时间；exp 过期状态（已过期 `--error` / 剩余 `--success`）
- [x] 2.4 三类错误提示：段数错误 / base64url 非法 / JSON 非法，各段独立显示
- [x] 2.5 各段一键复制（复制成功 message 反馈，空/失败不可复制）
- [x] 2.6 暗色规范：标题 `--tool-jwt`，其余引用令牌，无硬编码色值

## 3. 注册与验证

- [x] 3.1 `tools.tsx` 注册 `{ name: 'JWT 解析', path: 'jwt' }`
- [x] 3.2 `pnpm build` 通过
- [x] 3.3 `pnpm lint` 无 error、无新增 warning
- [x] 3.4 Playwright 实测：合法 JWT（exp 过期/未过期两种）、三类畸形输入错误提示、复制、其他工具页抽查回归 1 个
- [x] 3.5 截图 `/tmp/lolf-review/jwt.png`，kill dev server
- [x] 3.6 git 提交 `feat(tools): add jwt parser tool`（含 openspec change 目录），提交前 git status 确认只 stage 自己的文件

## Workflow follow-up

- 用户确认验收后运行 openspec archive 归档本变更
