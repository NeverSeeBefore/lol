/**
 * 时间戳转换核心：全部基于原生 Date + Intl，不引入日期库。
 * 秒/毫秒识别阈值：|n| < 1e12 判定为秒，>= 1e12 判定为毫秒
 * （1e12 秒 ≈ 公元 33658 年不具现实意义；1e12 毫秒 = 2001-09-09，覆盖全部现实毫秒时间戳）。
 */

export type Precision = 's' | 'ms';

/** Date 可表示范围：±8.64e15 毫秒（约 ±2.7 亿年） */
const MAX_ABS_MS = 8.64e15;

export interface TimestampParseOk {
  ok: true;
  /** 识别出的精度 */
  precision: Precision;
  /** 换算后的毫秒值，可直接 new Date(ms) */
  ms: number;
}

export interface TimestampParseFail {
  ok: false;
  reason: string;
}

export type TimestampParseResult = TimestampParseOk | TimestampParseFail;

/**
 * 解析用户输入的时间戳：要求整数字符串（允许负号与首尾空白），
 * 拒绝小数、科学计数法与非数字内容。
 */
export function parseTimestamp(input: string): TimestampParseResult {
  const text = input.trim();
  if (!text) return { ok: false, reason: '输入为空' };
  if (!/^-?\d+$/.test(text)) {
    return { ok: false, reason: `「${text}」不是整数时间戳：只允许数字，可带前导负号` };
  }
  const n = Number(text);
  if (!Number.isSafeInteger(n)) {
    return { ok: false, reason: `「${text}」超出安全整数范围，无法精确表示` };
  }
  const precision: Precision = Math.abs(n) < 1e12 ? 's' : 'ms';
  const ms = precision === 's' ? n * 1000 : n;
  if (Math.abs(ms) > MAX_ABS_MS || Number.isNaN(new Date(ms).getTime())) {
    return { ok: false, reason: '超出可表示的日期范围（±2.7 亿年）' };
  }
  return { ok: true, precision, ms };
}

/** 两位补零 */
function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * 把日期格式化为 `YYYY-MM-DD HH:mm:ss`。
 * timeZone 传 'UTC' 输出 UTC 时间；省略则输出本地时区时间。
 * 用 Intl.DateTimeFormat.formatToParts 取字段（年份手工补零到 4 位），
 * 不用 toLocaleString——其输出随 locale 变化，不稳定。
 */
export function formatDateTime(date: Date, timeZone?: 'UTC'): string {
  const dtf = new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
    minute: '2-digit',
    month: '2-digit',
    second: '2-digit',
    ...(timeZone ? { timeZone } : {}),
    year: 'numeric',
  });
  const parts = dtf.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  // hour12: false 下部分环境午夜给出 '24'，归一为 '00'
  const hour = get('hour') === '24' ? '00' : get('hour');
  const year = get('year').padStart(4, '0');
  return `${year}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`;
}

/** 当前时区的 UTC 偏移标注，如 UTC+8 / UTC-5:30 */
export function utcOffsetLabel(): string {
  // getTimezoneOffset 返回「UTC 减本地」的分钟数，符号与常规标注相反
  const offsetMin = -new Date().getTimezoneOffset();
  if (offsetMin === 0) return 'UTC';
  const sign = offsetMin > 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m === 0 ? `UTC${sign}${h}` : `UTC${sign}${h}:${pad2(m)}`;
}

export interface DateTimeParseOk {
  ok: true;
  date: Date;
}

export type DateTimeParseResult = DateTimeParseOk | TimestampParseFail;

const DATE_TIME_RE = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?$/;

/**
 * 解析本地日期时间字符串：YYYY-MM-DD HH:mm:ss（时间可省略，分隔符接受 - 或 /）。
 * 不用 new Date(string)——其行为随格式/浏览器有歧义（日期-only 按 UTC 解析）。
 * 构造后回读校验，拦截 2025-02-30 这类自动进位。
 */
export function parseDateTime(input: string): DateTimeParseResult {
  const text = input.trim();
  if (!text) return { ok: false, reason: '输入为空' };
  const m = DATE_TIME_RE.exec(text);
  if (!m) {
    return { ok: false, reason: `「${text}」格式无效：需要 YYYY-MM-DD HH:mm:ss（时间部分可省略）` };
  }
  const [, y, mo, d, h, mi, s] = m;
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  const hour = h === undefined ? 0 : Number(h);
  const minute = mi === undefined ? 0 : Number(mi);
  const second = s === undefined ? 0 : Number(s);
  if (month < 1 || month > 12) return { ok: false, reason: `月份需在 1–12 之间，当前为 ${month}` };
  if (day < 1 || day > 31) return { ok: false, reason: `日期需在 1–31 之间，当前为 ${day}` };
  if (hour > 23) return { ok: false, reason: `小时需在 0–23 之间，当前为 ${hour}` };
  if (minute > 59) return { ok: false, reason: `分钟需在 0–59 之间，当前为 ${minute}` };
  if (second > 59) return { ok: false, reason: `秒需在 0–59 之间，当前为 ${second}` };
  const date = new Date(year, month - 1, day, hour, minute, second);
  // 回读校验：拦截 2 月 30 日等自动进位
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { ok: false, reason: `${year}-${month}-${day} 不是真实存在的日期` };
  }
  return { ok: true, date };
}

export interface BatchResult {
  /** 替换后的文本 */
  text: string;
  /** 替换次数 */
  count: number;
}

/**
 * 批量模式：就地替换文本中的时间戳为本地可读时间。
 * 匹配 13 位（毫秒）与 10 位（秒）纯数字串；前后负向断言排除更长数字串与小数。
 * 值域天然落在 2001–2286 年；单条 Invalid Date 时保留原文。
 */
export function batchReplace(input: string): BatchResult {
  let count = 0;
  const text = input.replace(/(?<![\d.])(\d{13}|\d{10})(?![\d.])/g, (raw) => {
    const parsed = parseTimestamp(raw);
    if (!parsed.ok) return raw;
    count += 1;
    return formatDateTime(new Date(parsed.ms));
  });
  return { count, text };
}
