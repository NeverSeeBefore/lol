import { useState } from 'react';
import RippleGrid from 'Components/RippleGrid';
import styles from './ripple.module.less';

const speeds = [
  { label: '舒缓', value: 0.65 },
  { label: '标准', value: 1 },
  { label: '迅速', value: 1.45 },
] as const;

export default function RipplePage() {
  const [speed, setSpeed] = useState(1);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <p className={styles.overline}>涟漪 / RIPPLE</p>
          <h1>从一点，长成一片。</h1>
          <p>
            从空场里的一个点开始，每颗圆点逐步成形，组成蓝白表情。三圈波纹由中心扩散后，整片点阵拉远，最后只剩一个点。点击画面也能掀起涟漪。
          </p>
        </header>

        <section className={styles.experiment} aria-label="交互式圆点涟漪示例">
          <RippleGrid speed={speed} />
          <div className={styles.caption}>
            <span>23 × 13 个圆点</span>
            <span>点击任意圆点产生涟漪</span>
          </div>
        </section>

        <section className={styles.controls} aria-label="涟漪设置">
          <div>
            <h2>调整传播节奏</h2>
            <p>点阵逐颗成形，三圈波纹依次扩散，最后拉远到中心一点。交互涟漪从触碰处向外传播。</p>
          </div>
          <fieldset>
            <legend>播放速度</legend>
            <div className={styles.choices}>
              {speeds.map((option) => (
                <label key={option.value} className={speed === option.value ? styles.selected : undefined}>
                  <input
                    type="radio"
                    name="ripple-speed"
                    value={option.value}
                    checked={speed === option.value}
                    onChange={() => setSpeed(option.value)}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className={styles.note}>
          <h2>为什么单独做？</h2>
          <p>
            像素场景适合有限帧的颜色画面；这里需要连续计算每个圆点的亮度、大小和波前位置。因此它独立为
            <code>RippleGrid</code> 组件，同时沿用项目的 Canvas 生命周期与暗色视觉语言。
          </p>
          <pre>{`import RippleGrid from 'Components/RippleGrid';

<RippleGrid speed={1} ariaLabel="交互式圆点涟漪" />`}</pre>
        </section>
      </div>
    </main>
  );
}
