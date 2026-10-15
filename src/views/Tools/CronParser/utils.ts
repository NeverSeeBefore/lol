import { CronExpressionParser } from 'cron-parser';

/**
 * Cron 表达式解析纯函数模块。
 * 校验/分解/中文描述自实现（段级中文报错），未来执行时间交 cron-parser 计算。
 * 方言边界见 openspec/changes/add-cron-parser-tool/design.md。
 */

// ---------- 段定义 ----------

type FieldKey = 'second' | 'minute' | 'hour' | 'dayOfMonth' | 'month' | 'dayOfWeek';

interface FieldSpec {
  key: FieldKey;
  label: string;
  min: number;
  max: number;
  names?: Record<string, number>;
  /** `?` 视同 `*`（仅限日/周） */
  allowQuestion?: boolean;
}

const MONTH_NAMES: Record<string, number> = {
  JAN: 1,
  FEB: 2,
  MAR: 3,
  APR: 4,
  MAY: 5,
  JUN: 6,
  JUL: 7,
  AUG: 8,
  SEP: 9,
  OCT: 10,
  NOV: 11,
  DEC: 12,
};

const DOW_NAMES: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

const SPECS_5: FieldSpec[] = [
  { key: 'minute', label: '分', min: 0, max: 59 },
  { key: 'hour', label: '时', min: 0, max: 23 },
  { key: 'dayOfMonth', label: '日', min: 1, max: 31, allowQuestion: true },
  { key: 'month', label: '月', min: 1, max: 12, names: MONTH_NAMES },
  { key: 'dayOfWeek', label: '周', min: 0, max: 7, names: DOW_NAMES, allowQuestion: true },
];

const SECOND_SPEC: FieldSpec = { key: 'second', label: '秒', min: 0, max: 59 };

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

// ---------- 宏 ----------

const MACROS: Record<string, string> = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@midnight': '0 0 * * *',
  '@hourly': '0 * * * *',
};

// ---------- 类型 ----------

export interface FieldBreakdown {
  /** 段序号（从 1 开始） */
  index: number;
  /** 段名：秒/分/时/日/月/周 */
  label: string;
  /** 用户输入原文 */
  raw: string;
  /** 中文含义 */
  meaning: string;
  /** 取值集合（压缩展示） */
  values: string;
}

export type ParseOutcome =
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | {
      status: 'ok';
      /** 宏展开、`?`→`*` 后的表达式，供 cron-parser 使用 */
      normalized: string;
      description: string;
      hasSeconds: boolean;
      fields: FieldBreakdown[];
    };

interface ParsedField {
  /** 升序去重后的取值集合（周日已归一为 0） */
  values: number[];
  /** 是否为 `*` / `?`（不限制） */
  isWildcard: boolean;
}

// ---------- 逐段解析 ----------

type FieldResult = { ok: true; field: ParsedField } | { ok: false; reason: string };

function rangeValues(a: number, b: number): number[] {
  const out: number[] = [];
  for (let v = a; v <= b; v++) out.push(v);
  return out;
}

/** 把 token 解析为数值（数字或名字）；null 表示不是合法 token */
function resolveToken(token: string, spec: FieldSpec): number | null {
  if (/^\d+$/.test(token)) return Number(token);
  const upper = token.toUpperCase();
  if (spec.names && upper in spec.names) return spec.names[upper];
  return null;
}

