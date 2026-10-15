import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { randomKaomoji } from './library';
import styles from './index.module.less';

export interface KaomojiSlotProps {
  /** 两次抽取之间的时间，单位毫秒。 */
  intervalMs?: number;
  /** 滚轮动画时长，单位毫秒。 */
  durationMs?: number;
  /** 暂停自动抽取；也适合在非 loading 状态停止动画。 */
  active?: boolean;
  size?: 'large' | 'small';
  className?: string;
  /** 值递增时立即抽取一次，可用于“换一个”按钮。 */
  spinSignal?: number;
  onChange?: (face: string) => void;
}

const REEL_STEPS = 5;
const STEP_ANGLE = 360 / (REEL_STEPS + 1);

/** 按字符数限制字号，让长短不一的完整颜文字都能留在视窗内。 */
function faceStyle(face: string, size: 'large' | 'small'): CSSProperties {
  const length = Array.from(face).length;
  const maxPx = size === 'large' ? 72 : 24;
  const widthBudget = size === 'large' ? 620 : 200;
  return { fontSize: `min(${Math.min(maxPx, widthBudget / length)}px, ${80 / length}vw)` };
}

/** 完整颜文字滚轮；卸载或暂停时会清理全部计时器。 */
export default function KaomojiSlot({
  intervalMs = 2400,
  durationMs = 1350,
  active = true,
  size = 'large',
  className,
  spinSignal = 0,
  onChange,
}: KaomojiSlotProps) {
  const [current, setCurrent] = useState(() => randomKaomoji());
  const [reel, setReel] = useState<string[] | null>(null);
  const [round, setRound] = useState(0);
  const currentRef = useRef(current);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const finishSpin = useCallback((target: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
    currentRef.current = target;
    setCurrent(target);
    setReel(null);
    onChangeRef.current?.(target);
  }, []);

  const spin = useCallback(() => {
    if (timeoutRef.current) return;
    const faces = [currentRef.current];
    for (let index = 0; index < REEL_STEPS; index += 1) {
      faces.push(randomKaomoji(faces.at(-1)));
    }
    const target = faces[faces.length - 1];
    setReel(faces);
    setRound((value) => value + 1);
    // 动画完成时落位；超时只负责兜底，避免计时器先于最后一帧把轨道卸载。
    timeoutRef.current = setTimeout(() => finishSpin(target), durationMs + 250);
  }, [durationMs, finishSpin]);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(spin, Math.max(intervalMs, durationMs + 200));
    return () => clearInterval(interval);
  }, [active, durationMs, intervalMs, spin]);

  const lastSignalRef = useRef(spinSignal);
  useEffect(() => {
    if (spinSignal !== lastSignalRef.current) {
      lastSignalRef.current = spinSignal;
      spin();
    }
  }, [spinSignal, spin]);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    },
    [],
  );

  const face = reel?.at(-1) ?? current;
  const classes = [styles.slot, styles[size], className].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      role="img"
      aria-label={`颜文字 ${face}`}
      style={{ '--roll-duration': `${durationMs}ms` } as CSSProperties}
    >
      <div className={styles.viewport} aria-hidden="true">
        <div
          className={reel ? styles.spinning : styles.track}
          key={round}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget && reel) finishSpin(reel[reel.length - 1]);
          }}
        >
          {(reel ?? [current]).map((item, index) => (
            <span
              className={styles.face}
              style={{ '--face-angle': `${index * STEP_ANGLE}deg` } as CSSProperties}
              key={`${round}-${index}`}
            >
              <span className={styles['face-text']} style={faceStyle(item, size)}>
                {item}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
