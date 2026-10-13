# Design

## Context

资产盘点（已核实）：

- 工具注册机制：`src/views/Tools/tools.tsx` 数组，路由（router/index.tsx）与子导航（Tools/index.tsx）共用——新工具只需在数组加一项
- 范例结构：`ColorConverter` 目录式（index.tsx + index.module.less + utils.ts），`App` 包裹以使用 antd message
- 令牌 `--tool-time: #e879c6` 已登记于 theme.less（工具专属色第三位成员）
- pnpm 严格隔离：**dayjs 是 antd 传递依赖，禁止 import**，日期处理用原生 `Date` + `Intl.DateTimeFormat`

约束：暗色规范禁止新增硬编码色值；错误提示文案遵守规范 §5（不道歉、说明原因）；React 19 下 setInterval 必须 cleanup。

## Goals / Non-Goals

**Goals:**

- 当前时间戳卡片：秒/毫秒双读数，秒级跳动，一键复制
- 时间戳 → 日期：自动识别秒/毫秒（位数阈值），本地 + UTC 双行显示
- 日期 → 时间戳：本地时区解析，秒/毫秒双输出
- 批量模式：日志文本中时间戳就地替换（差异化点）
- 边界行为明确：负数、0、超 Date 范围
- `pnpm build` + `pnpm lint` 通过，Playwright 实测验收

**Non-Goals:**

- 不做时区选择器（固定本地 + UTC 两行）
- 不做相对时间（"3 小时前"）、不做 ISO 8601/RFC 2822 等多格式输出
- 不做批量模式的反向替换（可读时间 → 时间戳）
- 不引入任何日期库

## Decisions

### D1: 秒/毫秒自动识别——绝对值阈值 10^12

判定规则：`|n| < 1e12` → 秒；`|n| >= 1e12` → 毫秒。

- 上界论证：1e12 秒 ≈ 33658 年，早已超出 Date 可表示范围（±2.7 亿年换算秒为 ±8.64e18，但实用场景不存在 33658 年的秒级时间戳）
- 下界论证：1e12 毫秒 = 2001-09-09，早于该时刻的毫秒时间戳（2001 年前）会被误判为秒——接受此代价：现实中毫秒精度时间戳几乎不会出现在 2001 年前的系统
- 该阈值是主流工具（如 unixtimestamp.com）的通用做法

### D2: 日期时间格式化——Intl.DateTimeFormat + 手工补零

不用 `date.toLocaleString()`（输出随 locale 变化，不稳定）。用 `Intl.DateTimeFormat` 配合显式 `timeZone` 参数取各字段（`formatToParts`），手工拼 `YYYY-MM-DD HH:mm:ss`：

- UTC 行：`timeZone: 'UTC'`
- 本地行：不传 timeZone，用 `Intl.DateTimeFormat().resolvedOptions().timeZone` 取时区名；偏移量通过 `(date.getTimezoneOffset())` 换算为 `UTC±H` 标注
- 年份 < 1000 时手工补零到 4 位（formatToParts 的 year 不保证位数）

### D3: 日期字符串解析——自实现严格解析，不用 `new Date(string)`

`new Date('2025-01-01')` 的行为跨浏览器有历史分歧（ES2015+ 定为 UTC 午夜，与"本地解析"语义冲突），故自实现：正则 `^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$` 提取字段，校验月份 1–12、日 1–31、时 0–23、分秒 0–59，然后用 `new Date(y, m-1, d, h, mi, s)`（本地构造器，无歧义），**并用 getFullYear/getMonth/getDate 回读校验**（拦截 `2025-02-30` 这类自动进位）。

### D4: 批量模式——就地替换正则

匹配模式：`/(?<![\d.])(\d{13}|\d{10})(?![\d.])/g`