function parseField(raw: string, spec: FieldSpec): FieldResult {
  // 通配取值集合：周字段归一后为 0-6（7 仅作输入等价物）
  const wildMax = spec.key === 'dayOfWeek' ? 6 : spec.max;
  if (raw === '?') {
    if (!spec.allowQuestion) return { ok: false, reason: `'?' 仅限日/周字段使用` };
    return { ok: true, field: { values: rangeValues(spec.min, wildMax), isWildcard: true } };
  }

  // Quartz 扩展检测：先剔除合法名字（如 WED 含 W），再看是否残留 L/W/#
  {
    let rest = raw.toUpperCase();
    for (const name of Object.keys(spec.names ?? {})) rest = rest.split(name).join('');
    if (rest.includes('#')) return { ok: false, reason: `Quartz 扩展语法 '#' 暂不支持` };
    if (/[LW]/.test(rest)) {
      const ch = rest.includes('L') ? 'L' : 'W';
      return { ok: false, reason: `Quartz 扩展语法 '${ch}' 暂不支持` };
    }
  }

  if (raw === '*') {
    return { ok: true, field: { values: rangeValues(spec.min, wildMax), isWildcard: true } };
  }

  const valueSet = new Set<number>();
  for (const part of raw.split(',')) {
    if (part === '') return { ok: false, reason: `无法解析 '${raw}'（存在空项）` };

    // 步长
    let base = part;
    let step = 1;
    const slashIdx = part.indexOf('/');
    if (slashIdx !== -1) {
      base = part.slice(0, slashIdx);
      const stepRaw = part.slice(slashIdx + 1);
      if (!/^\d+$/.test(stepRaw) || Number(stepRaw) === 0) {
        return { ok: false, reason: `'${part}' 的步长必须为正整数` };
      }
      step = Number(stepRaw);
      if (base === '') return { ok: false, reason: `无法解析 '${part}'` };
    }

    // 区间或单值
    let lo: number;
    let hi: number;
    if (base === '*') {
      lo = spec.min;
      hi = spec.max;
    } else if (base.includes('-')) {
      const dashIdx = base.indexOf('-');
      const loRaw = base.slice(0, dashIdx);
      const hiRaw = base.slice(dashIdx + 1);
      const loVal = resolveToken(loRaw, spec);
      const hiVal = resolveToken(hiRaw, spec);
      if (loVal === null) return { ok: false, reason: `无法解析 '${loRaw}'` };
      if (hiVal === null) return { ok: false, reason: `无法解析 '${hiRaw}'` };
      if (loVal < spec.min || loVal > spec.max) {
        return { ok: false, reason: `取值 ${loVal} 超出 ${spec.min}-${spec.max}` };
      }
      if (hiVal < spec.min || hiVal > spec.max) {
        return { ok: false, reason: `取值 ${hiVal} 超出 ${spec.min}-${spec.max}` };
      }
      if (loVal > hiVal) {
        return { ok: false, reason: `区间 ${loVal}-${hiVal} 起点大于终点` };
      }
      lo = loVal;
      hi = hiVal;
    } else {
      const v = resolveToken(base, spec);
      if (v === null) return { ok: false, reason: `无法解析 '${base}'` };
      if (v < spec.min || v > spec.max) {
        return { ok: false, reason: `取值 ${v} 超出 ${spec.min}-${spec.max}` };
      }
      lo = v;
      // a/n 等价 a-max/n；无步长时是单值
      hi = slashIdx !== -1 ? spec.max : v;
    }

    for (let v = lo; v <= hi; v += step) valueSet.add(v);
  }

  // 周日 7 归一为 0
  const normalized = [...valueSet].map((v) => (spec.key === 'dayOfWeek' && v === 7 ? 0 : v));
  const values = [...new Set(normalized)].sort((a, b) => a - b);
  return { ok: true, field: { values, isWildcard: false } };
}

// ---------- 取值集合压缩展示 ----------

export function compressValues(values: number[], min: number, max: number): string {
  if (values.length === max - min + 1) return `全部（${min}-${max}）`;
  const runs: string[] = [];
  let i = 0;
  while (i < values.length) {
    let j = i;
    while (j + 1 < values.length && values[j + 1] === values[j] + 1) j++;
    runs.push(i === j ? String(values[i]) : `${values[i]}-${values[j]}`);
    i = j + 1;
  }
  const text = runs.join(', ');
  if (text.length > 60) {
    return `${runs.slice(0, 5).join(', ')}, …（共 ${values.length} 个值）`;
  }
  return text;
}

// ---------- 字段含义 ----------

function isWorkdays(values: number[]): boolean {
  return values.length === 5 && values.every((v, i) => v === i + 1);
}

function dowMeaning(values: number[]): string {
  if (isWorkdays(values)) return '工作日（周一至周五）';
  if (values.length === 1) return `每${WEEKDAY_LABELS[values[0]]}`;
  return `每${values.map((v) => WEEKDAY_LABELS[v]).join('、')}`;
}

