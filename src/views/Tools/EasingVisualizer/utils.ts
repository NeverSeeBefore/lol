import { tween, tweenDotObjDemo } from 'Utils/tween';

export type EasingName = keyof typeof tweenDotObjDemo;

/** 族分组：覆盖 tweenDotObjDemo 全部 45 条 */
export const EASING_GROUPS: { family: string; names: EasingName[] }[] = [
  { family: 'Quad', names: ['easeInQuad', 'easeOutQuad', 'easeInOutQuad'] },
  { family: 'Cubic', names: ['easeInCubic', 'easeOutCubic', 'easeInOutCubic'] },
  { family: 'Quart', names: ['easeInQuart', 'easeOutQuart', 'easeInOutQuart'] },
  { family: 'Quint', names: ['easeInQuint', 'easeOutQuint', 'easeInOutQuint'] },
  { family: 'Sine', names: ['easeInSine', 'easeOutSine', 'easeInOutSine'] },
  { family: 'Expo', names: ['easeInExpo', 'easeOutExpo', 'easeInOutExpo'] },
  { family: 'Circ', names: ['easeInCirc', 'easeOutCirc', 'easeInOutCirc'] },
  { family: 'Back', names: ['easeInBack', 'easeOutBack', 'easeInOutBack'] },
  { family: 'Elastic', names: ['elastic', 'spring'] },
  { family: 'Bounce', names: ['easeOutBounce', 'bounce', 'bouncePast'] },
  {
    family: 'Other',
    names: [
      'swingFromTo',
      'swingFrom',
      'swingTo',
      'easeFromTo',
      'easeFrom',
      'easeTo',
      'linear',
      'sinusoidal',
      'reverse',
      'mirror',
      'flicker',
      'wobble',
      'pulse',
      'blink',
      'none',
      'full',
    ],
  },
];

/** 经典 21 条的公认 cubic-bezier 拟合值（与 easings.net 一致） */
const KNOWN_BEZIER: Partial<Record<EasingName, [number, number, number, number]>> = {
  easeInQuad: [0.11, 0, 0.5, 0],
  easeOutQuad: [0.5, 1, 0.89, 1],
  easeInOutQuad: [0.45, 0, 0.55, 1],
  easeInCubic: [0.32, 0, 0.67, 0],
  easeOutCubic: [0.33, 1, 0.68, 1],
  easeInOutCubic: [0.65, 0, 0.35, 1],
  easeInQuart: [0.5, 0, 0.75, 0],
  easeOutQuart: [0.25, 1, 0.5, 1],
  easeInOutQuart: [0.76, 0, 0.24, 1],
  easeInQuint: [0.64, 0, 0.78, 0],
  easeOutQuint: [0.22, 1, 0.36, 1],
  easeInOutQuint: [0.83, 0, 0.17, 1],
  easeInSine: [0.12, 0, 0.39, 0],
  easeOutSine: [0.61, 1, 0.88, 1],
  easeInOutSine: [0.37, 0, 0.63, 1],
  easeInExpo: [0.7, 0, 0.84, 0],
  easeOutExpo: [0.16, 1, 0.3, 1],
  easeInOutExpo: [0.87, 0, 0.13, 1],
  easeInCirc: [0.55, 0, 1, 0.45],
  easeOutCirc: [0, 0.55, 0.45, 1],
  easeInOutCirc: [0.85, 0, 0.15, 1],
};

export interface ValueRange {
  min: number;
  max: number;
}

/** 值域分析：1001 点采样（比 tweenDotObjDemo 更密，捕捉极值） */
export function getValueRange(name: EasingName): ValueRange {
  const fn = tween[name as keyof typeof tween] as (pos: number) => number;
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i <= 1000; i++) {
    const v = fn(i / 1000);
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}

/** cubic-bezier 的 y(t)（x(t) 同构，参数换 x1/x2） */
function bezierCoord(t: number, p1: number, p2: number): number {
  const u = 1 - t;
  return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t;
}

/** Newton 反解 t，使 x(t) ≈ x */
function solveT(x: number, x1: number, x2: number, tGuess: number): number {
  let t = tGuess;
  for (let i = 0; i < 10; i++) {
    const u = 1 - t;
    const xt = 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t;
    const dx = 3 * u * u * x1 + 6 * u * t * (x2 - x1) + 3 * t * t * (1 - x2);
    const err = xt - x;
    if (Math.abs(err) < 1e-9 || Math.abs(dx) < 1e-9) break;
    t = Math.min(1, Math.max(0, t - err / dx));
  }
  return t;
}

