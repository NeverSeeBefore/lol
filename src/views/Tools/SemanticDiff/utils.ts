import { diffLines } from 'diff';

// ---------- 性能阈值（实测数据见 design.md） ----------

/** 实时对比阈值：两侧合计行数/字符数同时不超过才走 useMemo 派生 */
export const LIVE_MAX_LINES = 2000;
export const LIVE_MAX_CHARS = 200_000;
/** 硬上限：超过直接拒绝计算（Myers 平方退化，3 万行病态输入达分钟级） */
export const HARD_MAX_LINES = 30_000;
export const HARD_MAX_CHARS = 3_000_000;
/** diff 单次计算超时（ms），超时按整体替换降级展示 */
export const DIFF_TIMEOUT = 1000;
/** 结果渲染行数上限，超出截断并提示 */
export const RENDER_MAX_ROWS = 5000;
/** JSON 变更列表条数上限，超出截断并提示 */
export const JSON_MAX_CHANGES = 2000;

export function totalLines(text: string): number {
  if (!text) return 0;
  return text.split('\n').length;
}

/** 两侧合计规模 → 实时 / 手动 / 超限 三档 */
export function scaleOf(oldText: string, newText: string): 'live' | 'manual' | 'over' {
  const lines = totalLines(oldText) + totalLines(newText);
  const chars = oldText.length + newText.length;
  if (lines > HARD_MAX_LINES || chars > HARD_MAX_CHARS) return 'over';
  if (lines > LIVE_MAX_LINES || chars > LIVE_MAX_CHARS) return 'manual';
  return 'live';
}

// ---------- 文本行级 diff ----------

export interface TextDiffRow {
  type: 'same' | 'add' | 'del' | 'mod';
  /** same/add/del 的行内容 */
  text: string;
  /** mod 对的新侧内容（text 存旧侧） */
  newText?: string;
  oldLine?: number;
  newLine?: number;
}

export interface TextDiffStats {
  added: number;
  removed: number;
  modified: number;
}

export interface TextDiffResult {
  rows: TextDiffRow[];
  stats: TextDiffStats;
  /** diff 超时降级为整体替换 */
  fallback: boolean;
}

function toRows(type: 'add' | 'del', text: string): TextDiffRow[] {
  if (!text) return [];
  const lines = text.split('\n');
  if (lines[lines.length - 1] === '') lines.pop();
  return lines.map((t, idx) =>
    type === 'del' ? { type, text: t, oldLine: idx + 1 } : { type, text: t, newLine: idx + 1 },
  );
}

/**
 * 行归一化：CRLF/CR → LF（\r 不可见，避免两侧行尾不同造成假修改）；
 * 末尾补 \n——jsdiff 行比较含换行符，末尾无 \n 时末行与相邻变更连成一块，
 * 配对逻辑会把公共末行配成内容相同的幻影修改（reviewer 实测 ignoreNewline 选项无效）。
 */
function normalizeLines(text: string): string {
  if (!text) return text;
  const s = text.replace(/\r\n?/g, '\n');
  return s.endsWith('\n') ? s : `${s}\n`;
}

/**
 * 文本行级 diff：diffLines 产出块序列 → 展开为行 → 相邻 del+add 段按行配对为 mod。
 * timeout 兜底：Myers 病态全异输入平方退化，超时返回 undefined → 整体替换降级。
 */