function fieldMeaning(spec: FieldSpec, raw: string, parsed: ParsedField): string {
  const { values, isWildcard } = parsed;
  switch (spec.key) {
    case 'second':
      if (isWildcard) return '每秒';
      if (raw.startsWith('*/')) return `每 ${raw.slice(2)} 秒`;
      if (values.length === 1) return `第 ${values[0]} 秒`;
      return `第 ${values.join('、')} 秒`;
    case 'minute':
      if (isWildcard) return '每分钟';
      if (raw.startsWith('*/')) return `每 ${raw.slice(2)} 分钟`;
      if (values.length === 1) return `第 ${values[0]} 分`;
      return `第 ${values.join('、')} 分`;
    case 'hour':
      if (isWildcard) return '每小时';
      if (values.length === 1) return `${values[0]} 点`;
      return `${compressValues(values, spec.min, spec.max)} 点`;
    case 'dayOfMonth':
      if (isWildcard) return '每天（不限制日）';
      if (values.length === 1) return `每月 ${values[0]} 号`;
      return `每月 ${values.join('、')} 号`;
    case 'month':
      if (isWildcard) return '每月（不限制月）';
      if (values.length === 1) return `${values[0]} 月`;
      return `${values.join(' 月、')} 月`;
    case 'dayOfWeek':
      if (isWildcard) return '不限制星期';
      return dowMeaning(values);
  }
}

// ---------- 中文描述 ----------

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

interface DescribeInput {
  hasSeconds: boolean;
  second?: ParsedField;
  minute: ParsedField;
  minuteRaw: string;
  hour: ParsedField;
  dayOfMonth: ParsedField;
  month: ParsedField;
  dayOfWeek: ParsedField;
}

function describeCron(input: DescribeInput): string {
  const { minute, minuteRaw, hour, dayOfMonth, month, dayOfWeek } = input;
  const domWild = dayOfMonth.isWildcard;
  const monthWild = month.isWildcard;
  const dowWild = dayOfWeek.isWildcard;

  // 日期限定语（空前缀表示「每天」）
  let datePrefix = '';
  if (!monthWild || !domWild || !dowWild) {
    const monthPart = monthWild
      ? ''
      : month.values.length === 1
        ? `${month.values[0]} 月`
        : `${month.values.join(' 月、')} 月`;
    const domNums = dayOfMonth.values.join('、');
    const domPart = domWild ? '' : monthWild ? `每月 ${domNums} 号` : `${domNums} 号`;
    const dowPart = dowWild ? '' : dowMeaning(dayOfWeek.values);
    // 日+周同时限制时按标准 cron OR 语义触发，描述必须体现「或」
    const domDowPart = domPart && dowPart ? `${domPart}或${dowPart}` : domPart || dowPart;
    const monthText = monthPart && !domDowPart ? `每年 ${monthPart}` : monthPart;
    datePrefix = [monthText, domDowPart].filter(Boolean).join(' ');
  }

  // 时间部分
  const m = minute.values.length === 1 ? minute.values[0] : null;
  const h = hour.values.length === 1 ? hour.values[0] : null;
  let body: string;
  if (minute.isWildcard && hour.isWildcard) {
    body = datePrefix ? `${datePrefix}的每分钟执行` : '每分钟执行';
  } else if (minuteRaw.startsWith('*/') && hour.isWildcard) {
    body = datePrefix ? `${datePrefix}的每 ${minuteRaw.slice(2)} 分钟执行` : `每 ${minuteRaw.slice(2)} 分钟执行`;
  } else if (hour.isWildcard) {
    const minutePart = m !== null ? `第 ${m} 分` : `第 ${minute.values.join('、')} 分`;
    body = datePrefix ? `${datePrefix}的每小时${minutePart}执行` : `每小时的${minutePart}执行`;
  } else if (m !== null && h !== null) {
    const t = `${h}:${pad2(m)}`;
    body = datePrefix ? `${datePrefix} ${t} 执行` : `每天 ${t} 执行`;
  } else if (m !== null && hour.values.length <= 6) {
    const times = hour.values.map((hv) => `${hv}:${pad2(m)}`).join('、');
    body = datePrefix ? `${datePrefix} ${times} 执行` : `每天 ${times} 执行`;
  } else if (m !== null) {
    const hd = compressValues(hour.values, 0, 23);
    body = datePrefix ? `${datePrefix}的 ${hd} 点第 ${m} 分执行` : `每天 ${hd} 点第 ${m} 分执行`;
  } else {
    // 兜底：分多值 + 时限定（时通配的情况已被上方 hour.isWildcard 分支覆盖）
    const hd = compressValues(hour.values, 0, 23);
    const base = datePrefix ? `${datePrefix}的` : '每天';
    body = `${base} ${hd} 点第 ${minute.values.join('、')} 分执行`;
  }

  // 秒前缀（6 段）
  if (input.hasSeconds && input.second && !input.second.isWildcard) {
    const sec = input.second.values;
    const secText = sec.length === 1 ? `第 ${sec[0]} 秒` : `第 ${sec.join('、')} 秒`;
    return `${secText} · ${body}`;
  }
  return body;
}

