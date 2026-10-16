import type { ReactNode } from 'react';
import PixelCanvas from 'Components/PixelCanvas';
import type { PixelBezier, PixelScene } from '../../lib/pixel';
import styles from './index.module.less';

interface PixelBackgroundWallProps {
  scene?: PixelScene;
  streams?: PixelScene[];
  children?: ReactNode;
  className?: string;
  ariaLabel?: string;
  shade?: number;
  cellTransitionMs?: number;
  cellEasing?: PixelBezier;
}

/** A looping pixel scene that fills its container while content stays readable above it. */
export default function PixelBackgroundWall({
  scene,
  streams,
  children,
  className,
  ariaLabel = '循环播放的像素背景',
  shade = 0.34,
  cellTransitionMs = 180,
  cellEasing,
}: PixelBackgroundWallProps) {
  const source = streams?.[0] ?? scene;
  if (!source) throw new Error('Pixel background wall requires a scene or at least one stream.');
  const safeShade = Number.isFinite(shade) ? Math.min(0.8, Math.max(0, shade)) : 0.34;

  return (
    <div className={[styles.wall, className].filter(Boolean).join(' ')}>
      <div className={styles.visual}>
        <PixelCanvas
          scene={source}
          streams={streams}
          interactive={false}
          gap={0}
          squarePixels
          cellTransitionMs={cellTransitionMs}
          cellEasing={cellEasing}
          className={styles.canvas}
          ariaLabel={ariaLabel}
        />
      </div>
      <div className={styles.shade} style={{ opacity: safeShade }} aria-hidden="true" />
      {children && <div className={styles.content}>{children}</div>}
    </div>
  );
}
