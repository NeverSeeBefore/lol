# Proposal

## Why

排查定时任务「到底什么时候跑」是高频需求：运维脚本、CI 计划、Quartz/K8s CronJob 表达式散落在各处，人脑解析 `*/5 9-17 1,15 * 1-5` 极易出错，贴到第三方在线解析站又有泄露内网调度信息的风险。工具集主张纯本地处理，新增「Cron 表达式解析」补齐时间类工具链（时间戳转换之外的一种时间表达）。

## What Changes

- 新增工具页 `src/views/Tools/CronParser/`（index.tsx、index.module.less、utils.ts）：输入 cron 表达式实时解析，输出三块结果——中文人类可读描述、未来 N 次执行时间列表（本地时区，`YYYY-MM-DD HH:mm:ss 星期X`）、各字段分解表（段名/原始值/含义/取值集合）
- **方言边界**（详见 design.md）：标准 5 段（分 时 日 月 周）+ 6 段带秒自动识别；支持月/周英文名（JAN-DEC/SUN-SAT）、`7` 表示周日、`?`（视同 `*`，仅限日/周段）、`@daily`/`@hourly` 等宏；Quartz 扩展 `L`/`W`/`#` 明确拒绝并提示；`@reboot` 拒绝（无法用时间表达）
- **友好报错**：非法表达式指明哪一段错、为什么（如「第 3 段「日」：取值 32 超出 1-31」），段数不对、步长为 0、区间倒置、非法字符均有对应文案
- 常用表达式速查（点击填充）：每分钟/每小时/每天零点/每天 9:30/工作日 9 点/每周一/每月 1 号/每年元旦
- 一键复制表达式；未来执行时间条数可切换（5/10/20）；页面注明「按本地时区计算」
- `src/views/Tools/tools.tsx` 注册 `{ name: 'Cron 解析', path: 'cron' }`
- theme.less 工具专属色区块登记 `--tool-cron: #ed9ba9;`（樱粉 350°，亮层 L≈77%，已预分配；与琥珀 31° 跨层间距 41° ≥30°，与 error 红 358° 间距 8° 但 ΔL≈13% 满足 <15° 需 ΔL≥12% 条款）；docs/design/ui-spec.md §2.4 表格同步加行（保留他人新增行）

## Capabilities

### New Capabilities

- `cron-parser`: Cron 表达式解析能力——5/6 段校验与方言识别、逐段取值集合展开、中文描述生成、未来 N 次执行时间计算（cron-parser 库）、逐段友好报错、常用表达式速查；纯本地、无网络请求

### Modified Capabilities

（无现有 specs 覆盖工具注册，不涉及）

## Impact

- **代码**：新增 `src/views/Tools/CronParser/`（index.tsx、index.module.less、utils.ts）；改 `src/views/Tools/tools.tsx`、`src/static/styles/theme.less`、`docs/design/ui-spec.md`（§2.4 表格加一行）
- **依赖**：**新增直接依赖 `cron-parser`**（计划内，pnpm 严格隔离要求显式声明；v5 自带 TypeScript 类型，无需 @types）
- **兼容性**：纯新增，`pnpm build` 与 `pnpm lint` 必须通过；其他工具页 Playwright 抽查回归
- **规范**：遵守 docs/design/ui-spec.md，颜色一律 theme.less 令牌，无硬编码色值
