import { useEffect, useRef, useState } from 'react';
import PixelCanvas from 'Components/PixelCanvas';
import { validatePixelScene, type PixelScene } from 'Src/lib/pixel';
import { imageToPixelScene, videoToPixelScene } from './pixel-converter';
import styles from './pixel-studio.module.less';

type ExampleMode = 'static' | 'animated';

const createExample = (width = 20, height = 20, mode: ExampleMode = 'animated'): PixelScene => {
  const palette = ['#00000000', '#2c2551', '#65539b', '#b788c7', '#f8cad9', '#fff2df', '#f7bb78'];
  const cells = Array.from({ length: width * height }, (_, index) => {
    const x = Math.min(19, Math.floor((((index % width) + 0.5) * 20) / width));
    const y = Math.min(19, Math.floor(((Math.floor(index / width) + 0.5) * 20) / height));
    const dx = x - 9.5;
    const dy = y - 9.5;
    const radial = Math.sqrt(dx * dx + dy * dy);
    if (radial > 8.5) return 0;
    if (radial > 7.3) return 1;
    if (y < 6 && x > 6 && x < 13) return 4;
    if (y >= 6 && y < 9 && (x === 6 || x === 13)) return 4;
    if (y === 9 && x >= 7 && x <= 12) return 4;
    if (y === 10 && x >= 8 && x <= 11) return 4;
    if (y === 11 && (x === 9 || x === 10)) return 4;
    if (y > 12 && Math.abs(dx) < 1.5) return 5;
    if (y > 12 && y < 15 && Math.abs(dx) < 4) return 5;
    if (x === 5 && y === 5) return 6;
    if (x === 15 && y === 12) return 6;
    return radial < 5 ? 3 : 2;
  });
  if (mode === 'static') return { version: 1, width, height, palette, frames: [{ durationMs: 1000, cells }] };

  const frames = Array.from({ length: 8 }, (_, phase) => {
    const angle = (phase / 8) * Math.PI * 2 - Math.PI / 2;
    const starX = 9.5 + 6.5 * Math.cos(angle);
    const starY = 9.5 + 6.5 * Math.sin(angle);
    const animatedCells = cells.map((color, index) => {
      const x = Math.min(19, Math.floor((((index % width) + 0.5) * 20) / width));
      const y = Math.min(19, Math.floor(((Math.floor(index / width) + 0.5) * 20) / height));
      const distance = Math.hypot(x - starX, y - starY);
      if (distance < 1.2) return 5;
      if (distance < 2.2) return 6;
      return phase % 2 === 0 && color === 4 ? 5 : color;
    });
    return { durationMs: 150, cells: animatedCells };
  });
  return { version: 1, width, height, palette, frames };
};

const EXAMPLE = createExample();
const clampGrid = (value: number) => (Number.isFinite(value) ? Math.min(96, Math.max(8, Math.round(value))) : 20);