const SAMPLES = 101;

/** 拟合误差平方和（y 方向） */
function fitError(fn: (pos: number) => number, p: [number, number, number, number]): number {
  let sum = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const x = i / (SAMPLES - 1);
    const t = solveT(x, p[0], p[2], x);
    const e = bezierCoord(t, p[1], p[3]) - fn(x);
    sum += e * e;
  }
  return sum;
}

/** 拟合最大误差 */
function fitMaxError(fn: (pos: number) => number, p: [number, number, number, number]): number {
  let max = 0;
  for (let i = 0; i < SAMPLES; i++) {
    const x = i / (SAMPLES - 1);
    const t = solveT(x, p[0], p[2], x);
    max = Math.max(max, Math.abs(bezierCoord(t, p[1], p[3]) - fn(x)));
  }
  return max;
}

/** 坐标下降最小二乘拟合：初值取 CSS ease，x1/x2 钳制 [0,1] */
export function fitCubicBezier(fn: (pos: number) => number): {
  bezier: [number, number, number, number];
  maxError: number;
} {
  let p: [number, number, number, number] = [0.42, 0, 0.58, 1];
  let best = fitError(fn, p);
  for (const step of [0.4, 0.2, 0.1, 0.05, 0.02, 0.01, 0.005]) {
    let improved = true;
    let guard = 0;
    while (improved && guard++ < 30) {
      improved = false;
      for (let i = 0; i < 4; i++) {
        for (const dir of [1, -1]) {
          const q = p.slice() as [number, number, number, number];
          q[i] += dir * step;
          if ((i === 0 || i === 2) && (q[i] < 0 || q[i] > 1)) continue;
          const s = fitError(fn, q);
          if (s < best - 1e-12) {
            best = s;
            p = q;
            improved = true;
          }
        }
      }
    }
  }
  return { bezier: p, maxError: fitMaxError(fn, p) };
}

/** 拟合接受阈值：最大误差超过此值即降级 keyframes */
export const FIT_TOLERANCE = 0.03;

export type CssOutput =
  | { kind: 'bezier'; bezier: [number, number, number, number]; source: 'known' | 'fitted' }
  | { kind: 'keyframes-only'; reason: 'out-of-range' | 'poor-fit' };

const round2 = (v: number) => Math.round(v * 100) / 100;

/** 决定某条曲线的 CSS 输出形态：cubic-bezier（查表/拟合）或仅 keyframes */
export function getCssOutput(name: EasingName): CssOutput {
  const range = getValueRange(name);
  const known = KNOWN_BEZIER[name];
  if (known && range.min >= 0 && range.max <= 1) {
    return { kind: 'bezier', bezier: known, source: 'known' };
  }
  if (range.min < 0 || range.max > 1) {
    return { kind: 'keyframes-only', reason: 'out-of-range' };
  }
  const fn = tween[name as keyof typeof tween] as (pos: number) => number;
  const { bezier, maxError } = fitCubicBezier(fn);
  if (maxError <= FIT_TOLERANCE) {
    return {
      kind: 'bezier',
      bezier: [round2(bezier[0]), round2(bezier[1]), round2(bezier[2]), round2(bezier[3])],
      source: 'fitted',
    };
  }
  return { kind: 'keyframes-only', reason: 'poor-fit' };
}

export function formatBezier(b: [number, number, number, number]): string {
  return `cubic-bezier(${b.join(', ')})`;
}

/** 生成 @keyframes 代码：11 帧 translateX 百分比 */
export function buildKeyframes(name: EasingName): string {
  const fn = tween[name as keyof typeof tween] as (pos: number) => number;
  const frames: string[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const v = Math.round(fn(t) * 1000) / 10;
    frames.push(`  ${i * 10}% { transform: translateX(${v}%); }`);
  }
  return [
    `@keyframes ${name} {`,
    ...frames,
    '}',
    '',
    `.animated {`,
    `  animation: ${name} 1.2s infinite alternate;`,
    `}`,
  ].join('\n');
}

/** 生成 cubic-bezier 使用代码 */
export function buildBezierCss(bezier: [number, number, number, number]): string {
  return [`.animated {`, `  transition-timing-function: ${formatBezier(bezier)};`, `}`].join('\n');
}
