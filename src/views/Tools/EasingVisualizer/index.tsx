import { useEffect, useMemo, useRef, useState } from 'react';
import { App, Button } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { tween, tweenDotObjDemo } from 'Utils/tween';
import { EASING_GROUPS, EasingName, buildBezierCss, buildKeyframes, getCssOutput, getValueRange } from './utils';
import styles from './index.module.less';

const GRID_SIZE = 88;
const DETAIL_SIZE = 240;

interface CanvasPalette {
  curve: string;
  axis: string;
  grid: string;
  reference: string;
}

/** canvas 内颜色一律从 theme.less 令牌读取 */
function readPalette(): CanvasPalette {
  const css = getComputedStyle(document.documentElement);
  const get = (token: string, fallback: string) => css.getPropertyValue(token).trim() || fallback;
  return {
    curve: get('--tool-easing', '#c5eb84'),
    axis: get('--text-tertiary', '#788290'),
    grid: get('--border', 'rgba(232, 236, 241, 0.09)'),
    reference: get('--text-secondary', '#9aa7b4'),
  };
}

/** 适配 devicePixelRatio，返回已缩放的 ctx 与 CSS 尺寸 */
function setupCanvas(canvas: HTMLCanvasElement, size: number) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  ctx.scale(dpr, dpr);
  return ctx;
}

function drawCurve(ctx: CanvasRenderingContext2D, dots: number[], size: number, pad: number, palette: CanvasPalette) {
  const min = Math.min(...dots);
  const max = Math.max(...dots);
  const span = max - min || 1;
  const inner = size - pad * 2;
  const xOf = (i: number) => pad + (i / (dots.length - 1)) * inner;
  const yOf = (v: number) => pad + (1 - (v - min) / span) * inner;

  // 边框网格线
  ctx.strokeStyle = palette.grid;
  ctx.lineWidth = 1;
  ctx.strokeRect(pad - 0.5, pad - 0.5, inner + 1, inner + 1);

  ctx.beginPath();
  ctx.strokeStyle = palette.curve;
  ctx.lineWidth = 1.5;
  dots.forEach((v, i) => {
    if (i === 0) ctx.moveTo(xOf(i), yOf(v));
    else ctx.lineTo(xOf(i), yOf(v));
  });
  ctx.stroke();
}

