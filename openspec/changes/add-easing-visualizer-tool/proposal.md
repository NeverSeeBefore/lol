# Proposal

## Why

工具集已有 JSON 格式化、颜色转换、时间戳转换、Base64/URL、正则测试五个工具。项目 `src/utils/tween.ts` 内置了 45 个缓动函数及预计算采样点（`tweenDotObjDemo`，每函数 101 点），目前仅在 Test 页的 TweenDemo 做简单演示，价值未被发挥。前端开发在写 CSS transition/animation 时常需要对照缓动曲线选择函数并获取可用代码，做一个可视化工具能盘活现有资产且日常高频可用。

## What Changes

- 新增工具页 `src/views/Tools/EasingVisualizer/`（index.tsx + index.module.less + utils.ts）：
  - 曲线网格总览：45 条缓动曲线（tweenDotObjDemo 全量）按族（Quad/Cubic/Quart/Quint/Sine/Expo/Circ/Back/Elastic/Bounce/Other）分组，canvas 绘制（数据直接复用 `tweenDotObjDemo` 采样点），绘制放入 useEffect 正确管理依赖
  - 点选某条曲线 → 详情区：放大曲线图 + 实时动画预览（小球按该缓动往返运动，rAF 循环，组件卸载时正确取消）
  - 代码输出：生成 CSS `cubic-bezier()` 最小二乘拟合值 + `@keyframes` 备选；Back/Elastic/Bounce 等值域超出 [0,1] 的曲线 cubic-bezier 无法表达，这类曲线只给 keyframes 并在 UI 明确提示原因
  - 一键复制代码（clipboard + 成功反馈）
- `src/views/Tools/tools.tsx` 注册 `{ name: '缓动曲线', path: 'easing' }`
- theme.less 工具专属色区块登记 `--tool-easing: #c5eb84;`（荧光绿 82°，亮层，已预分配），并在 docs/design/ui-spec.md §2.4 表格同步加一行

## Capabilities

### New Capabilities

- `easing-visualizer`: 缓动函数可视化工具能力——45 条缓动曲线（tweenDotObjDemo 全量）按族分组的 canvas 网格总览、点选详情（放大曲线 + rAF 实时动画预览）、CSS cubic-bezier 拟合与 @keyframes 代码输出（超界曲线仅 keyframes 并明确提示）、一键复制

### Modified Capabilities

（无）

## Impact

- **代码**：新增 `src/views/Tools/EasingVisualizer/`（index.tsx、index.module.less、utils.ts）、`src/views/Tools/tools.tsx`、`src/static/styles/theme.less`（登记令牌）、`docs/design/ui-spec.md`（§2.4 表格加行）
- **依赖**：无新增依赖（canvas 2d + rAF + clipboard 原生 API）
- **兼容性**：纯新增页面，不影响现有工具；`pnpm build` 与 `pnpm lint` 必须通过
- **规范**：遵守 docs/design/ui-spec.md，颜色一律用 theme.less 令牌（canvas 内颜色经 getComputedStyle 读令牌），不新增硬编码色值
