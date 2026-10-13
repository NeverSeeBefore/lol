# Tasks

## 1. 转换核心 utils.ts

- [x] 1.1 新建 `Src/views/Tools/TimestampConverter/utils.ts`：`parseTimestamp`（正则 `^-?\d+$` + safe integer 校验 + 10^12 阈值识别秒/毫秒 + Invalid Date 检测，返回精度与毫秒值或错误原因）
- [x] 1.2 `formatDateTime(date, timeZone)`：Intl.DateTimeFormat formatToParts 拼 `YYYY-MM-DD HH:mm:ss`，年份补零 4 位
- [x] 1.3 `utcOffsetLabel()`：getTimezoneOffset 换算 `UTC±H[:mm]` 标注
- [x] 1.4 `parseDateTime`：正则提取 + 字段范围校验 + 本地构造 + 回读校验（拦截 2 月 30 日），失败返回错误原因
- [x] 1.5 `batchReplace`：`/(?<![\d.])(\d{13}|\d{10})(?![\d.])/g` 就地替换，返回替换后文本与计数，Invalid Date 保留原文

## 2. 工具页面

- [x] 2.1 新建 `index.tsx` + `index.module.less`：标题用 `--tool-time`，App 包裹 message
- [x] 2.2 当前时间戳卡片：秒/毫秒双读数（等宽字体），setInterval 1s 跳动 + 卸载 cleanup，各配复制按钮
- [x] 2.3 时间戳 → 日期区：输入 + 转换 + 精度标注 + 本地（带 UTC 偏移标注）/UTC 双行结果 + 各行复制；非法输入 message.error 且保留上次结果
- [x] 2.4 日期 → 时间戳区：输入 + 转换 + 秒/毫秒双结果 + 各行复制；非法输入 message.error
- [x] 2.5 批量模式卡片：TextArea 输入 + 转换 + 只读结果 TextArea + 复制 + 替换计数显示
- [x] 2.6 暗色规范自查：全部颜色引用 theme.less 令牌，无硬编码色值

## 3. 注册与验证

- [x] 3.1 `tools.tsx` 注册 `{ name: '时间戳转换', path: 'timestamp' }`
- [x] 3.2 `pnpm build` 通过
- [x] 3.3 `pnpm lint` 无 error、无新增 warning
- [x] 3.4 `pnpm dev` 起服务，Playwright 实测 `/tools/timestamp`：双向转换对照手算值（1735689600 → 2025-01-01 08:00:00 UTC+8）、毫秒识别、批量模式、非法输入、负数/0/超范围，截图存 /tmp/lolf-review/timestamp.png，完事 kill dev server
- [x] 3.5 git 提交 `feat(tools): add timestamp converter tool`（含 openspec change 目录）

## Workflow follow-up

- 用户确认验收后运行 openspec archive 归档本变更
