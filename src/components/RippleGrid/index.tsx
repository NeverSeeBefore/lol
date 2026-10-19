import { useEffect, useRef } from 'react';
import { sampleRippleCell, sampleRippleStage, type RippleImpulse } from './ripple';
import styles from './index.module.less';

interface RippleGridProps {
  speed?: number;
  interactive?: boolean;
  className?: string;
  ariaLabel?: string;
}

const COLUMNS = 23;
const ROWS = 13;
const DARK = [21, 23, 27] as const;
const BLUE = [33, 136, 250] as const;
const WHITE = [246, 249, 255] as const;

function dotColor(energy: number, highlight: number) {
  const whiteMix = Math.pow(highlight, 3);
  const channel = (index: 0 | 1 | 2) =>
    Math.round((DARK[index] + (BLUE[index] - DARK[index]) * energy) * (1 - whiteMix) + WHITE[index] * whiteMix);
  return `rgb(${channel(0)} ${channel(1)} ${channel(2)})`;
}

function drawCell(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  pitch: number,
  energy: number,
  highlight: number,
  scale: number,
  formation: number,
  column: number,
  row: number,
) {
  if (energy < 0.005) return;
  const solidMix = Math.min(1, Math.max(0, (formation - 0.38) / 0.55));
  if (solidMix < 1) {
    const radius = pitch * 0.405 * scale;
    context.save();
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.clip();
    context.globalAlpha = energy * (1 - solidMix) * 0.7;
    context.fillStyle = '#194a82';
    context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    const tileStep = pitch * 0.095 * scale;
    for (let tileY = -4; tileY <= 4; tileY += 1) {
      for (let tileX = -4; tileX <= 4; tileX += 1) {
        const hash = (column * 13 + row * 7 + tileX * 17 + tileY * 23 + 1000) % 11;
        if (formation < Math.hypot(tileX, tileY) * 0.07 + hash * 0.018) continue;
        context.globalAlpha = energy * (1 - solidMix) * (0.48 + hash * 0.04);
        context.fillStyle = hash > 7 ? '#a6c8e9' : dotColor(0.55 + formation * 0.45, highlight);
        context.fillRect(
          x + tileX * tileStep - tileStep * 0.4,
          y + tileY * tileStep - tileStep * 0.4,
          tileStep * 0.8,
          tileStep * 0.8,
        );
      }
    }
    context.restore();
  }
  if (solidMix > 0) {
    context.globalAlpha = solidMix;
    context.beginPath();
    context.arc(x, y, pitch * 0.405 * scale, 0, Math.PI * 2);
    context.fillStyle = dotColor(energy, highlight);
    context.fill();
  }
  context.globalAlpha = 1;
}

function drawSeed(context: CanvasRenderingContext2D, x: number, y: number, pitch: number, opacity: number) {
  const radius = pitch * 0.405;
  const tileStep = pitch * 0.084;
  context.save();
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.clip();
  context.globalAlpha = opacity;
  context.fillStyle = '#15528f';
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  for (let tileY = -5; tileY <= 5; tileY += 1) {
    for (let tileX = -5; tileX <= 5; tileX += 1) {
      const hash = (tileX * 17 + tileY * 23 + 1000) % 9;
      context.globalAlpha = opacity * (0.45 + hash * 0.055);
      context.fillStyle = Math.abs(tileX) === 2 && tileY >= -2 && tileY <= 0 ? '#f6f9ff' : '#3297f9';
      context.fillRect(
        x + tileX * tileStep - tileStep * 0.42,
        y + tileY * tileStep - tileStep * 0.42,
        tileStep * 0.84,
        tileStep * 0.84,
      );
    }
  }
  context.restore();
}