export function computeTextDiff(oldText: string, newText: string): TextDiffResult {
  const old = normalizeLines(oldText);
  const fresh = normalizeLines(newText);
  const parts = diffLines(old, fresh, { timeout: DIFF_TIMEOUT });
  if (!parts) {
    const delRows = toRows('del', old);
    const addRows = toRows('add', fresh);
    return {
      rows: [...delRows, ...addRows],
      stats: { added: addRows.length, removed: delRows.length, modified: 0 },
      fallback: true,
    };
  }

  // 展开为扁平行（value 末行带 \n，split 丢弃末尾空串）
  const flat: { type: 'same' | 'add' | 'del'; text: string }[] = [];
  for (const part of parts) {
    const type = part.added ? 'add' : part.removed ? 'del' : 'same';
    const lines = part.value.split('\n');
    if (lines[lines.length - 1] === '') lines.pop();
    for (const text of lines) flat.push({ type, text });
  }

  // 相邻 del 段紧跟 add 段 → 按行配对为 mod
  const rows: TextDiffRow[] = [];
  const stats: TextDiffStats = { added: 0, removed: 0, modified: 0 };
  let oldLine = 1;
  let newLine = 1;
  let i = 0;
  while (i < flat.length) {
    const cur = flat[i];
    if (cur.type === 'same') {
      rows.push({ type: 'same', text: cur.text, oldLine: oldLine++, newLine: newLine++ });
      i++;
      continue;
    }
    if (cur.type === 'del') {
      // 收集连续 del 段与紧随的 add 段
      const dels: string[] = [];
      while (i < flat.length && flat[i].type === 'del') dels.push(flat[i++].text);
      const adds: string[] = [];
      while (i < flat.length && flat[i].type === 'add') adds.push(flat[i++].text);
      const paired = Math.min(dels.length, adds.length);
      for (let k = 0; k < paired; k++) {
        rows.push({ type: 'mod', text: dels[k], newText: adds[k], oldLine: oldLine++, newLine: newLine++ });
        stats.modified++;
      }
      for (let k = paired; k < dels.length; k++) {
        rows.push({ type: 'del', text: dels[k], oldLine: oldLine++ });
        stats.removed++;
      }
      for (let k = paired; k < adds.length; k++) {
        rows.push({ type: 'add', text: adds[k], newLine: newLine++ });
        stats.added++;
      }
      continue;
    }
    // 纯 add 段（前面无 del）
    const adds: string[] = [];
    while (i < flat.length && flat[i].type === 'add') adds.push(flat[i++].text);
    for (const text of adds) {
      rows.push({ type: 'add', text, newLine: newLine++ });
      stats.added++;
    }
  }
  return { rows, stats, fallback: false };
}

// ---------- JSON 语义 diff ----------

export type ChangeKind = 'add' | 'del' | 'mod';

export interface JsonChange {
  kind: ChangeKind;
  /** 路径，如 a.b[2].c；根为 $ */
  path: string;
  /** 值类型发生变化（对象↔数组↔标量互换），不再下钻 */
  typeChanged: boolean;
  oldValue?: string;
  newValue?: string;
}

export interface JsonDiffStats {
  added: number;
  removed: number;
  modified: number;
}

export type JsonDiffResult =
  { ok: true; changes: JsonChange[]; stats: JsonDiffStats; truncated: boolean } | { ok: false; error: string };

/**
 * JSON.parse 错误 → 友好提示：
 * 1. 优先解析 V8 自带的「(line N column M)」，输出完整行列；
 * 2. 否则有「at position N」时自行换算行列；
 * 3. 词法级错误（如 `abc`、`{"a": undefined}`）现代 V8 完全无位置信息——如实降级为原始原因，不编造行列。
 */
