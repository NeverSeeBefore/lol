# lol-f

个人前端项目：博客 + 前端工具集（JSON 格式化、格式转换器等，持续添加中）。

## 实验室

`/lab/kaomoji` 展示颜文字滚轮，`/lab/kaomoji-library` 可按心情浏览并复制精选颜文字，`/lab/loading` 展示从 Test 页复用的 Canvas Loading。`/lab` 会重定向到第一个作品。实验室菜单由 `src/views/Lab/experiments.ts` 统一配置。颜文字动画封装在 `src/components/KaomojiSlot`，精选颜文字与组合零件库在同目录的 `library.ts`。

```tsx
import KaomojiSlot from 'Components/KaomojiSlot';

// 作为 loading 动画使用；加载结束时卸载组件即可自动清理计时器
{
  loading && <KaomojiSlot size="small" intervalMs={2400} />;
}
```

Canvas Loading 同样可直接使用 `<Loading />`。动画按实际经过时间计算进度，卸载组件时会取消动画帧。

`/lab/pixel-studio` 是像素工坊：可以调整网格分辨率、预览逐格交互效果，并把本地图片或短视频转换成可导入的 JSON 元数据。`/lab/cellular` 是可暂停、绘制和自定义规则的生命沙盘，支持预设图案、种群趋势、周期识别，并能将演化导出为像素工坊可播放的 JSON 动画。实现细节见[像素场景格式](docs/pixel-scene-format.md)和[生命沙盘规则](docs/cellular-lab.md)。

`/lab/pixel-wall` 展示 96 × 52 正方形像素的循环背景墙。`PixelBackgroundWall` 接受任意 `PixelScene`、内容子节点、`shade` 遮罩强度、`cellTransitionMs` 逐像素颜色过渡时长（设为 0 可关闭）和 `cellEasing` 贝塞尔曲线控制点；示例中的夜间城市场景由 `src/views/Lab/pixel-wall-scene.ts` 生成。

背景墙也接受 `streams={[sceneA, sceneB]}` 进行多流合成。每条流按自己的帧时长循环，后面的流优先；透明像素露出下层，非透明像素直接覆盖（包括半透明输入，不做图层色彩融合）。不同分辨率按第一条流的网格最近邻采样。单流和多流都支持逐像素颜色过渡，`cellTransitionMs={0}` 可立即切换。

像素组件可以独立使用：

```tsx
import PixelCanvas from 'Components/PixelCanvas';
import type { PixelScene } from 'Components/PixelCanvas';

const scene: PixelScene = {
  version: 1,
  width: 8,
  height: 8,
  palette: ['#00000000', '#ffb75c'],
  frames: [{ durationMs: 1000, cells: Array.from({ length: 64 }, (_, index) => (index % 9 === 0 ? 1 : 0)) }],
};

<PixelCanvas scene={scene} interactive ariaLabel="八乘八像素示例" />;
```

## 技术栈

- Vite 8 + React 19 + TypeScript 5
- antd 6 + @ant-design/icons
- react-router 7 + Redux Toolkit 2 + react-redux 9
- less（CSS Modules）

## 常用命令

```bash
pnpm install     # 安装依赖
pnpm dev         # 启动开发服务器
pnpm build       # 类型检查 + 生产构建
pnpm preview     # 预览构建产物
pnpm lint        # eslint + stylelint
pnpm test:lab    # 像素场景与生命沙盘的纯函数回归测试
pnpm changelog   # 生成 CHANGELOG
```

## 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)，由 husky + commitlint 强制校验：

- `feat` 新功能 / `fix` 修复 bug / `docs` 文档 / `style` 代码格式
- `refactor` 重构 / `perf` 性能优化 / `test` 测试 / `build` 构建工具
- `ci` 持续集成 / `chore` 辅助工具变动 / `revert` 撤销 / `anno` 注释

提交前 lint-staged 会自动执行 eslint、stylelint 和 prettier。