/** A continuous dot ripple; independent from the palette and frame limits of PixelScene. */
export default function RippleGrid({
  speed = 1,
  interactive = true,
  className,
  ariaLabel = '蓝色圆点组成的循环涟漪；按回车或点击产生新的涟漪',
}: RippleGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const safeSpeed = Number.isFinite(speed) ? Math.max(0.25, Math.min(2, speed)) : 1;
    const impulses: RippleImpulse[] = [];
    let cssWidth = 0;
    let cssHeight = 0;
    let elapsed = 0;
    let elapsedBeforePause = 0;
    let startedAt: number | null = null;
    let animationId = 0;
    let isIntersecting = true;

    const geometry = () => {
      const pitch = Math.min(cssWidth / (COLUMNS + 1), cssHeight / (ROWS + 1));
      return {
        pitch,
        left: (cssWidth - (COLUMNS - 1) * pitch) / 2,
        top: (cssHeight - (ROWS - 1) * pitch) / 2,
      };
    };

    const draw = () => {
      if (cssWidth <= 0 || cssHeight <= 0) return;
      context.fillStyle = '#101113';
      context.fillRect(0, 0, cssWidth, cssHeight);
      const { pitch } = geometry();
      const { zoom, seed } = sampleRippleStage(elapsed);
      const scaledPitch = pitch * zoom;
      const centerX = cssWidth / 2;
      const centerY = cssHeight / 2;
      if (scaledPitch >= 5) {
        const halfColumns = Math.ceil(cssWidth / (2 * scaledPitch));
        const halfRows = Math.ceil(cssHeight / (2 * scaledPitch));
        for (let row = -halfRows; row <= halfRows; row += 1) {
          for (let column = -halfColumns; column <= halfColumns; column += 1) {
            const x = centerX + column * scaledPitch;
            const y = centerY + row * scaledPitch;
            const distance = Math.hypot(x - centerX, y - centerY) / (Math.min(cssWidth, cssHeight) * 0.8);
            context.globalAlpha =
              Math.max(0, 1 - distance * distance) * Math.min(1, Math.max(0, (scaledPitch - 5) / 4));
            context.beginPath();
            context.arc(x, y, scaledPitch * 0.35, 0, Math.PI * 2);
            context.fillStyle = '#191a1c';
            context.fill();
          }
        }
        context.globalAlpha = 1;
      }
      for (let row = 0; row < ROWS; row += 1) {
        for (let column = 0; column < COLUMNS; column += 1) {
          const cell = sampleRippleCell(column, row, COLUMNS, ROWS, elapsed, impulses);
          drawCell(
            context,
            centerX + (column - (COLUMNS - 1) / 2) * scaledPitch,
            centerY + (row - (ROWS - 1) / 2) * scaledPitch,
            scaledPitch,
            cell.energy,
            cell.highlight,
            cell.scale,
            cell.formation,
            column,
            row,
          );
        }
      }
      if (seed > 0) drawSeed(context, centerX, centerY, pitch, seed);
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      cssWidth = bounds.width;
      cssHeight = bounds.height;
      if (cssWidth <= 0 || cssHeight <= 0) return;
      const dpr = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.round(cssWidth * dpr));
      const height = Math.max(1, Math.round(cssHeight * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.setTransform(width / cssWidth, 0, 0, height / cssHeight, 0, 0);
      draw();
    };

    const tick = (timestamp: number) => {
      if (document.hidden || !isIntersecting || cssWidth <= 0 || cssHeight <= 0 || reducedMotion.matches) {
        animationId = 0;
        startedAt = null;
        elapsedBeforePause = elapsed;
        return;
      }
      if (startedAt === null) startedAt = timestamp;
      elapsed = elapsedBeforePause + ((timestamp - startedAt) / 1000) * safeSpeed;
      while (impulses.length && elapsed - impulses[0].startedAt > 2.5) impulses.shift();
      draw();
      animationId = requestAnimationFrame(tick);
    };

    const updatePlayback = () => {
      if (document.hidden || !isIntersecting || cssWidth <= 0 || cssHeight <= 0 || reducedMotion.matches) {
        cancelAnimationFrame(animationId);
        animationId = 0;
        startedAt = null;
        elapsedBeforePause = elapsed;
        if (reducedMotion.matches) {
          elapsed = 5.5;
          impulses.length = 0;
          draw();
        }
      } else if (!animationId) animationId = requestAnimationFrame(tick);
    };

    const addRipple = (column: number, row: number) => {
      if (reducedMotion.matches) return;
      impulses.push({ x: column, y: row, startedAt: elapsed });
      if (impulses.length > 6) impulses.shift();
      draw();
      updatePlayback();
    };
    const onPointerDown = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const { pitch } = geometry();
      const scaledPitch = pitch * sampleRippleStage(elapsed).zoom;
      const column = Math.round((event.clientX - bounds.left - cssWidth / 2) / scaledPitch + (COLUMNS - 1) / 2);
      const row = Math.round((event.clientY - bounds.top - cssHeight / 2) / scaledPitch + (ROWS - 1) / 2);
      if (column >= 0 && column < COLUMNS && row >= 0 && row < ROWS) addRipple(column, row);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      addRipple((COLUMNS - 1) / 2, (ROWS - 1) / 2);
    };
    const onMotionChange = () => updatePlayback();
    const observer = new ResizeObserver(() => {
      resize();
      updatePlayback();
    });
    const intersectionObserver =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            isIntersecting = entry.isIntersecting;
            updatePlayback();
          });
    observer.observe(canvas);
    intersectionObserver?.observe(canvas);
    if (interactive) {
      canvas.addEventListener('pointerdown', onPointerDown);
      canvas.addEventListener('keydown', onKeyDown);
    }
    reducedMotion.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', updatePlayback);
    resize();
    updatePlayback();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      intersectionObserver?.disconnect();
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('keydown', onKeyDown);
      reducedMotion.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', updatePlayback);
    };
  }, [speed, interactive]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={ariaLabel}
      className={[styles.canvas, className].filter(Boolean).join(' ')}
      role="img"
      tabIndex={interactive ? 0 : undefined}
    />
  );
}