// ---------- 时间格式化 ----------

export function formatDateTime(d: Date): string {
  const date = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  return `${date} ${time} ${WEEKDAY_LABELS[d.getDay()]}`;
}

export function gmtOffsetLabel(): string {
  const offsetMin = -new Date().getTimezoneOffset();
  const sign = offsetMin >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  return m === 0 ? `GMT${sign}${h}` : `GMT${sign}${h}:${pad2(m)}`;
}

// ---------- 未来执行时间 ----------

export function getNextExecutions(normalized: string, count: number): string[] {
  const it = CronExpressionParser.parse(normalized);
  return it.take(count).map((d) => formatDateTime(d.toDate()));
}

// ---------- 主入口 ----------

export function parseCron(input: string): ParseOutcome {
  const trimmed = input.trim();
  if (!trimmed) return { status: 'empty' };

  // 宏
  let expr = trimmed;
  if (trimmed.startsWith('@')) {
    const macro = trimmed.toLowerCase();
    if (macro === '@reboot') {
      return { status: 'error', message: '@reboot 表示重启时执行，无法用时间表达，本工具不支持' };
    }
    const expanded = MACROS[macro];
    if (!expanded) {
      return { status: 'error', message: `未知宏 '${trimmed}'，支持 ${Object.keys(MACROS).join(' ')}` };
    }
    expr = expanded;
  }

  const segments = expr.split(/\s+/);
  let specs: FieldSpec[];
  let hasSeconds = false;
  if (segments.length === 5) {
    specs = SPECS_5;
  } else if (segments.length === 6) {
    specs = [SECOND_SPEC, ...SPECS_5];
    hasSeconds = true;
  } else {
    return {
      status: 'error',
      message: `需要 5 段（分 时 日 月 周）或 6 段（带秒），当前 ${segments.length} 段`,
    };
  }

  const parsedList: ParsedField[] = [];
  const fields: FieldBreakdown[] = [];
  const normalizedParts: string[] = [];
  for (let i = 0; i < specs.length; i++) {
    const spec = specs[i];
    const raw = segments[i];
    const result = parseField(raw, spec);
    if (!result.ok) {
      return { status: 'error', message: `第 ${i + 1} 段「${spec.label}」：${result.reason}` };
    }
    parsedList.push(result.field);
    // 用归一后的取值集合重建喂给 cron-parser 的表达式：
    // 原始 raw 可能含重复值（0,7）、名字、7=周日等，cron-parser 对重复值抛英文异常，
    // 归一重建保证「我校验过什么，就执行什么」
    normalizedParts.push(result.field.isWildcard ? '*' : result.field.values.join(','));
    fields.push({
      index: i + 1,
      label: spec.label,
      raw,
      meaning: fieldMeaning(spec, raw, result.field),
      // 周字段归一后取值域为 0-6
      values: compressValues(result.field.values, spec.min, spec.key === 'dayOfWeek' ? 6 : spec.max),
    });
  }

  const offset = hasSeconds ? 1 : 0;

  // 限定月与日集合无交集 → 永不触发（如 2 月 30 号、4/6 月 31 号）；
  // 不拦截的话 cron-parser 会抛英文异常或 take() 静默产出空序列
  const domField = parsedList[offset + 2];
  const monthField = parsedList[offset + 3];
  if (!domField.isWildcard && !monthField.isWildcard) {
    // 各月最大天数，2 月按闰年 29 计（29 号在闰年可触发，不误伤）
    const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const possible = domField.values.some((d) => monthField.values.some((mo) => d <= DAYS_IN_MONTH[mo - 1]));
    if (!possible) {
      return {
        status: 'error',
        message:
          `该表达式永不触发：第 ${offset + 3} 段「日」的取值（${domField.values.join('、')} 号）` +
          `在第 ${offset + 4} 段「月」限定的月份（${monthField.values.join('、')} 月）中不存在`,
      };
    }
  }

  const description = describeCron({
    hasSeconds,
    second: hasSeconds ? parsedList[0] : undefined,
    minute: parsedList[offset],
    minuteRaw: segments[offset],
    hour: parsedList[offset + 1],
    dayOfMonth: parsedList[offset + 2],
    month: parsedList[offset + 3],
    dayOfWeek: parsedList[offset + 4],
  });

  return {
    status: 'ok',
    normalized: normalizedParts.join(' '),
    description,
    hasSeconds,
    fields,
  };
}
