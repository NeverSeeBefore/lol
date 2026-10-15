import Loading from 'Components/Loading';
import styles from './loading.module.less';

export default function LoadingPage() {
  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>LAB / 003</span>
          <h1>轨道 Loading</h1>
          <p>从 Test 页带来的 Canvas 动画。圆环、线框和旋转方块沿同一时间轴运行。</p>
        </header>

        <section className={styles.machine} aria-label="轨道 Loading 动画演示">
          <div className={styles['machine-top']}>
            <span className={styles.dot} />
            <span>CANVAS / LIVE</span>
          </div>
          <div className={styles.stage}>
            <Loading scale={2} />
          </div>
          <div className={styles.caption}>动画进度由真实经过时间计算；浏览器掉帧不会让周期越来越慢。</div>
        </section>

        <div className={styles.note}>
          <strong>也可以直接复用</strong>
          <code>{'<Loading />'}</code>
          <span>默认尺寸保留给 Test 页；实验室展示使用 2 倍清晰度画布。</span>
        </div>
      </div>
    </main>
  );
}
