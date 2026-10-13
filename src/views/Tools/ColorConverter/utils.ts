import colorConvert from 'Utils/colorConvert';

/**
 * 颜色转换工具适配层：
 * 统一内部表示为 Rgba（r/g/b 0-255，a 0-1），
 * 封装 Utils/colorConvert 接口风格不统一（数组/字符串混杂）、无 alpha 的问题。
 * 只用 CC 系列（度/百分比风格）与自实现 HEX 解析，不改动公共 utils 签名。
 */
export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export type Rgb = [number, number, number];

// ---------- 格式化 ----------

/** #A78BFA（六位大写，忽略 alpha） */
export function formatHex({ r, g, b }: Rgba): string {
  return `#${colorConvert.rgbCChex([r, g, b])}`;
}

export function formatRgb({ r, g, b }: Rgba): string {
  return `rgb(${r}, ${g}, ${b})`;
}

export function formatHsl({ r, g, b }: Rgba): string {
  const [h, s, l] = colorConvert.rgbCChsl([r, g, b]);
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

export function formatHsv({ r, g, b }: Rgba): string {
  const [h, s, v] = colorConvert.rgbCChsv([r, g, b]);
  return `hsv(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(v)}%)`;
}

// ---------- 解析（失败一律返回 null） ----------

/** #RGB / #RRGGBB，`#` 可省略 */
export function parseHex(input: string): Rgb | null {
  const str = input.trim().replace(/^#/, '');
  if (!/^([\da-f]{3}|[\da-f]{6})$/i.test(str)) return null;
  const full = str.length === 3 ? [...str].map((d) => d + d).join('') : str;
  return [
    Number.parseInt(full.slice(0, 2), 16),
    Number.parseInt(full.slice(2, 4), 16),
    Number.parseInt(full.slice(4, 6), 16),
  ];
}

/** 提取函数写法或纯逗号分隔的三个数值，如 `rgb(1, 2, 3)` / `1, 2, 3` */
function extractTriple(input: string, fnName: string): string[] | null {
  const str = input.trim();
  const pattern = new RegExp(`^${fnName}\\((.*)\\)$`, 'i');
  const body = pattern.test(str) ? str.replace(pattern, '$1') : str;
  const parts = body.split(',').map((p) => p.trim());
  return parts.length === 3 ? parts : null;
}

/** `rgb(255, 0, 0)` / `255, 0, 0`，分量 0-255 整数 */
export function parseRgb(input: string): Rgb | null {
  const parts = extractTriple(input, 'rgb');
  if (!parts) return null;
  const nums = parts.map((p) => (/^\d+$/.test(p) ? Number(p) : Number.NaN));
  if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return nums as Rgb;
}

/** 解析 `hsl(...)`/`hsv(...)` 三元组：h 0-360，s/l/v 0-100（% 可省略） */
function parseHslLike(input: string, fnName: 'hsl' | 'hsv'): Rgb | null {
  const parts = extractTriple(input, fnName);
  if (!parts) return null;
  const nums = parts.map((p) => {
    const bare = p.replace(/%$/, '');
    return /^\d+(\.\d+)?$/.test(bare) ? Number(bare) : Number.NaN;
  });
  const [h, s, third] = nums;
  if (Number.isNaN(h) || h < 0 || h > 360) return null;
  if ([s, third].some((n) => Number.isNaN(n) || n < 0 || n > 100)) return null;
  return fnName === 'hsl'
    ? (colorConvert.hslCCrgb([h, s, third]) as Rgb)
    : (colorConvert.hsvCCrgb([h, s, third]) as Rgb);
}

/** `hsl(255, 91%, 77%)` / `255, 91%, 77%` / `255, 91, 77` */
export function parseHsl(input: string): Rgb | null {
  return parseHslLike(input, 'hsl');
}

/** `hsv(255, 91%, 100%)` / `255, 91, 100` */
export function parseHsv(input: string): Rgb | null {
  return parseHslLike(input, 'hsv');
}

// ---------- WCAG 对比度 ----------

/** WCAG 2.x 相对亮度：https://www.w3.org/TR/WCAG21/#dfn-relative-luminance */
export function relativeLuminance([r, g, b]: Rgb): number {
  const linear = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

/** alpha < 1 时先与底色做 source-over 合成 */
export function compositeOver({ r, g, b, a }: Rgba, [br, bg, bb]: Rgb): Rgb {
  const mix = (fg: number, bgChannel: number) => Math.round(fg * a + bgChannel * (1 - a));
  return [mix(r, br), mix(g, bg), mix(b, bb)];
}

/** 对比度比值（1–21），前景 MUST 先合成（compositeOver）再传入 */
export function contrastRatio(foreground: Rgb, background: Rgb): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const [light, dark] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (light + 0.05) / (dark + 0.05);
}

export type ContrastLevel = 'AAA' | 'AA' | 'AA_LARGE' | 'FAIL';

export function contrastLevel(ratio: number): ContrastLevel {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA_LARGE';
  return 'FAIL';
}
