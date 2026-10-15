import { useState } from 'react';
import { Link } from 'react-router-dom';
import KaomojiSlot from 'Components/KaomojiSlot';
import { EYES, FRAMES, KAOMOJI_LIBRARY, MOUTHS } from 'Components/KaomojiSlot/library';
import styles from './page.module.less';

const examples = ['ಠ_ಠ', 'ʕっ•ᴥ•ʔっ', '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', '(╯°□°）╯︵ ┻━┻'];

export default function KaomojiPage() {
  const [active, setActive] = useState(true);
  const [spinSignal, setSpinSignal] = useState(0);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>LAB / 001</span>
          <h1>颜文字发生器</h1>
          <p>给文字一点表情。整张颜文字绕着圆筒转动，每隔几秒遇见一张新面孔。</p>
        </header>

        <section className={styles.machine} aria-label="颜文字老虎机">
          <div className={styles['machine-top']}>
            <span className={styles['live-dot']} />
            <span>NOW PLAYING</span>
            <span className={styles['machine-number']}>№ 001</span>
          </div>

          <div className={styles.stage}>
            <span className={styles['stage-line']} />
            <KaomojiSlot active={active} spinSignal={spinSignal} />
            <span className={styles['stage-line']} />
          </div>

          <div className={styles.controls}>
            <span className={styles.hint}>每 2.4 秒，抽取一张新面孔</span>
            <div className={styles.actions}>
              <button type="button" className={styles['secondary-button']} onClick={() => setActive((value) => !value)}>
                {active ? '暂停' : '继续'}
              </button>
              <button
                type="button"
                className={styles['primary-button']}
                onClick={() => setSpinSignal((value) => value + 1)}
              >
                换一个 ↗
              </button>
            </div>
          </div>
        </section>

        <div className={styles['lower-grid']}>
          <section className={styles.card}>
            <span className={styles['card-label']}>THE LIBRARY</span>
            <h2>短表情，也有长故事</h2>
            <p>
              {KAOMOJI_LIBRARY.length} 张精选颜文字，加上 {FRAMES.length} 种轮廓、{EYES.length} 对眼睛和 {MOUTHS.length}{' '}
              种嘴型，长短表情随机出现。
            </p>
            <div className={styles.examples} aria-label="颜文字示例">
              {examples.map((face) => (
                <span key={face}>{face}</span>
              ))}
            </div>
            <Link className={styles['library-link']} to="../kaomoji-library">
              浏览完整图鉴 ↗
            </Link>
          </section>

          <section className={styles.card}>
            <span className={styles['card-label']}>MAKE IT YOURS</span>
            <h2>也可以放进你的 loading</h2>
            <p>动画已封装为独立组件，默认自动播放；卸载或暂停时会清理计时器。</p>
            <code className={styles.code}>{'<KaomojiSlot size="small" intervalMs={2400} />'}</code>
          </section>
        </div>
      </div>
    </main>
  );
}