function EasingVisualizerInner() {
  const { message } = App.useApp();
  const [selected, setSelected] = useState<EasingName>('easeInOutQuad');

  const gridRefs = useRef(new Map<EasingName, HTMLCanvasElement>());
  const detailCanvasRef = useRef<HTMLCanvasElement>(null);
  const ballRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // 网格：挂载后绘制一次，选中态由 className 表达，不重绘
  useEffect(() => {
    const palette = readPalette();
    for (const group of EASING_GROUPS) {
      for (const name of group.names) {
        const canvas = gridRefs.current.get(name);
        if (!canvas) continue;
        drawCurve(setupCanvas(canvas, GRID_SIZE), tweenDotObjDemo[name], GRID_SIZE, 6, palette);
      }
    }
  }, []);

  // 详情曲线：选中变化时重绘（坐标轴 + y=0/y=1 虚线参考线 + 值域自适应缩放）
  useEffect(() => {
    const canvas = detailCanvasRef.current;
    if (!canvas) return;
    const palette = readPalette();
    const ctx = setupCanvas(canvas, DETAIL_SIZE);
    const dots = tweenDotObjDemo[selected];
    const min = Math.min(...dots);
    const max = Math.max(...dots);
    const pad = 16;
    const inner = DETAIL_SIZE - pad * 2;
    const span = max - min || 1;
    const xOf = (i: number) => pad + (i / (dots.length - 1)) * inner;
    const yOf = (v: number) => pad + (1 - (v - min) / span) * inner;

    ctx.strokeStyle = palette.axis;
    ctx.lineWidth = 1;
    ctx.strokeRect(pad - 0.5, pad - 0.5, inner + 1, inner + 1);

    // y=0 / y=1 参考线（值域外时不绘制）
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = palette.reference;
    for (const ref of [0, 1]) {
      if (ref < min || ref > max) continue;
      ctx.beginPath();
      ctx.moveTo(pad, yOf(ref));
      ctx.lineTo(pad + inner, yOf(ref));
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.strokeStyle = palette.curve;
    ctx.lineWidth = 2;
    dots.forEach((v, i) => {
      if (i === 0) ctx.moveTo(xOf(i), yOf(v));
      else ctx.lineTo(xOf(i), yOf(v));
    });
    ctx.stroke();
  }, [selected]);

  // 动画预览：rAF 循环，小球位置直写 DOM（不经 React state）
  useEffect(() => {
    const fn = tween[selected as keyof typeof tween] as (pos: number) => number;
    const { min, max } = getValueRange(selected);
    const span = max - min;
    const DURATION = 1200;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const ball = ballRef.current;
      const track = trackRef.current;
      if (ball && track) {
        let p = ((now - start) % (DURATION * 2)) / DURATION;
        if (p > 1) p = 2 - p;
        const v = fn(p);
        const ratio = span === 0 ? 0.5 : (v - min) / span;
        const range = track.clientWidth - ball.clientWidth;
        ball.style.transform = `translateX(${ratio * range}px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [selected]);

  const cssOutput = useMemo(() => getCssOutput(selected), [selected]);
  const keyframesCode = useMemo(() => buildKeyframes(selected), [selected]);
  const bezierCode = cssOutput.kind === 'bezier' ? buildBezierCss(cssOutput.bezier) : null;

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    message.success('已复制到剪贴板');
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>缓动曲线</div>

      <div className={styles.grid}>
        {EASING_GROUPS.map((group) => (
          <div className={styles.family} key={group.family}>
            <div className={styles['family-name']}>{group.family}</div>
            <div className={styles.cards}>
              {group.names.map((name) => (
                <button
                  type="button"
                  key={name}
                  className={`${styles.card} ${name === selected ? styles['card-active'] : ''}`}
                  onClick={() => setSelected(name)}
                >
                  <canvas
                    ref={(el) => {
                      if (el) gridRefs.current.set(name, el);
                      else gridRefs.current.delete(name);
                    }}
                    style={{ width: GRID_SIZE, height: GRID_SIZE }}
                  />
                  <span className={styles['card-name']}>{name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.detail}>
        <div className={styles['detail-chart']}>
          <canvas ref={detailCanvasRef} style={{ width: DETAIL_SIZE, height: DETAIL_SIZE }} />
          <div className={styles['detail-name']}>{selected}</div>
        </div>

        <div className={styles['detail-side']}>
          <div className={styles['pane-title']}>动画预览</div>
          <div className={styles.track} ref={trackRef}>
            <div className={styles.ball} ref={ballRef} />
          </div>

          <div className={styles['pane-title']}>CSS 代码</div>
          {cssOutput.kind === 'bezier' ? (
            <div className={styles['code-block']}>
              <div className={styles['code-head']}>
                <span>cubic-bezier{cssOutput.source === 'fitted' ? '（拟合值）' : ''}</span>
                <Button size="small" icon={<CopyOutlined />} onClick={() => copy(bezierCode as string)}>
                  复制
                </Button>
              </div>
              <pre className={styles.code}>{bezierCode}</pre>
            </div>
          ) : (
            <div className={styles.hint}>
              {cssOutput.reason === 'out-of-range'
                ? '该曲线值域超出 [0,1]，cubic-bezier 无法表达，请使用 @keyframes'
                : '该曲线含多次回弹/跳变，单个 cubic-bezier 拟合误差过大，请使用 @keyframes'}
            </div>
          )}
          <div className={styles['code-block']}>
            <div className={styles['code-head']}>
              <span>@keyframes</span>
              <Button size="small" icon={<CopyOutlined />} onClick={() => copy(keyframesCode)}>
                复制
              </Button>
            </div>
            <pre className={styles.code}>{keyframesCode}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EasingVisualizer() {
  return (
    <App>
      <EasingVisualizerInner />
    </App>
  );
}