- 13 位优先（写在 alternation 前），10 位兜底
- 前后负向断言排除：紧邻数字（更长数字串不误切）、紧邻小数点（避免 `3.1415926535` 这类小数被误识别）
- 值域二次校验：10 位秒级 ∈ [1e9, 1e10)（2001-09 ~ 2286-11），13 位毫秒 ∈ [1e12, 1e13)（2001-09 ~ 2286-11 的毫秒表示）——正则保证位数，值域天然满足；再经 D5 的 Date 范围校验兜底
- 替换为本地时区 `YYYY-MM-DD HH:mm:ss`；单条转换失败（Invalid Date）保留原文
- 负数时间戳不参与批量替换（日志中几乎不存在带负号的时间戳，且负号断言会误伤版本号等文本，控制规模）

### D5: 边界值

- 负数：直接 `new Date(n * 1000)` / `new Date(n)`，Date 原生支持 1970 前，正常转换
- 0：`1970-01-01 00:00:00 UTC`，正常转换
- 超范围：`Number.isSafeInteger` 校验输入；换算毫秒后用 `Number.isNaN(date.getTime())` 判定 Invalid Date（|ms| > 8.64e15），提示「超出可表示的日期范围（±2.7 亿年）」
- 输入含非数字字符（`abc`、`12.3`、`1e10` 科学计数法）一律判为「输入不是整数时间戳」——解析用正则 `^-?\d+$` 后再 `Number()`，不用 `parseInt`（容忍垃圾后缀）

### D6: 页面结构——三卡片纵向流

```
标题（--tool-time）
├── 当前时间戳卡片：秒读数 + 复制 / 毫秒读数 + 复制（等宽字体大读数，秒级跳动）
├── 双向转换区（两栏 wrap）：
│   ├── 左：时间戳 → 日期（输入框 + 转换按钮 + 识别精度标注 + 本地/UTC 双行结果 + 各行复制）
│   └── 右：日期 → 时间戳（输入框 + 转换按钮 + 秒/毫秒双结果 + 各行复制）
└── 批量模式卡片：多行 TextArea 输入 + 转换按钮 + 结果 TextArea(readonly) + 复制 + 替换计数
```

错误提示统一走 antd `message.error`（App 包裹），行内结果区仅显示有效结果；非法输入时保留上一次有效结果（与 ColorConverter 行为一致）。

### D7: 工具注册

`tools.tsx` 追加 `{ name: '时间戳转换', path: 'timestamp', element: <TimestampConverter /> }`。样式令牌：标题 `--tool-time`；卡片 `--bg-raised` + `--border`；读数 `--font-mono`；按钮/输入框继承既有 antd 暗色映射（琥珀系）。

## Risks / Trade-offs

- [2001 年前的毫秒时间戳被误判为秒] → 阈值方案的已知代价，design 已论证现实中不存在，接受
- [批量模式误识别]：10/13 位纯数字串可能是订单号等非时间数据 → 值域限定 2001–2286 年 + 小数点负向断言降低误伤；结果就地展示便于用户核对，接受
- [`Intl.DateTimeFormat` 的 formatToParts 在极端旧浏览器缺失] → 项目目标浏览器为现代 Chromium/Firefox，接受
- [UTC 偏移标注只精确到小时]：少数时区有 30/45 分钟偏移 → 偏移显示换算为 `UTC+H:mm` 形式（用 getTimezoneOffset 分钟值精确计算），不接受截断
- [stylelint 字母序/prettier 冲突] → 提交前跑 `pnpm lint` 与 lint-staged，--fix 整理

## Migration Plan

1. 新建 `TimestampConverter/utils.ts`：parseTimestamp（识别精度）、formatDateTime（本地/UTC）、parseDateTime、batchReplace
2. 新建 `TimestampConverter/index.tsx` + `index.module.less`
3. `tools.tsx` 注册
4. `pnpm build` + `pnpm lint`
5. `pnpm dev` + Playwright 实测（双向转换对照手算值、毫秒识别、批量、非法输入、负数/0/超范围），截图存 /tmp/lolf-review/timestamp.png
6. 单提交 `feat(tools): add timestamp converter tool`（含 openspec change 目录），无回滚压力

## Open Questions

- 无（秒/毫秒阈值 10^12、批量模式不支持负数，已在 spec 固化）
