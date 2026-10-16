# 像素运行时架构优化实施计划

> **执行提示：**按任务逐项实施和验证；使用 `superpowers:executing-plans`。清单项用于记录进度。

**目标：**抽出可复用的像素核心，让现有 React 组件共用播放和渲染路径，同时保持公开接口兼容。

**架构：**场景校验、时间采样、合成、颜色计算及布局作为纯 TypeScript 模块放在 `src/lib/pixel`。`PixelCanvas` 管理 Canvas 生命周期，`PixelBackgroundWall` 把单流和多流交给同一渲染入口。实验室媒体转换器仍留在页面侧。

**技术栈：**TypeScript 5.9、React 19、Canvas 2D、Node 测试运行器、Vite 8。

**设计稿：**`docs/superpowers/specs/2026-10-16-pixel-runtime-architecture-design.md`

## 全局约束

- 保持 v1 场景限制、现有组件属性与硬覆盖优先级。
- 不增加依赖，不发布、不提交、不推送。
- 改动限于像素功能、相关测试和文档。
- 项目文档一般用中文编写。

## 评审重点

- 空流数组应明确报错。
- 顶层像素 alpha 为零时露出下层；alpha 非零时覆盖下层，不进行合成混色。
- 帧时长和分辨率不同的流应独立采样，并按最近邻映射。
- 过渡中再次变色，应从当前显示色开始新过渡。
- 隐藏、离屏、零尺寸和减少动态效果时不能留下持续运行的 RAF。

---

### 任务 1：抽取纯像素核心

**文件：**新建 `src/lib/pixel/{scene,timeline,composite,color,layout,index}.ts`；修改 `scripts/verify-lab.mjs`。

**接口：**保持 `validatePixelScene`、`getPixelLayout`、`interpolatePixelColor`、`cubicBezierAt`、`getCellTransitionProgress`、`getStreamFrameIndex`、`compositePixelStreamsAt` 的名称和行为。

- [x] 添加直接导入核心模块的测试，覆盖现有纯函数行为。
- [x] 运行 `pnpm test:lab`，确认新测试因核心模块尚未存在而失败。
- [x] 迁移纯类型和函数，让测试通过。
- [x] 保留组件原有命名导出；运行 `pnpm test:lab` 和 `pnpm build`。

### 任务 2：统一播放与过渡

**文件：**修改 `src/components/PixelCanvas/index.tsx`、`src/components/PixelBackgroundWall/index.tsx`；更新引用后移除旧的 `PixelStreamCanvas.tsx` 和 `composite.ts`。

**接口：**为 `PixelCanvas` 增加可选的 `streams?: PixelScene[]`，保留原有 `scene` 调用方式。背景墙将单流和多流都交给同一渲染器。

- [x] 为独立流时钟、合成网格及过渡中再次变色补充失败测试。
- [x] 实现一套 Canvas 时钟与渲染路径，并把过渡计算抽为可测试的纯函数。
- [x] 运行 `pnpm test:lab`、`pnpm build`、`pnpm lint`，修复回归。

### 任务 3：文档和页面验证

**文件：**修改 `docs/pixel-scene-format.md`；检查 `src/views/Lab/PixelStudioPage.tsx`、`src/views/Lab/PixelWallPage.tsx`。

- [x] 写明核心导入方式、多流合成规则和过渡配置。
- [x] 在浏览器中检查单流、双流、0/1000ms 过渡及尺寸变化；自定义曲线已由纯函数测试覆盖。
- [ ] 浏览器手动检查系统“减少动态效果”设置；当前浏览器未提供媒体偏好模拟入口，已由代码 review 检查该分支。
- [x] 对照设计稿做最终代码 review，处理重要问题。
