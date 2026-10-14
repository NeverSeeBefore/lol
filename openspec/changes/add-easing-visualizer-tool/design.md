# Design

## Context

资产盘点（已核实）：

- `src/utils/tween.ts`：`tween` 对象含 45 个缓动函数 + `tweenDotObjDemo` 预计算采样点（每函数 101 点，two-decimal 精度），可直接画曲线不必实时计算
- `src/views/Test/components/TweenDemo/index.tsx`：已有 canvas 绘制管线，但 useEffect 无依赖数组、每次 render 重绘全部 canvas——新工具的绘制必须放入 useEffect 并正确管理依赖
- 工具注册机制：`src/views/Tools/tools.tsx` 数组，路由与子导航共用
- 布局范式：RegexTester 的「标题 + 内容区 + 状态栏」flex 结构可复制；antd `App` 包裹 + `App.useApp()` 取 message
- theme.less 工具专属色区块已有 5 个令牌；荧光绿 `#C5EB84`（82°，亮层 L≈72%）已为本工具预分配。校验间距：与琥珀 ≈31° 间距 51° ≥30°；与 `--tool-regex` 草绿 95°（暗层 L≈58%）跨层间距 13° ≥12° 且 ΔL≈14% ≥12%，合法
- canvas 内颜色经 `getComputedStyle(document.documentElement).getPropertyValue()` 读令牌（沿用 TweenDemo 读 `--text-primary` 的做法）

## Goals / Non-Goals

**Goals:**

- 45 条缓动曲线按族分组的 canvas 网格总览，点选切换详情
- 详情区：放大曲线图（含 y=0/y=1 参考线）+ rAF 实时动画预览（小球按选中缓动运动）
- 代码输出：经典族查表给出权威 cubic-bezier；其余曲线坐标下降拟合，误差过大或值域超 [0,1] 时只给 @keyframes 并明确提示
- 一键复制；`pnpm build` + `pnpm lint` 通过；Playwright 截图验收

**Non-Goals:**

- 不做自定义贝塞尔编辑器（拖控制点）、不做曲线对比叠加
- 不改 TweenDemo / tween.ts 的任何现有行为
- 不做动画时长/方向等参数调节（固定 1.2s 往返）

## Decisions

### D1: 数据源与分组——tweenDotObjDemo + 静态分组配置

网格与详情曲线均直接用 `tweenDotObjDemo` 的 101 个采样点绘制（two-decimal 精度对可视化足够）；动画预览与代码生成需要连续值，用 `tween` 函数实时计算。族分组为静态配置（utils.ts）：Quad/Cubic/Quart/Quint/Sine/Expo/Circ 各 3（In/Out/InOut）、Back 3、Elastic（elastic、spring）、Bounce（easeOutBounce、bounce、bouncePast）、Other（其余 14 个：swing×3、easeFrom×3、linear、sinusoidal、reverse、mirror、flicker、wobble、pulse、blink、none、full）。

### D2: cubic-bezier 输出——经典族查表 + 其余曲线坐标下降拟合

21 条经典族曲线（Quad…Circ × In/Out/InOut）采用公认拟合值查表（与 easings.net 一致，如 easeInOutQuad = cubic-bezier(0.45, 0, 0.55, 1)）——tween.ts 即标准 Penner 方程，查表值即权威答案，避免拟合算法局部极小值风险（原型验证：朴素交替最小二乘会收敛到错误不动点；坐标下降对 easeInQuad 也会落入次优解 err 0.016）。

其余曲线用坐标下降最小二乘拟合（初值 CSS `ease` (0.42, 0, 0.58, 1)，步长 0.4→0.005 递减，x1/x2 钳制 [0,1]，t 用 Newton 反解），最大误差 ≤0.03 才接受输出，否则走 keyframes 兜底。

### D3: 超界与不可拟合判定——值域检查 + 拟合误差双门槛

对每条曲线用 1001 点采样计算值域：`min < 0 || max > 1` → 判定「值域超出 [0,1]」（Back×3、elastic、spring、bouncePast、swing×3 等命中）；值域内但拟合误差 >0.03（bounce、easeOutBounce、wobble、pulse、blink、flicker、mirror、none、full 等）→ 判定「单个 cubic-bezier 无法表达」。两类都只输出 @keyframes，UI 提示语区分原因（前者「值域超出 [0,1]，cubic-bezier 无法表达」；后者「曲线含多次回弹/跳变，拟合误差过大」）。

### D4: @keyframes 生成

采样 0%/10%/…/100% 共 11 帧，`transform: translateX(N%)`（N = fn(t)×100，保留 1 位小数），附 `animation` 使用示例行。普通曲线的 cubic-bezier 块与 keyframes 块各自带复制按钮。

### D5: canvas 绘制生命周期——useEffect 正确依赖

- 网格：45 个小 canvas（88×88）在 `useEffect(..., [])` 挂载后绘制一次（数据与尺寸均静态），选中态用 CSS border 表达，不触发重绘
- 详情大 canvas：`useEffect(..., [selected])`，切换时清空重绘（坐标轴、y=0/y=1 虚线参考线、曲线按值域自适应缩放）
- 动画预览：`useEffect(..., [selected])` 内起 rAF 循环，cleanup `cancelAnimationFrame`；小球位置用 `transform: translateX` 直接写 DOM（ref），不经 React state，避免每帧重渲染
- 预览位移映射：按该函数值域 [min,max] 归一化到轨道宽度，超界曲线（elastic 峰值 1.47）也能完整呈现过冲

### D6: 颜色读取

绘制所需颜色（`--tool-easing` 曲线、`--text-tertiary` 坐标轴、`--border` 网格线）在 effect 内经 getComputedStyle 一次性读取。页面标题、族名、选中态等 DOM 颜色直接用 less 里的 `var(--token)`。

## Risks / Trade-offs

- [Back/Elastic/Bounce 类曲线 cubic-bezier 无法表达（已知技术边界）] → 按 D3 双门槛判定，一律给 @keyframes 兜底并在 UI 明确提示原因；CSS 虽允许 y 值超界，但按任务约定对此类曲线不输出 cubic-bezier，提示文案写清
- [坐标下降拟合陷入局部极小值] → 经典 21 条查表规避；非查表曲线有误差门槛兜底，误差大即降级 keyframes，不会输出误导性代码
- [flicker 函数含随机性，实时动画与采样曲线不一致] → 采样点是一次性生成的快照，动画每次运行略有抖动，符合该函数语义，不做特殊处理
- [45 个 canvas 同时绘制性能] → 88×88 小画布、101 点折线，一次性绘制，实测开销可忽略
- [任务书称 36 个函数，实际 tween.ts 有 45 个] → 按数据全量展示 45 条，proposal/spec 均已按 45 编写，汇报中说明

## Migration Plan

1. theme.less 登记 `--tool-easing`；ui-spec.md §2.4 表格加行
2. 新建 `EasingVisualizer/utils.ts`（分组、查表、拟合、值域、代码生成）
3. 新建 `EasingVisualizer/index.tsx` + `index.module.less`
4. `tools.tsx` 注册 `{ name: '缓动曲线', path: 'easing' }`
5. `pnpm build` + `pnpm lint`
6. `pnpm dev` + Playwright 验收（网格渲染、点选切换、动画运行、easeInOutQuad 输出 ≈ cubic-bezier(0.45,0,0.55,1)、easeOutBack 仅 keyframes + 提示、其他工具页回归），截图 /tmp/lolf-review/easing.png
7. 单提交 `feat(tools): add easing visualizer tool`，无回滚压力

## Open Questions

- 无
