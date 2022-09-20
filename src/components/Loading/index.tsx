import React, { useEffect, useRef } from 'react';
import { tween } from 'Utils/tween';
import styles from './index.module.less';

function drawCircle(ctx: CanvasRenderingContext2D, width: number, height: number, color: string, offset: number) {
  ctx.save();
  ctx.beginPath();
  // const centerX = width / 2;
  // const centerY = height / 2;
  ctx.setLineDash([1, 8.9]);
  ctx.lineDashOffset = -offset;
  ctx.lineWidth = 4;
  ctx.strokeStyle = color;
  ctx.arc(width / 2, height / 2, 30, 0, Math.PI * 2);
  ctx.moveTo(width / 2, height / 2);
  ctx.rotate(offset);
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
  console.log(offsetInside);
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
  const offsetLineIndex = Number.parseInt((offsetInside / quarterStepCount).toFixed(2), 10) % 4;
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

export default function Loading() {
  const cvsRef = useRef<HTMLCanvasElement>(null);

  let count = 1;
  let lastTime = 0;
  function loadingAnimation(time: number) {
    if (!cvsRef.current) {
      return;
    }
    if (lastTime === 0) {
      lastTime = time;
    }
    if (time - lastTime > 30) {
      lastTime = time;

      const ctx = cvsRef.current.getContext('2d');
      if (!ctx) {
        return;
      }
      const width = cvsRef.current.width || 0;
      const height = cvsRef.current.height || 0;
      ctx.clearRect(0, 0, width, height);
      drawCircle(ctx, width, height, 'rgba(134, 112, 64, 1)', count);
      drawRect(ctx, width, height, {
        halfStepCount: 40,
        rectWidth: 46.67,
        gap: 10,
        sleep: 10,
        offset: count,
        lineWidth: 1,
        lineColor: 'rgba(132,112,64, .6)',
      });
      drawRect(ctx, width, height, {
        halfStepCount: 35,
        rectWidth: 23.3,
        gap: 3,
        sleep: 30,
        offset: count,
        lineWidth: 2,
        lineColor: 'rgba(132,112,64, 1)',
      });
      drawRotateRect(ctx, width, height, 200, 'rgb(134, 112, 64)', count);
      count++;
    }
    requestAnimationFrame(loadingAnimation);
  }
  useEffect(() => {
    requestAnimationFrame(loadingAnimation);
  });
  return (
    <div className={styles['loading-container']}>
      <canvas ref={cvsRef} width={132} height={70} />
    </div>
  );
}
