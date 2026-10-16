export function parsePixelColor(hex: string): [number, number, number, number] {
  const digits = hex.slice(1);
  const expanded = digits.length <= 4 ? [...digits].map((digit) => digit + digit).join('') : digits;
  const withAlpha = expanded.length === 6 ? `${expanded}ff` : expanded;
  return [
    Number.parseInt(withAlpha.slice(0, 2), 16),
    Number.parseInt(withAlpha.slice(2, 4), 16),
    Number.parseInt(withAlpha.slice(4, 6), 16),
    Number.parseInt(withAlpha.slice(6, 8), 16) / 255,
  ];
}

export function mixPixelColor(from: number[], to: number[], progress: number) {
  const channel = (index: number) => Math.round(from[index] + (to[index] - from[index]) * progress);
  const alpha = Math.round((from[3] + (to[3] - from[3]) * progress) * 1000) / 1000;
  return `rgba(${channel(0)}, ${channel(1)}, ${channel(2)}, ${alpha})`;
}

export function mixPixelChannels(from: number[], to: number[], progress: number): [number, number, number, number] {
  return [0, 1, 2, 3].map((index) => from[index] + (to[index] - from[index]) * progress) as [
    number,
    number,
    number,
    number,
  ];
}

export function interpolatePixelColor(from: string, to: string, progress: number) {
  return mixPixelColor(parsePixelColor(from), parsePixelColor(to), Math.min(1, Math.max(0, progress)));
}

export type PixelBezier = readonly [number, number, number, number];

export function cubicBezierAt(progress: number, easing: PixelBezier) {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;
  const [x1, y1, x2, y2] = easing;
  const sample = (a: number, b: number, t: number) => {
    const remainder = 1 - t;
    return 3 * remainder * remainder * t * a + 3 * remainder * t * t * b + t * t * t;
  };
  let low = 0;
  let high = 1;
  for (let iteration = 0; iteration < 14; iteration += 1) {
    const middle = (low + high) / 2;
    if (sample(x1, x2, middle) < progress) low = middle;
    else high = middle;
  }
  return sample(y1, y2, (low + high) / 2);
}

export function getCellTransitionProgress(
  elapsedMs: number,
  frameDurationMs: number,
  transitionMs: number,
  cellIndex: number,
  columns: number,
  easing: PixelBezier = [0.25, 0.1, 0.25, 1],
) {
  const duration = Math.max(0, transitionMs);
  if (duration === 0) return 1;
  const column = cellIndex % columns;
  const row = Math.floor(cellIndex / columns);
  const stagger = ((column + row * 2) % 12) / 11;
  const delay = Math.min(frameDurationMs / 4, duration / 4) * stagger;
  const progress = Math.min(1, Math.max(0, (elapsedMs - delay) / duration));
  return cubicBezierAt(progress, easing);
}
