import { useEffect, useRef } from 'react';
import { getPixelLayout, validatePixelScene, type PixelBezier, type PixelScene } from '../../lib/pixel';
import { PixelPlayback } from '../../lib/pixel/player';
import styles from './index.module.less';

export {
  validatePixelScene,
  getPixelLayout,
  interpolatePixelColor,
  cubicBezierAt,
  getCellTransitionProgress,
} from '../../lib/pixel';
export type { PixelFrame, PixelScene, PixelBezier } from '../../lib/pixel';

interface PixelCanvasProps {
  scene?: PixelScene;
  streams?: PixelScene[];
  interactive?: boolean;
  gap?: number;
  className?: string;
  ariaLabel?: string;
  squarePixels?: boolean;
  cellTransitionMs?: number;
  cellEasing?: PixelBezier;
}

export default function PixelCanvas({
  scene,
  streams,
  interactive = true,
  gap = 0,
  className,
  ariaLabel = 'Pixel art preview',
  squarePixels = false,
  cellTransitionMs = 0,
  cellEasing = [0.25, 0.1, 0.25, 1],
}: PixelCanvasProps) {
  const source = streams?.[0] ?? scene;
  if (!source) throw new Error('Pixel canvas requires a scene or at least one stream.');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const easingRef = useRef(cellEasing);
  easingRef.current = cellEasing;

  useEffect(() => {
    const validStreams = streams ? streams.map(validatePixelScene) : [validatePixelScene(source)];
    const player = new PixelPlayback(validStreams, cellTransitionMs, easingRef.current);
    player.showFirstFrame();
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const insetRatio = Math.min(0.45, Math.max(0, Number.isFinite(gap) ? gap : 0) / 2);
    const hoverLevels = new Float32Array(player.width * player.height);
    const hoverTransitions = new Map<number, { from: number; to: number; start: number }>();
    let hoverIndex = -1;
    let animationId = 0;
    let isIntersecting = true;
    let cssWidth = 0;
    let cssHeight = 0;
    let startTime: number | null = null;
    let elapsedBeforePause = 0;
    let currentElapsed = 0;

    const layout = () => getPixelLayout(cssWidth, cssHeight, player.width, player.height, squarePixels);

    const draw = () => {
      if (cssWidth <= 0 || cssHeight <= 0) return;
      const { pixelWidth, pixelHeight, offsetX, offsetY } = layout();
      context.clearRect(0, 0, cssWidth, cssHeight);
      for (let index = 0; index < hoverLevels.length; index += 1) {
        const color = player.colorAt(index, currentElapsed);
        if (!color || color === '#0000' || color === '#00000000') continue;
        const x = offsetX + (index % player.width) * pixelWidth;
        const y = offsetY + Math.floor(index / player.width) * pixelHeight;
        const scale = 1 + hoverLevels[index] * 0.18;
        const width = pixelWidth * (1 - insetRatio * 2) * scale;
        const height = pixelHeight * (1 - insetRatio * 2) * scale;
        context.fillStyle = color;
        context.fillRect(x + (pixelWidth - width) / 2, y + (pixelHeight - height) / 2, width, height);
      }
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      cssWidth = bounds.width;
      cssHeight = bounds.height;
      if (cssWidth <= 0 || cssHeight <= 0) {
        canvas.width = 0;
        canvas.height = 0;
        return;
      }
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

    const advanceHover = (timestamp: number) => {
      if (!hoverTransitions.size) return false;
      for (const [index, transition] of hoverTransitions) {
        const progress = Math.min(1, (timestamp - transition.start) / 150);
        const eased = progress * progress * (3 - 2 * progress);
        hoverLevels[index] = transition.from + (transition.to - transition.from) * eased;
        if (progress === 1) hoverTransitions.delete(index);
      }
      return true;
    };

    const tick = (timestamp: number) => {
      if (document.hidden || !isIntersecting || cssWidth <= 0 || cssHeight <= 0) {
        animationId = 0;
        startTime = null;
        elapsedBeforePause = currentElapsed;
        return;
      }
      if (startTime === null) startTime = timestamp;
      currentElapsed = elapsedBeforePause + timestamp - startTime;
      player.setEasing(easingRef.current);
      const frameChanged = !reducedMotion.matches && player.sample(currentElapsed);
      const hoverChanged = advanceHover(timestamp);
      if (frameChanged || hoverChanged || player.hasTransitions) draw();
      if ((!reducedMotion.matches && player.animated) || hoverTransitions.size || player.hasTransitions) {
        animationId = requestAnimationFrame(tick);
      } else animationId = 0;
    };

    const schedule = () => {
      if (!animationId && !document.hidden && isIntersecting && cssWidth > 0 && cssHeight > 0) {
        animationId = requestAnimationFrame(tick);
      }
    };

    const updatePlayback = () => {
      if (document.hidden || !isIntersecting || cssWidth <= 0 || cssHeight <= 0) {
        cancelAnimationFrame(animationId);
        animationId = 0;
        elapsedBeforePause = currentElapsed;
        startTime = null;
      } else if ((!reducedMotion.matches && player.animated) || hoverTransitions.size || player.hasTransitions) {
        schedule();
      }
    };

    const setHover = (next: number) => {
      if (next === hoverIndex) return;
      if (reducedMotion.matches) {
        if (hoverIndex >= 0) hoverLevels[hoverIndex] = 0;
        if (next >= 0) hoverLevels[next] = 1;
        hoverTransitions.clear();
        hoverIndex = next;
        draw();
        return;
      }
      const now = performance.now();
      advanceHover(now);
      if (hoverIndex >= 0) hoverTransitions.set(hoverIndex, { from: hoverLevels[hoverIndex], to: 0, start: now });
      if (next >= 0) hoverTransitions.set(next, { from: hoverLevels[next], to: 1, start: now });
      hoverIndex = next;
      schedule();
    };

    const onPointerMove = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;
      const { pixelWidth, pixelHeight, offsetX, offsetY } = layout();
      const column = Math.floor((event.clientX - bounds.left - offsetX) / pixelWidth);
      const row = Math.floor((event.clientY - bounds.top - offsetY) / pixelHeight);
      const next =
        column >= 0 && column < player.width && row >= 0 && row < player.height ? row * player.width + column : -1;
      setHover(next);
    };
    const onPointerLeave = () => setHover(-1);
    const onMotionChange = () => {
      cancelAnimationFrame(animationId);
      animationId = 0;
      startTime = null;
      elapsedBeforePause = 0;
      currentElapsed = 0;
      player.showFirstFrame();
      hoverTransitions.clear();
      hoverLevels.fill(0);
      if (hoverIndex >= 0) hoverLevels[hoverIndex] = 1;
      draw();
      updatePlayback();
    };

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
    resize();
    if (interactive) {
      canvas.addEventListener('pointermove', onPointerMove);
      canvas.addEventListener('pointerleave', onPointerLeave);
    }
    reducedMotion.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', updatePlayback);
    updatePlayback();

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
      intersectionObserver?.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      reducedMotion.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', updatePlayback);
    };
  }, [source, streams, interactive, gap, squarePixels, cellTransitionMs]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={ariaLabel}
      className={[styles.canvas, className].filter(Boolean).join(' ')}
      role="img"
      style={{ aspectRatio: `${source.width} / ${source.height}` }}
    />
  );
}