export default function PixelStudioPage() {
  const [scene, setScene] = useState<PixelScene>(EXAMPLE);
  const [sceneLabel, setSceneLabel] = useState('内置动画：像素花与环绕的星光');
  const [exampleMode, setExampleMode] = useState<ExampleMode | null>('animated');
  const [gridWidth, setGridWidth] = useState(20);
  const [gridHeight, setGridHeight] = useState(20);
  const [gap, setGap] = useState(0.08);
  const [interactive, setInteractive] = useState(true);
  const [fps, setFps] = useState(8);
  const [seconds, setSeconds] = useState(4);
  const [status, setStatus] = useState('悬停在像素上，看看它们如何回应指针。');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const importSequence = useRef(0);
  const importRef = useRef<HTMLInputElement>(null);
  const mediaRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => controller.current?.abort(), []);

  const cancel = () => {
    controller.current?.abort();
    controller.current = null;
    setBusy(false);
    setStatus('转换已取消。');
  };

  const showExample = (mode: ExampleMode) => {
    if (controller.current) cancel();
    importSequence.current += 1;
    const width = clampGrid(gridWidth);
    const height = clampGrid(gridHeight);
    setGridWidth(width);
    setGridHeight(height);
    setExampleMode(mode);
    setScene(createExample(width, height, mode));
    setSceneLabel(mode === 'animated' ? '内置动画：像素花与环绕的星光' : '内置静态示例：粉色像素花与星点');
    setError('');
    setStatus(`已显示 ${width} × ${height} 的${mode === 'animated' ? '动态星轨' : '静态花朵'}示例。`);
  };

  const convert = async (file: File) => {
    importSequence.current += 1;
    controller.current?.abort();
    const nextController = new AbortController();
    controller.current = nextController;
    setError('');
    setBusy(true);
    setStatus('正在读取本地文件…');
    try {
      const width = clampGrid(gridWidth);
      const height = clampGrid(gridHeight);
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) throw new Error('请选择图片或视频文件。');
      const result = isImage
        ? await imageToPixelScene(file, width, height, nextController.signal)
        : await videoToPixelScene(file, width, height, fps, seconds, nextController.signal, (done, total) => {
            if (controller.current === nextController && !nextController.signal.aborted) {
              setStatus(`正在抽样视频：${done} / ${total} 帧`);
            }
          });
      if (nextController.signal.aborted || controller.current !== nextController) return;
      setScene(result);
      setExampleMode(null);
      setSceneLabel(`${isImage ? '图片' : '视频'}：${file.name}`);
      setStatus(`已转换 ${file.name}：${result.frames.length} 帧，${result.palette.length} 色。`);
    } catch (cause) {
      if (nextController.signal.aborted || controller.current !== nextController) return;
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      setError(cause instanceof Error ? cause.message : '转换失败，请选择其他文件重试。');
    } finally {
      if (controller.current === nextController) {
        controller.current = null;
        setBusy(false);
      }
    }
  };

  const importJson = async (file: File) => {
    if (controller.current) cancel();
    const sequence = ++importSequence.current;
    setError('');
    try {
      if (file.size > 16_000_000) throw new Error('JSON 超过 16 MB，请缩小网格或减少帧数。');
      const parsed: unknown = JSON.parse(await file.text());
      if (sequence !== importSequence.current) return;
      const imported = validatePixelScene(parsed);
      setScene(imported);
      setExampleMode(null);
      setSceneLabel(`导入的场景：${file.name}`);
      setGridWidth(imported.width);
      setGridHeight(imported.height);
      setStatus(`已导入 ${imported.frames.length} 帧，${imported.palette.length} 色。`);
    } catch (cause) {
      if (sequence !== importSequence.current) return;
      setError(cause instanceof Error ? `导入失败：${cause.message}` : '导入失败：文件不是有效的像素场景 JSON。');
    }
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(scene)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'pixel-scene.json';
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setStatus('像素场景 JSON 已下载。');
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.overline}>像素工作室</p>
            <h1>把画面，缩成一格一格。</h1>
            <p className={styles.intro}>
              试试内置图案，或将自己的图片与短视频变成可交互的像素动画。文件只在浏览器中处理。
            </p>
          </div>
          <div className={styles.stats} aria-label="当前像素场景信息">
            <strong>
              {scene.width} × {scene.height}
            </strong>
            <span>
              {scene.frames.length} 帧 / {scene.palette.length} 色
            </span>
          </div>
        </header>

        <div className={styles.workspace}>
          <section className={styles.preview} aria-label="像素预览">
            <div className={styles['preview-head']}>
              <span className={styles['live-dot']} /> 实时预览{' '}
              <span className={styles['preview-hint']}>移动指针，触碰画面</span>
            </div>
            <div className={styles['canvas-wrap']}>
              <PixelCanvas
                scene={scene}
                interactive={interactive}
                gap={gap}
                className={styles.canvas}
                ariaLabel={`${sceneLabel}；${scene.width} 乘 ${scene.height} 像素，${scene.frames.length} 帧`}
              />
            </div>
            <div className={styles['preview-foot']}>
              <span>{scene.frames.length > 1 ? '动画循环播放' : '静态画面'}</span>
              <span>Canvas 2D</span>
            </div>
          </section>

          <aside className={styles.panel} aria-label="像素工作室控制项">
            <section className={styles['control-section']}>
              <h2>画布设置</h2>
              <p>分辨率会用于下一次媒体转换；重建示例可立即预览新尺寸。</p>
              <div className={styles['two-cols']}>
                <label>
                  横向格数
                  <input
                    type="number"
                    min="8"
                    max="96"
                    value={gridWidth}
                    onChange={(event) => setGridWidth(Number(event.target.value))}
                    onBlur={() => setGridWidth(clampGrid(gridWidth))}
                  />
                </label>
                <label>
                  纵向格数
                  <input
                    type="number"
                    min="8"
                    max="96"
                    value={gridHeight}
                    onChange={(event) => setGridHeight(Number(event.target.value))}
                    onBlur={() => setGridHeight(clampGrid(gridHeight))}
                  />
                </label>
              </div>
              <label className={styles['slider-label']}>
                像素间距 <strong>{Math.round(gap * 100)}%</strong>
                <input
                  type="range"
                  min="0"
                  max="0.6"
                  step="0.02"
                  value={gap}
                  onChange={(event) => setGap(Number(event.target.value))}
                />
              </label>
              <div className={styles['example-choices']} role="group" aria-label="内置示例">
                <button
                  type="button"
                  className={exampleMode === 'static' ? styles['example-active'] : styles['example-button']}
                  aria-pressed={exampleMode === 'static'}
                  onClick={() => showExample('static')}
                >
                  静态花朵
                </button>
                <button
                  type="button"
                  className={exampleMode === 'animated' ? styles['example-active'] : styles['example-button']}
                  aria-pressed={exampleMode === 'animated'}
                  onClick={() => showExample('animated')}
                >
                  动态星轨
                </button>
              </div>
              <button
                type="button"
                className={styles['reset-button']}
                onClick={() => showExample(exampleMode ?? 'animated')}
              >
                按当前分辨率重建示例
              </button>
              <label className={styles['check-label']}>
                <input
                  type="checkbox"
                  checked={interactive}
                  onChange={(event) => setInteractive(event.target.checked)}
                />{' '}
                指针靠近时放大像素
              </label>
            </section>

            <section className={styles['control-section']}>
              <h2>从文件生成</h2>
              <p>
                图片转为单帧；视频最多读取 6 秒、12 帧/秒。半透明保留为约 1/3、2/3 两档，共用最多 256 色。文件不会上传。
              </p>
              <div className={styles['two-cols']}>
                <label>
                  视频帧率
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={fps}
                    onChange={(event) => setFps(Math.min(12, Math.max(1, Number(event.target.value) || 1)))}
                  />
                </label>
                <label>
                  视频秒数
                  <input
                    type="number"
                    min="0.1"
                    max="6"
                    step="0.1"
                    value={seconds}
                    onChange={(event) => setSeconds(Math.min(6, Math.max(0.1, Number(event.target.value) || 0.1)))}
                  />
                </label>
              </div>
              <input
                ref={mediaRef}
                type="file"
                accept="image/*,video/*"
                className={styles['hidden-input']}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void convert(file);
                  event.target.value = '';
                }}
              />
              <button
                type="button"
                className={styles['primary-button']}
                disabled={busy}
                onClick={() => mediaRef.current?.click()}
              >
                选择图片或视频
              </button>
              {busy && (
                <button type="button" className={styles['text-button']} onClick={cancel}>
                  取消转换
                </button>
              )}
            </section>

            <section className={styles['control-section']}>
              <h2>场景数据</h2>
              <p>导出完整的版本化 JSON，稍后可重新导入。</p>
              <div className={styles['button-row']}>
                <button type="button" className={styles['secondary-button']} onClick={downloadJson}>
                  导出 JSON
                </button>
                <button type="button" className={styles['secondary-button']} onClick={() => importRef.current?.click()}>
                  导入 JSON
                </button>
              </div>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                className={styles['hidden-input']}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importJson(file);
                  event.target.value = '';
                }}
              />
            </section>
          </aside>
        </div>
        <div className={error ? styles.error : styles.status} role="status" aria-live="polite">
          {error || status}
        </div>
      </div>
    </main>
  );
}
