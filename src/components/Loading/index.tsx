import { useEffect, useRef } from 'react';
import { tween } from 'Utils/tween';
import styles from './index.module.less';

function drawCircle(ctx: CanvasRenderingContext2D, width: number, height: number, color: string, offset: number) {
  ctx.save();
  ctx.beginPath();
  // const centerX = width / 2;
  // const centerY = height / 2;
  ctx.setLineDash([1, 8.9]);
  ctx.lineDashOffset = (-offset * 0.75) % 9.9;
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.arc(width / 2, height / 2, 30, 0, Math.PI * 2);
  ctx.moveTo(width / 2, height / 2);
  ctx.rotate(offset % (Math.PI * 2));
  ctx.stroke();
  ctx.restore();
}

interface DrawRectConfig {
  rectWidth: number; // 矩形边框长度（每条线长度）
  halfStepCount: number; // 绘制分几步完成
  gap: number; // 正向画完后空闲时间
  sleep: number; // 完整的图形绘制之后的空闲长度
  offset: number;
  lineColor: string;
  lineWidth: number;
}

function drawRect(ctx: CanvasRenderingContext2D, width: number, height: number, config: DrawRectConfig) {
  const { rectWidth, halfStepCount, gap, sleep, offset, lineWidth, lineColor } = config;
  const globalStepCount = halfStepCount + gap + halfStepCount + sleep;
  // half = 30
  // gap = 10
  // sleep = 10
  // 10, run
  // 20, run
  // 30, run
  // 40, stay 30
  // 50, run back
  // 60, run back
  // 70, run back
  // 80, stop
  // 91, run

  let offsetInside = offset % globalStepCount;
  // 动画绘制完成
  if (offsetInside >= halfStepCount + gap + halfStepCount) {
    return;
  }
  // 绘制到后半段
  if (offsetInside >= halfStepCount + gap) {
    offsetInside -= gap;
  }
  // 在间歇期间
  else if (offsetInside >= halfStepCount) {
    offsetInside = halfStepCount;
  }

  const direction = String(Math.ceil(offsetInside / halfStepCount) % 2); // direction 1 增加，0 减少
  const lineStepCount = halfStepCount / 4; // 每条线分几步画完
  const centerX = width / 2;
  const centerY = height / 2;
  // 假设 offsetInside = 40，图像绘制完成
  const globalStep = offsetInside % halfStepCount; // 当前时全局的第几部
  const lineCount = Math.floor(globalStep / lineStepCount); // 当前绘制到第几条线
  const lineStep = offsetInside % lineStepCount;
  const lineStepWidth = rectWidth / lineStepCount;

  ctx.save();

  ctx.beginPath();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'miter';
  ctx.translate(centerX, centerY);
  ctx.rotate(Math.PI / 4);

  switch (direction + lineCount) {
    case '10': {
      if (lineStep === 0) {
        // left
        ctx.moveTo(0, 0);
        ctx.lineTo(-rectWidth, 0);
        ctx.lineTo(-rectWidth, rectWidth);
        ctx.lineTo(0, rectWidth);
        ctx.lineTo(0, 0);

        // right
        ctx.moveTo(0, 0);
        ctx.lineTo(rectWidth, 0);
        ctx.lineTo(rectWidth, -rectWidth);
        ctx.lineTo(0, -rectWidth);
        ctx.lineTo(0, 0);
      } else {
        // left
        ctx.moveTo(0, 0);
        ctx.lineTo(-lineStepWidth * lineStep, 0);

        // right
        ctx.moveTo(0, 0);
        ctx.lineTo(lineStepWidth * lineStep, 0);
      }
      break;
    }
    case '11': {
      // left
      ctx.moveTo(0, 0);
      ctx.lineTo(-rectWidth, 0);
      ctx.lineTo(-rectWidth, lineStepWidth * lineStep);

      // right
      ctx.moveTo(0, 0);
      ctx.lineTo(rectWidth, 0);
      ctx.lineTo(rectWidth, -lineStepWidth * lineStep);
      break;
    }
    case '12': {
      // left
      ctx.moveTo(0, 0);
      ctx.lineTo(-rectWidth, 0);
      ctx.lineTo(-rectWidth, rectWidth);
      ctx.lineTo(-rectWidth + lineStepWidth * lineStep, rectWidth);

      // right
      ctx.moveTo(0, 0);
      ctx.lineTo(rectWidth, 0);
      ctx.lineTo(rectWidth, -rectWidth);
      ctx.lineTo(rectWidth - lineStepWidth * lineStep, -rectWidth);
      break;
    }
    case '13': {
      ctx.moveTo(0, 0);
      ctx.lineTo(-rectWidth, 0);
      ctx.lineTo(-rectWidth, rectWidth);
      ctx.lineTo(0, rectWidth);
      ctx.lineTo(0, rectWidth - lineStepWidth * lineStep);
      // right
      ctx.moveTo(0, 0);
      ctx.lineTo(rectWidth, 0);
      ctx.lineTo(rectWidth, -rectWidth);
      ctx.lineTo(0, -rectWidth);
      ctx.lineTo(0, -rectWidth + lineStepWidth * lineStep);
      break;
    }
    case '00': {
      if (lineStep !== 0) {
        ctx.moveTo(-lineStepWidth * lineStep, 0);
        ctx.lineTo(-rectWidth, 0);
        ctx.lineTo(-rectWidth, rectWidth);
        ctx.lineTo(0, rectWidth);
        ctx.lineTo(0, 0);

        ctx.moveTo(lineStepWidth * lineStep, 0);
        ctx.lineTo(rectWidth, 0);
        ctx.lineTo(rectWidth, -rectWidth);
        ctx.lineTo(0, -rectWidth);
        ctx.lineTo(0, 0);
      }

      break;
    }
    case '01': {
      ctx.moveTo(-rectWidth, lineStepWidth * lineStep);
      ctx.lineTo(-rectWidth, rectWidth);
      ctx.lineTo(0, rectWidth);
      ctx.lineTo(0, 0);

      ctx.moveTo(rectWidth, -lineStepWidth * lineStep);
      ctx.lineTo(rectWidth, -rectWidth);
      ctx.lineTo(0, -rectWidth);
      ctx.lineTo(0, 0);
      break;
    }
    case '02': {
      ctx.moveTo(-rectWidth + lineStepWidth * lineStep, rectWidth);
      ctx.lineTo(0, rectWidth);
      ctx.lineTo(0, 0);

      ctx.moveTo(rectWidth - lineStepWidth * lineStep, -rectWidth);
      ctx.lineTo(0, -rectWidth);
      ctx.lineTo(0, 0);
      break;
    }
    case '03': {
      ctx.moveTo(0, rectWidth - lineStepWidth * lineStep);
      ctx.lineTo(0, 0);

      ctx.moveTo(0, -rectWidth + lineStepWidth * lineStep);
      ctx.lineTo(0, 0);
      break;
    }
    // case '10': {
    //   ctx.lineTo(-rectWidth, 0);
    //   ctx.lineTo(-rectWidth, rectWidth);
    //   ctx.lineTo(0, rectWidth);
    //   ctx.lineTo(0, rectWidth - lineStepWidth * (10 - lineStep));
    //   break;
    // }
    default:
      break;
  }
  ctx.stroke();

  ctx.restore();
}

