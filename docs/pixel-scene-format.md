# 像素场景格式与画布组件

`PixelCanvas` 是与页面无关的 Canvas 2D 组件。调用方提供 `PixelScene`，组件负责按帧播放、适配容器尺寸和处理指针悬停。像素工作室负责把本地图片或视频转换成同一种数据格式。

像素运行时的纯逻辑位于 `src/lib/pixel/`：`scene.ts` 校验数据，`timeline.ts` 按时间采样帧，`composite.ts` 合成多路画面，`color.ts` 计算逐像素过渡，`layout.ts` 计算网格尺寸，`player.ts` 保存播放和过渡状态。它们不依赖 React 或 DOM。`PixelCanvas` 负责 Canvas 绘制、指针交互及可见性监听，`PixelBackgroundWall` 在其上添加背景墙样式与内容层。旧的 `PixelCanvas` 命名导出仍可使用；新代码宜从 `Src/lib/pixel` 导入纯类型和函数。

## 最小示例

```tsx
import PixelCanvas, { type PixelScene } from 'Components/PixelCanvas';

const scene: PixelScene = {
  version: 1,
  width: 8,
  height: 8,
  palette: ['#00000000', '#ffb75c'],
  frames: [
    {
      durationMs: 500,
      cells: Array.from({ length: 64 }, (_, index) => (index % 9 === 0 ? 1 : 0)),
    },
  ],
};

<PixelCanvas scene={scene} interactive gap={0.08} ariaLabel="八乘八像素图案" />;
```

多路画面可传给 `<PixelCanvas streams={[baseScene, overlayScene]} cellTransitionMs={180} />`，背景墙也接受相同的 `streams`。每路按自己的帧时长独立循环；数组后面的流优先。顶层像素 alpha 为零时透出下层，非零时直接覆盖，不做图层色彩融合。不同分辨率按第一路的网格做最近邻映射。`cellTransitionMs` 控制合成后每个格子的颜色过渡，设为 `0` 可得到即时切换；`cellEasing` 接受 `[x1, y1, x2, y2]` 贝塞尔控制点。图层合成不混色，但时间过渡会插值前后颜色及透明度。

## 数据约束

| 字段               | 约束                        | 作用                                    |
| ------------------ | --------------------------- | --------------------------------------- |
| `version`          | 固定为 `1`                  | 为后续格式演进保留空间                  |
| `width` / `height` | 各为 8–96 的整数            | 决定网格分辨率                          |
| `palette`          | 1–256 个十六进制 CSS 颜色   | 颜色表；透明色可使用 `#00000000`        |
| `frames`           | 1–72 帧                     | 单帧就是静态画面，多帧循环播放          |
| `durationMs`       | 每帧大于 0，至多 60000 毫秒 | 控制各帧独立停留时间                    |
| `cells`            | 长度等于 `width × height`   | 每个值是 `palette` 的索引，按行优先排列 |

从外部 JSON 读取时，先调用 `validatePixelScene(value)`。它会检查尺寸、帧数、颜色与索引，失败时抛出带原因的错误。

## 渲染方式

画布使用一个 `<canvas>`，而不是为每个像素创建 DOM 元素。`ResizeObserver` 跟随容器尺寸，绘制时根据设备像素比设置实际画布大小。动画由 `requestAnimationFrame` 驱动，按时间戳计算当前帧，避免定时器逐周期累积误差。画布离开视口、标签页隐藏或容器尺寸为零时会暂停动画，恢复可见后继续播放。静态场景在悬停动画结束后不再请求新帧。系统启用“减少动态效果”时，画面固定在第一帧。

指针位置会换算成网格坐标。悬停动画只记录正在变化的格子，绘制时让目标格子以 150 毫秒平滑缩放。`gap` 是格内留白比例，取值建议为 0–0.45。

## 媒体转换

像素工作室在浏览器本地读取文件：图片生成一帧；视频最多截取 6 秒、每秒 12 帧。媒体先按原始比例完整放入目标网格，再采样每格 RGBA 值，转换为不超过 256 色的调色板和索引数组。RGB 分别保留 3、3、2 位，透明度量化为 0、85、170、255 四档；超出调色板容量的颜色会映射到最接近的已保留 RGBA 颜色。导出的 JSON 可以再次导入；原始图片或视频文件不会上传。

生命沙盘也可导出同一格式：最近最多 72 代作为逐帧动画，帧间隔 150 毫秒。下载后在像素工作室选择“导入 JSON”即可播放。这个例子展示了 `PixelScene` 可以来自媒体，也可以由其他算法直接生成。

短视频可能因浏览器解码器或格式支持而无法抽帧，页面会给出错误提示。视频转换完成前可取消，临时对象 URL 会在结束或取消时释放。
