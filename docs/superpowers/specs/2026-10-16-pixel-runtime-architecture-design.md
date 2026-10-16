# 像素运行时架构优化设计

## 目标与范围

把现有像素功能整理成仓库内可复用的模块，让像素工作室、背景墙及后续调用方共享场景格式、时间采样、合成与渲染规则。保持现有页面、`PixelCanvas`、`PixelBackgroundWall` 的使用方式；多流过渡生效是明确的视觉行为改进，`cellTransitionMs = 0` 可恢复原来的硬切换。暂不创建 npm 包、不发布、不增加运行时依赖。

## 现状与问题

- `PixelCanvas/index.tsx` 同时负责数据校验、颜色插值、播放时钟、Canvas 绘制、悬停和 React 生命周期。
- `PixelStreamCanvas.tsx` 有另一套播放与 Canvas 生命周期；多流合成在 `PixelBackgroundWall/composite.ts`。
- 核心逻辑需要从 React 组件路径导入。现有 `scripts/verify-lab.mjs` 也必须从组件文件中抽取纯函数才能验证。
- 单流支持逐像素过渡与自定义贝塞尔曲线；多流只在帧切换时硬合成，因而传入背景墙的过渡参数对多流无效。这是现有行为差异，架构整理时需要明确处理。

## 方案

采用仓库内模块 `src/lib/pixel/`，以纯 TypeScript 为核心，不引入 monorepo 或包构建。

1. `scene.ts`：`PixelFrame`、`PixelScene` 和 `validatePixelScene`。维持 v1 的尺寸、调色板、帧数与时长限制及现有错误语义。
2. `timeline.ts`：按每条流自己的帧时长和累计时间采样当前帧。时间由调用方提供；纯函数不持有 `requestAnimationFrame`。
3. `composite.ts`：多流合成。保持数组后项优先、非零 alpha 视为不透明、第一条流决定输出分辨率、最近邻采样、无色彩融合。空输入报错。
4. `color.ts`：十六进制颜色解析、插值及贝塞尔进度。纯函数保留当前逐像素过渡计算结果。
5. `layout.ts`：像素尺寸、正方形裁切偏移计算。
6. `player.ts`：接收调用方传入的有效播放时间，保存当前合成颜色与逐像素过渡状态；不直接调用浏览器计时器或 Canvas。
7. React 组件负责 Canvas、ResizeObserver、IntersectionObserver、可见性、减少动态效果与指针事件。共用一套 Canvas 播放生命周期和绘制入口；背景墙仍提供 `scene` / `streams` 接口，单流与多流走同一入口。

浏览器图片/视频转换工具保留在实验室页面侧，因为它依赖 DOM 媒体解码与页面文件导入流程。`PixelCanvas` 保留现有命名导出 `PixelFrame`、`PixelScene`、`PixelBezier`、`validatePixelScene`、`getPixelLayout`、`interpolatePixelColor`、`cubicBezierAt`、`getCellTransitionProgress` 作为兼容入口；新代码直接从 `src/lib/pixel` 导入纯类型和函数。

## 行为约定

- 单流的逐像素过渡、交互悬停、留白和正方形像素选项保持不变。
- 多流每条流独立循环；合成后的格子颜色发生变化时，使用与单流相同的逐像素过渡和贝塞尔曲线。`cellTransitionMs = 0` 时立即切换；过渡期间再次变色，从当前显示色继续。多流 stagger 使用第一条流当前帧的时长作为统一参考，避免合成像素没有唯一的帧时长。
- 多流合成不做 alpha 混合；顶层颜色只要 alpha 非零就完全覆盖下层。时间过渡仍对前后显示色做 RGBA 插值，透明像素变化期间可能出现半透明。场景尺寸不同仍以第一条流为输出网格。
- 标签页隐藏、画布离开视口或尺寸为零时暂停时钟；恢复时从暂停位置继续，包括帧内进度。单流此前会从帧起点恢复，此处统一为累计有效时间。减少动态效果时固定首帧。
- 组件卸载时释放 RAF、观察器和事件监听；静态场景且无悬停或过渡时停止 RAF。

## 验证与评审标准

- 纯核心无 React、DOM、Canvas 依赖，可直接在 Node 测试中导入；测试覆盖场景边界、不同流时钟、透明覆盖、不同分辨率、逐像素过渡和中途再次变色。
- `pnpm test:lab`、`pnpm build`、`pnpm lint` 通过；原有页面导入不失效。
- 在像素工作室与背景墙页面检查：单流、双流、0/1000ms 过渡、自定义曲线、悬停、窗口尺寸变化和减少动态效果。
- Review 重点看行为兼容、播放时钟是否累积误差、隐藏/恢复时的状态、透明色与过渡衔接、每帧计算量和资源清理。

## 明确不做

不增加图层混合模式、可编程特效、编辑器 API、手动播放控制、WebGL/OffscreenCanvas 路径、打包发布能力。这些需求出现真实调用方后再设计。
