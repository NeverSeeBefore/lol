import { useState } from 'react';
import { KAOMOJI_LIBRARY } from 'Components/KaomojiSlot/library';
import styles from './library.module.less';

const moods = ['全部', ...new Set(KAOMOJI_LIBRARY.map((item) => item.mood))];

export default function KaomojiLibraryPage() {
  const [mood, setMood] = useState('全部');
  const [notice, setNotice] = useState('');
  const visible = mood === '全部' ? KAOMOJI_LIBRARY : KAOMOJI_LIBRARY.filter((item) => item.mood === mood);

  const copyFace = async (face: string) => {
    try {
      await navigator.clipboard.writeText(face);
      setNotice(`已复制 ${face}`);
    } catch {
      setNotice('复制失败，请检查浏览器的剪贴板权限');
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.eyebrow}>LAB / 002</span>
          <h1>颜文字图鉴</h1>
          <p>{KAOMOJI_LIBRARY.length} 张精选表情，按心情挑选。点一下就能复制。</p>
        </header>

        <div className={styles.filters} role="group" aria-label="按心情筛选颜文字">
          {moods.map((item) => (
            <button
              type="button"
              key={item}
              className={item === mood ? `${styles.filter} ${styles.active}` : styles.filter}
              aria-pressed={item === mood}
              onClick={() => setMood(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className={styles.status} role="status" aria-live="polite">
          {notice || `正在展示 ${visible.length} 张颜文字`}
        </div>

        <div className={styles.grid}>
          {visible.map((item) => (
            <button
              type="button"
              className={styles.card}
              key={item.face}
              onClick={() => void copyFace(item.face)}
              aria-label={`复制颜文字 ${item.face}`}
            >
              <span className={styles.face}>{item.face}</span>
              <span className={styles['card-bottom']}>
                <span>{item.mood}</span>
                <span>复制 ↗</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </main>
  );
}