function formatJsonError(e: unknown, input: string): string {
  const message = e instanceof Error ? e.message : 'JSON 解析失败';
  const lineCol = /\(line (\d+) column (\d+)\)/.exec(message);
  if (lineCol) {
    const reason = message.replace(/\s*\(line \d+ column \d+\).*$/, '').replace(/ at position \d+$/, '');
    return `第 ${lineCol[1]} 行第 ${lineCol[2]} 列：${reason}`;
  }
  const match = /at position (\d+)/.exec(message);
  if (!match) return message;
  const pos = Number(match[1]);
  const before = input.slice(0, pos);
  const line = before.split('\n').length;
  const col = pos - before.lastIndexOf('\n');
  const reason = message.replace(/ at position \d+.*$/, '');
  return `第 ${line} 行第 ${col} 列：${reason}`;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** 值摘要：标量直接 stringify；对象/数组折叠为类型摘要，避免巨型值刷屏 */
function summarize(v: unknown): string {
  if (isPlainObject(v)) return `{…${Object.keys(v).length} 键}`;
  if (Array.isArray(v)) return `[…${v.length} 项]`;
  const s = JSON.stringify(v) ?? String(v);
  return s.length > 80 ? `${s.slice(0, 77)}…` : s;
}

const IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

/** 路径拼接：常规键 a.b；非常规键（含点/空格/数字开头）降级为 ["key"] 下标注 */
function joinPath(parent: string, key: string): string {
  return IDENT_RE.test(key) ? `${parent}.${key}` : `${parent}[${JSON.stringify(key)}]`;
}

/**
 * JSON 语义 diff：键序无关递归比对，路径化变更列表。
 * 类型变化（对象↔数组↔标量互换）单条标注 typeChanged，不再下钻（下钻噪音大）。
 * 空文本侧视为「空文档」：另一侧整体记为根路径新增/删除。
 */
export function computeJsonDiff(oldText: string, newText: string): JsonDiffResult {
  let oldVal: unknown;
  let newVal: unknown;
  const oldEmpty = oldText.trim() === '';
  const newEmpty = newText.trim() === '';
  try {
    oldVal = oldEmpty ? undefined : JSON.parse(oldText);
  } catch (e) {
    return { ok: false, error: `左侧 ${formatJsonError(e, oldText)}` };
  }
  try {
    newVal = newEmpty ? undefined : JSON.parse(newText);
  } catch (e) {
    return { ok: false, error: `右侧 ${formatJsonError(e, newText)}` };
  }

  const changes: JsonChange[] = [];
  const stats: JsonDiffStats = { added: 0, removed: 0, modified: 0 };
  let truncated = false;

  const push = (c: JsonChange): boolean => {
    if (changes.length >= JSON_MAX_CHANGES) {
      truncated = true;
      return false;
    }
    changes.push(c);
    if (c.kind === 'add') stats.added++;
    else if (c.kind === 'del') stats.removed++;
    else stats.modified++;
    return true;
  };

  const walk = (path: string, a: unknown, b: unknown): boolean => {
    if (Object.is(a, b)) return true;
    if (isPlainObject(a) && isPlainObject(b)) {
      const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      for (const key of [...keys].sort()) {
        const p = joinPath(path, key);
        const inA = key in a;
        const inB = key in b;
        if (inA && inB) {
          if (!walk(p, a[key], b[key])) return false;
        } else if (inA) {
          if (!push({ kind: 'del', path: p, typeChanged: false, oldValue: summarize(a[key]) })) return false;
        } else {
          if (!push({ kind: 'add', path: p, typeChanged: false, newValue: summarize(b[key]) })) return false;
        }
      }
      return true;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      const common = Math.min(a.length, b.length);
      for (let i = 0; i < common; i++) {
        if (!walk(`${path}[${i}]`, a[i], b[i])) return false;
      }
      for (let i = common; i < a.length; i++) {
        if (!push({ kind: 'del', path: `${path}[${i}]`, typeChanged: false, oldValue: summarize(a[i]) })) return false;
      }
      for (let i = common; i < b.length; i++) {
        if (!push({ kind: 'add', path: `${path}[${i}]`, typeChanged: false, newValue: summarize(b[i]) })) return false;
      }
      return true;
    }
    // 标量不等 or 类型互换（含对象↔数组）
    const typeChanged =
      typeof a !== typeof b || isPlainObject(a) !== isPlainObject(b) || Array.isArray(a) !== Array.isArray(b);
    return push({
      kind: 'mod',
      path,
      typeChanged,
      oldValue: summarize(a),
      newValue: summarize(b),
    });
  };

  if (oldEmpty && newEmpty) {
    // 两侧皆空：零变更
  } else if (oldEmpty) {
    push({ kind: 'add', path: '$', typeChanged: false, newValue: summarize(newVal) });
  } else if (newEmpty) {
    push({ kind: 'del', path: '$', typeChanged: false, oldValue: summarize(oldVal) });
  } else {
    walk('$', oldVal, newVal);
  }

  return { ok: true, changes, stats, truncated };
}
