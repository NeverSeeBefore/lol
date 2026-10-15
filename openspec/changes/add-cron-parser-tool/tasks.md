# Tasks

## 1. 令牌登记与依赖

- [x] 1.1 theme.less 工具专属色区块追加 `--tool-cron: #ed9ba9; // Cron 解析 · 樱粉 350°（亮层）`
- [x] 1.2 docs/design/ui-spec.md §2.4 表格同步加行（保留他人新增行）
- [x] 1.3 `pnpm add cron-parser`（显式直接依赖；v5 自带类型，无需 @types）

## 2. 解析纯函数（utils.ts）

- [x] 2.1 段定义与逐段解析 `parseField`：`*`/`a`/`a-b`/`*/n`/`a-b/n`/`a/n`/列表/名字映射/`?`（仅日周）/7→周日归一；产出取值集合
- [x] 2.2 段级友好报错：段数（5/6）、越界（第 N 段「名」：取值 X 超出 min-max）、无法解析、步长 0、区间倒置、Quartz 扩展 L/W/#、@reboot 与未知宏拒绝
- [x] 2.3 中文描述生成：常见模式短句（每分钟/每 n 分/每小时第 m 分/每天 HH:mm/工作日/每周/每月/每年）+ 组合兜底
- [x] 2.4 未来执行时间：宏展开 + `?`→`*` 预处理后交 cron-parser `take(n)`；本地时区格式化 `YYYY-MM-DD HH:mm:ss 星期X`
- [x] 2.5 取值集合压缩展示（全集/区间合并/超长截断）与字段含义文案

## 3. 工具页面

- [x] 3.1 新建 `src/views/Tools/CronParser/index.tsx` + `index.module.less`：输入卡（mono Input + 复制 + 速查 Tag 行）、错误 Alert、描述卡、未来执行时间卡（Segmented 5/10/20 + 时区说明）、字段分解卡（antd Table）
- [x] 3.2 输入即解析（useMemo 派生），非法时隐藏结果区，空输入不报错
- [x] 3.3 暗色规范：标题 `--tool-cron`，无硬编码色值

## 4. 注册与验证

- [x] 4.1 `tools.tsx` 注册 `{ name: 'Cron 解析', path: 'cron' }`
- [x] 4.2 `pnpm build` 通过
- [x] 4.3 `pnpm lint` 无 error、无新增 warning
- [x] 4.4 Playwright 实测：8+ 组标准表达式解析、未来 10 次时间正确性抽查（与已知答案比对）、字段分解表、各段报错（32 日/25 时/60 分/13 月/8 周/段数）、宏、速查填充、中文描述、其他工具页回归 1 个
- [x] 4.5 截图 `/tmp/lolf-review/cron.png`，kill dev server
- [x] 4.6 git 提交 `feat(tools): add cron parser tool`（含 openspec change、package.json、pnpm-lock），提交前 git status 确认只 stage 自己的文件

## Workflow follow-up

- 用户确认验收后运行 openspec archive 归档本变更
