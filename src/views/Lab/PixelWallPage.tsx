import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PixelBackgroundWall from 'Components/PixelBackgroundWall';
import type { PixelBezier } from 'Src/lib/pixel';
import { createPixelWallMeteorStream, createPixelWallScene } from './pixel-wall-scene';
import styles from './pixel-wall.module.less';

const speeds = {
  slow: { label: '舒缓', duration: 320 },
  normal: { label: '标准', duration: 240 },
  fast: { label: '轻快', duration: 160 },
} as const;

type Speed = keyof typeof speeds;

const easingPresets = {
  linear: { label: '匀速', points: [0, 0, 1, 1] },
  soft: { label: '柔和', points: [0.25, 0.1, 0.25, 1] },
  out: { label: '先快后慢', points: [0, 0, 0.2, 1] },
} as const;

const pointNames = ['x1', 'y1', 'x2', 'y2'] as const;
const meteorStream = createPixelWallMeteorStream();

export default function PixelWallPage() {
  const [speed, setSpeed] = useState<Speed>('normal');
  const [shade, setShade] = useState(0.5);
  const [cellTransitionMs, setCellTransitionMs] = useState(180);
  const [cellEasing, setCellEasing] = useState<PixelBezier>(easingPresets.soft.points);
  const scene = useMemo(() => createPixelWallScene(speeds[speed].duration), [speed]);
  const streams = useMemo(() => [scene, meteorStream], [scene]);
  const activePreset = Object.keys(easingPresets).find((key) =>
    easingPresets[key as keyof typeof easingPresets].points.every((point, index) => point === cellEasing[index]),
  );

  const changePoint = (index: number, raw: string) => {
    const value = Number(raw);
    if (!Number.isFinite(value)) return;
    setCellEasing(
      (current) =>
        current.map((point, position) =>
          position === index ? Math.min(1, Math.max(0, value)) : point,
        ) as unknown as PixelBezier,
    );
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <p className={styles.overline}>背景墙 / LOOP 01</p>
          <h1>让夜色缓慢流动。</h1>
          <p>一面可以承载内容的像素墙。极光、窗灯与街上的光点按同一个节拍循环，画面离开视口时自动休息。</p>
        </header>

        <section className={styles.demo} aria-label="循环背景墙示例">
          <PixelBackgroundWall
            scene={scene}
            shade={shade}
            cellTransitionMs={cellTransitionMs}
            cellEasing={cellEasing}
            ariaLabel="夜间城市、月亮和缓慢流动的极光"
            className={styles.wall}
          >
            <div className={styles.hero}>
              <span className={styles.caption}>NIGHT SHIFT · 96 × 52 PIXELS</span>
              <h2>
                城市入夜，
                <br />
                灵感刚刚醒来。
              </h2>
              <p>把动画留在背景，把注意力留给内容。</p>
              <Link to="/lab/pixel-studio" className={styles.link}>
                去像素工坊制作自己的画面 <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </PixelBackgroundWall>
          <div className={styles.meta}>
            <span>32 帧无缝循环 · 逐像素颜色过渡</span>
            <span>跟随系统减少动态效果设置</span>
          </div>
        </section>

        <section className={styles.controls} aria-label="背景墙设置">
          <div>
            <h2>调整这面墙</h2>
            <p>改变播放节奏、像素过渡和内容遮罩，观察背景如何服务内容。</p>
          </div>
          <fieldset className={styles.speed}>
            <legend>播放节奏</legend>
            <div className={styles.choices}>
              {(Object.keys(speeds) as Speed[]).map((option) => (
                <label key={option} className={speed === option ? styles.selected : undefined}>
                  <input
                    type="radio"
                    name="wall-speed"
                    value={option}
                    checked={speed === option}
                    onChange={() => setSpeed(option)}
                  />
                  {speeds[option].label}
                </label>
              ))}
            </div>
          </fieldset>
          <label className={styles['shade-control']}>
            <span>
              内容遮罩 <strong>{Math.round(shade * 100)}%</strong>
            </span>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={shade}
              onChange={(event) => setShade(Number(event.target.value))}
            />
          </label>
          <label className={styles['shade-control']}>
            <span>
              像素过渡 <strong>{cellTransitionMs === 0 ? '关闭' : `${cellTransitionMs} ms`}</strong>
            </span>
            <input
              type="range"
              min="0"
              max="1000"
              step="20"
              value={cellTransitionMs}
              onChange={(event) => setCellTransitionMs(Number(event.target.value))}
            />
          </label>
        </section>

        <section className={styles.easing} aria-label="逐像素过渡曲线">
          <div className={styles['easing-intro']}>
            <h2>过渡曲线</h2>
            <p>选择一个节奏，或调整两个控制点。曲线只控制变色的速度，不改变像素的尺寸。</p>
            <div className={styles.presets}>
              {(Object.keys(easingPresets) as (keyof typeof easingPresets)[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-pressed={activePreset === key}
                  onClick={() => setCellEasing(easingPresets[key].points)}
                >
                  {easingPresets[key].label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles['point-controls']}>
            {pointNames.map((name, index) => (
              <label key={name}>
                {name}
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.05"
                  value={cellEasing[index]}
                  onChange={(event) => changePoint(index, event.target.value)}
                />
              </label>
            ))}
          </div>
          <div className={styles['curve-preview']}>
            <svg viewBox="0 0 120 120" role="img" aria-label={`当前曲线 cubic-bezier(${cellEasing.join(', ')})`}>
              <path className={styles.diagonal} d="M 0 120 L 120 0" />
              <path
                className={styles.curve}
                d={`M 0 120 C ${cellEasing[0] * 120} ${120 - cellEasing[1] * 120}, ${cellEasing[2] * 120} ${120 - cellEasing[3] * 120}, 120 0`}
              />
            </svg>
            <code>cubic-bezier({cellEasing.join(', ')})</code>
          </div>
        </section>

        <section className={styles['multi-section']} aria-label="双流合成示例">
          <div className={styles['multi-heading']}>
            <div>
              <h2>两条动画流，一面背景墙。</h2>
              <p>城市与流星各自按自己的帧时长循环。流星层的透明格露出城市，非透明格直接覆盖，不做色彩融合。</p>
            </div>
            <span>STREAM A + STREAM B</span>
          </div>
          <PixelBackgroundWall
            streams={streams}
            shade={0}
            ariaLabel="夜间城市与独立播放的流星像素流合成画面"
            className={styles['multi-wall']}
          >
            <div className={styles['multi-content']}>
              <strong>同一片夜空，两种节奏。</strong>
              <span>后输入的非透明像素优先显示</span>
            </div>
          </PixelBackgroundWall>
          <div className={styles['multi-meta']}>
            <span>城市流 · 32 帧 · {speeds[speed].duration} ms / 帧</span>
            <span>流星流 · 24 帧 · 150 ms / 帧</span>
          </div>
        </section>

        <section className={styles.usage}>
          <h2>直接放进页面</h2>
          <p>传入像素工坊导出的 PixelScene，背景会自动循环；只有颜色发生变化的像素参与过渡，时长设为 0 即关闭。</p>
          <pre>
            <code>{`<PixelBackgroundWall scene={scene} shade={0.5} cellTransitionMs={180} cellEasing={[0.25, 0.1, 0.25, 1]}>
  <h1>你的内容</h1>
</PixelBackgroundWall>`}</code>
          </pre>
          <pre>
            <code>{`<PixelBackgroundWall streams={[cityScene, meteorScene]} shade={0}>
  <h1>两条独立动画流</h1>
</PixelBackgroundWall>`}</code>
          </pre>
        </section>
      </div>
    </main>
  );
}
