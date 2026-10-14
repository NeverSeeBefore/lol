# Tasks

## 1. 令牌登记与文档同步

- [x] 1.1 theme.less 工具专属色区块追加 `--tool-easing: #c5eb84; // 缓动曲线 · 荧光绿 82°（亮层，速度/运动的活力）`
- [x] 1.2 docs/design/ui-spec.md §2.4 表格追加 `| --tool-easing | #C5EB84 | 82° | 缓动曲线 · 荧光绿 |`

## 2. utils.ts 纯函数层

- [x] 2.1 `EASING_GROUPS` 静态分组配置（Quad/Cubic/Quart/Quint/Sine/Expo/Circ/Back/Elastic/Bounce/Other，覆盖 tweenDotObjDemo 全部 45 条）
- [x] 2.2 经典 21 条 cubic-bezier 查表（与 easings.net 一致）
- [x] 2.3 坐标下降最小二乘拟合（初值 (0.42,0,0.58,1)，Newton 反解 t，x 钳制 [0,1]）+ 值域分析（min/max）
- [x] 2.4 `getEasingCss(name)`：查表命中 → cubic-bezier；否则拟合误差 ≤0.03 且值域在 [0,1] → cubic-bezier；否则仅 keyframes + 提示原因
- [x] 2.5 `buildKeyframes(name)`：11 帧 translateX 百分比 + animation 使用示例

## 3. 工具页面

- [x] 3.1 新建 `src/views/Tools/EasingVisualizer/index.tsx` + `index.module.less`：标题（--tool-easing）+ 按族网格 + 详情区（放大 canvas + 动画预览 + 代码块）
- [x] 3.2 网格 canvas 挂载后 useEffect([]) 绘制一次，点选用 state 驱动选中态（CSS border），不重绘
- [x] 3.3 详情 canvas useEffect([selected]) 重绘：坐标轴、y=0/y=1 虚线参考线、按值域自适应缩放；颜色经 getComputedStyle 读令牌
- [x] 3.4 动画预览 useEffect([selected]) rAF 循环，cleanup cancelAnimationFrame；小球 transform 直写 DOM ref，值域归一化映射到轨道
- [x] 3.5 代码区：cubic-bezier 块（或超界/误差提示）+ keyframes 块，各带复制按钮（clipboard + message.success）
- [x] 3.6 暗色规范：标题/选中态用 `--tool-easing`，其余引用 theme.less 令牌，无新增硬编码色值

## 4. 注册与验证

- [x] 4.1 `tools.tsx` 注册 `{ name: '缓动曲线', path: 'easing' }`
- [x] 4.2 `pnpm build` 通过
- [x] 4.3 `pnpm lint` 无 error、无新增 warning
- [x] 4.4 Playwright 实测：网格渲染 45 条、点选切换详情、动画预览运行、easeInOutQuad 输出 ≈ cubic-bezier(0.45,0,0.55,1)、easeOutBack 仅 keyframes 且有提示、其他工具页回归 1 个
- [x] 4.5 截图 `/tmp/lolf-review/easing.png`，kill dev server
- [x] 4.6 git 提交 `feat(tools): add easing visualizer tool`（含 openspec change 目录）

## Workflow follow-up

- 用户确认验收后运行 openspec archive 归档本变更