function drawRotateRect(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  globalStepCount: number,
  color: string,
  offset: number,
) {
  const quarterStepCount = globalStepCount / 4;
  // easeInOutExpo
  const offsetInside = offset % globalStepCount;
  const offsetLine = offsetInside % quarterStepCount;
  const offsetLineIndex = Math.floor(offsetInside / quarterStepCount);
  // x * Math.PI/4 +  tween.easeInOutExpo(offsetlibne/quarterStepCount) * Math.PI / 4
  ctx.save();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  const centerX = width / 2;
  const centerY = height / 2;
  ctx.translate(centerX, centerY);
  ctx.rotate((0.5 + offsetLineIndex + tween.easeInOutQuart(offsetLine / quarterStepCount)) * (Math.PI / 2));
  // 34*34
  ctx.moveTo(-17, -17);
  ctx.lineTo(-17, +17);
  ctx.lineTo(+17, +17);
  ctx.lineTo(+17, -17);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export interface LoadingProps {
  /** 显示倍率，默认保持 Test 页原来的尺寸。 */
  scale?: number;
}

export default function Loading({ scale = 1 }: LoadingProps) {
  const cvsRef = useRef<HTMLCanvasElement>(null);
  const displayScale = Math.max(0.5, Math.min(3, scale));

  useEffect(() => {
    const canvas = cvsRef.current;
    if (!canvas) return;
    const pixelScale = displayScale * (window.devicePixelRatio || 1);
    canvas.width = Math.round(132 * pixelScale);
    canvas.height = Math.round(70 * pixelScale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(pixelScale, 0, 0, pixelScale, 0, 0);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent-text').trim();

    let animationFrameId = 0;
    let startedAt: number | null = null;
    let lastStep = -1;
    const frameDuration = 25;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const drawFrame = (step: number) => {
      const width = 132;
      const height = 70;
      ctx.clearRect(0, 0, width, height);
      drawCircle(ctx, width, height, accent, step);
      drawRect(ctx, width, height, {
        halfStepCount: 40,
        rectWidth: 46.67,
        gap: 4,
        sleep: 12,
        offset: step,
        lineWidth: 1,
        lineColor: accent,
      });
      drawRect(ctx, width, height, {
        halfStepCount: 32,
        rectWidth: 23.3,
        gap: 8,
        sleep: 24,
        offset: step,
        lineWidth: 2,
        lineColor: accent,
      });
      drawRotateRect(ctx, width, height, 180, accent, step);
    };

    const loadingAnimation = (time: number) => {
      if (startedAt === null) startedAt = time;
      // 按真实经过时间推导相位；掉帧只会跳过画面，不会延长周期。
      const step = Math.floor((time - startedAt) / frameDuration) + 1;
      if (step !== lastStep) {
        lastStep = step;
        drawFrame(step);
      }
      animationFrameId = requestAnimationFrame(loadingAnimation);
    };

    const updateMotion = () => {
      cancelAnimationFrame(animationFrameId);
      if (reducedMotion.matches) {
        drawFrame(40);
      } else {
        startedAt = null;
        lastStep = -1;
        animationFrameId = requestAnimationFrame(loadingAnimation);
      }
    };

    reducedMotion.addEventListener('change', updateMotion);
    updateMotion();
    return () => {
      reducedMotion.removeEventListener('change', updateMotion);
      cancelAnimationFrame(animationFrameId);
    };
  }, [displayScale]);
  return (
    <div className={styles['loading-container']} role="status" aria-label="加载中">
      <canvas
        aria-hidden="true"
        ref={cvsRef}
        width={132}
        height={70}
        style={{ width: 132 * displayScale, height: 70 * displayScale }}
      />
    </div>
  );
}
