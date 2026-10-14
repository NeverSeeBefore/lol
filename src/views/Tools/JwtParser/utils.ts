/**
 * JWT 本地解析纯函数层（无新增依赖，仅用原生 API）。
 * 只做 split('.') + base64url 解码 + JSON.parse，不验签——解析成功不代表 token 可信。
 */

export type SegmentResult = { ok: true; json: string; data: unknown } | { ok: false; error: string };

export type ParseJwtResult =
  { ok: false; error: string } | { ok: true; header: SegmentResult; payload: SegmentResult; signature: string };

/**
 * base64url → UTF-8 文本：`-`→`+`、`_`→`/` 归一，自动补 padding，
 * atob → 字节 → TextDecoder fatal 模式校验。
 */
function decodeBase64Url(segment: string): { ok: true; text: string } | { ok: false; error: string } {
  const cleaned = segment.replace(/-/g, '+').replace(/_/g, '/');

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    return { ok: false, error: '不是合法 base64url：含非法字符（合法字符为 A-Z a-z 0-9 - _）' };
  }

  const rest = cleaned.replace(/=+$/, '');
  if (rest.length % 4 === 1) {
    return { ok: false, error: `不是合法 base64url：有效长度 ${rest.length} 位，mod 4 余 1 不可能对应任何字节序列` };
  }
  const padded = rest + '='.repeat((4 - (rest.length % 4)) % 4);

  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    return { ok: false, error: '不是合法 base64url：atob 拒绝解码' };
  }

  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  try {
    return { ok: true, text: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, error: 'base64url 本身合法，但解码出的字节序列不是合法 UTF-8 文本' };
  }
}

/** 单段解析：base64url 解码 → JSON.parse → 缩进格式化 */
function parseSegment(segment: string): SegmentResult {
  const decoded = decodeBase64Url(segment);
  if (!decoded.ok) return { ok: false, error: decoded.error };
  try {
    const data: unknown = JSON.parse(decoded.text);
    return { ok: true, data, json: JSON.stringify(data, null, 2) };
  } catch (err) {
    return { ok: false, error: `解码结果不是合法 JSON：${err instanceof Error ? err.message : String(err)}` };
  }
}

/**
 * 解析 JWT：先校验段数（必须 3 段），段数错误则三段均不解析；
 * 段数正确则逐段解析 Header / Payload，单段失败不牵连其他段；Signature 原始透传。
 */
export function parseJwt(token: string): ParseJwtResult {
  const trimmed = token.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 3) {
    return {
      ok: false,
      error: `JWT 应由 3 段组成（header.payload.signature），当前输入为 ${parts.length} 段`,
    };
  }
  return {
    ok: true,
    header: parseSegment(parts[0]),
    payload: parseSegment(parts[1]),
    signature: parts[2],
  };
}

/**
 * 把日期格式化为 `YYYY-MM-DD HH:mm:ss`。
 * timeZone 传 'UTC' 输出 UTC 时间；省略则输出本地时区时间。
 * 用 Intl.DateTimeFormat.formatToParts 取字段，不用 toLocaleString（输出随 locale 变化，不稳定）。
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
  return `${get('year').padStart(4, '0')}-${get('month')}-${get('day')} ${hour}:${get('minute')}:${get('second')}`;
}

/** 毫秒时长 → 人类可读，如「3天 2小时 5分钟」（不足 1 分钟显示「不到 1 分钟」） */
export function formatDuration(ms: number): string {
  const totalSec = Math.floor(Math.abs(ms) / 1000);
  if (totalSec < 60) return '不到 1 分钟';
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const units: string[] = [];
  if (days > 0) units.push(`${days}天`);
  if (hours > 0) units.push(`${hours}小时`);
  if (minutes > 0 || units.length === 0) units.push(`${minutes}分钟`);
  return units.join(' ');
}

export interface TimeClaim {
  key: string;
  /** 原始秒级时间戳 */
  raw: number;
  local: string;
  utc: string;
  /** 仅 exp 有：过期状态 */
  expired?: boolean;
  /** 仅 exp 有：「已过期 X」或「剩余 X」文案 */
  statusText?: string;
}

const TIME_CLAIM_KEYS = ['exp', 'iat', 'nbf'] as const;

/**
 * 从 Payload 数据中提取 exp/iat/nbf 数值声明并转为可读时间（本地 + UTC）；
 * exp 额外判定过期状态。data 非对象或声明非数值时跳过对应项。
 */
export function extractTimeClaims(data: unknown, now: number = Date.now()): TimeClaim[] {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return [];
  const record = data as Record<string, unknown>;
  const claims: TimeClaim[] = [];
  for (const key of TIME_CLAIM_KEYS) {
    const value = record[key];
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    const date = new Date(value * 1000);
    if (Number.isNaN(date.getTime())) continue;
    const claim: TimeClaim = {
      key,
      local: formatDateTime(date),
      raw: value,
      utc: formatDateTime(date, 'UTC'),
    };
    if (key === 'exp') {
      const diff = value * 1000 - now;
      claim.expired = diff <= 0;
      claim.statusText = diff <= 0 ? `已过期 ${formatDuration(diff)}` : `剩余 ${formatDuration(diff)}`;
    }
    claims.push(claim);
  }
  return claims;
}
