// 正则测试 · 纯函数层（无 React 依赖，可单测）

/** 测试文本长度上限：超过则跳过匹配与高亮（灾难性回溯防护的输入规模闸） */
export const MAX_TEXT_LENGTH = 100_000;

/** 捕获组表格行数上限：防大表卡顿 */
export const MAX_TABLE_ROWS = 100;

/** 命中总数统计上限：防病态正则拖慢统计 */
export const MAX_MATCH_TOTAL = 10_000;

export type RegexResult = { ok: true; regex: RegExp } | { ok: false; error: string };

export interface MatchRow {
  /** 第几个匹配（从 1 开始） */
  index: number;
  /** 匹配全文 */
  full: string;
  /** 各捕获组内容（未参与的组为 undefined，UI 显示 -） */
  groups: (string | undefined)[];
}

export interface MatchSummary {
  rows: MatchRow[];
  /** 真实命中数（上限 MAX_MATCH_TOTAL） */
  total: number;
  /** 表格只收录了前 MAX_TABLE_ROWS 条 */
  truncated: boolean;
  /** 命中数统计也到达上限，真实数量可能更多 */
  totalCapped: boolean;
}

export interface RegexTemplate {
  name: string;
  pattern: string;
  flags: string[];
}

/** 常用正则模板库（博客联动点：模板说明同步发博文） */
export const REGEX_TEMPLATES: RegexTemplate[] = [
  { name: '手机号', pattern: '^1[3-9]\\d{9}$', flags: [] },
  { name: '邮箱', pattern: '^[\\w.%+-]+@[\\w-]+(\\.[\\w-]+)+$', flags: [] },
  { name: 'URL', pattern: '^https?:\\/\\/[\\w.-]+(?::\\d+)?(?:\\/\\S*)?$', flags: [] },
  {
    name: '身份证号',
    pattern: '^\\d{6}(?:19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$',
    flags: [],
  },
  {
    name: 'IPv4',
    pattern: '^(?:(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)\\.){3}(?:25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)$',
    flags: [],
  },
  { name: '日期 YYYY-MM-DD', pattern: '^\\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\\d|3[01])$', flags: [] },
  { name: '中文字符', pattern: '[一-龥]+', flags: ['g'] },
];

/** 支持的 flags 及含义（antd Checkbox.Group 的 label/title 用） */
export const FLAG_OPTIONS: { value: string; label: string; title: string }[] = [
  { value: 'g', label: 'g', title: '全局匹配：找出所有匹配而非第一个' },
  { value: 'i', label: 'i', title: '忽略大小写' },
  { value: 'm', label: 'm', title: '多行模式：^ 与 $ 匹配每行的首尾' },
  { value: 's', label: 's', title: '点号通配：. 也匹配换行符' },
  { value: 'u', label: 'u', title: 'Unicode 模式：按码点处理，启用严格语法' },
  { value: 'y', label: 'y', title: '粘连模式：只从 lastIndex 位置开始匹配' },
];

/**
 * SyntaxError 文案 → 中文友好文案（说明原因，不道歉）。
 * 不同引擎措辞不一，按关键词覆盖常见情况，兜底下发原始信息。
 */
export function friendlyRegexError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid regular expression flag')) return '无效的标志：只支持 g/i/m/s/u/y/d/v';
  if (m.includes('unterminated group')) return '括号未闭合：存在多余的 (';
  if (m.includes("unmatched ')'") || m.includes('unmatched )')) return '括号不匹配：存在多余的 )';
  if (m.includes('unterminated character class')) return '字符类未闭合：存在多余的 [';
  if (m.includes('nothing to repeat')) return '量词前没有可重复的内容：* + ? {n} 必须跟在字符或分组之后';
  if (m.includes('invalid quantifier') || m.includes('incomplete quantifier') || m.includes('lone quantifier'))
    return '量词不完整：{n,m} 写法有误';
  if (m.includes('invalid escape') || m.includes('invalid unicode escape')) return '无效的转义序列';
  if (m.includes('unterminated pattern') || m.includes('trailing backslash') || m.includes('\\ at end'))
    return '图案不完整：末尾的反斜杠 \\ 没有转义目标';
  if (m.includes('invalid group') || m.includes('invalid group specifier'))
    return '无效的分组语法：? 后需接 : = ! < 之一';
  if (m.includes('duplicate capture group name')) return '捕获组名重复：同一位置不能出现两个同名组';
  if (m.includes('invalid named capture') || m.includes('invalid named reference')) return '无效的命名捕获/引用';
  if (m.includes('numbers out of order') || m.includes('out of order in quantifier'))
    return '量词区间错误：{n,m} 中 n 不能大于 m';
  return `正则语法错误：${message}`;
}

/** 构造正则；语法错误转友好文案 */
export function buildRegex(pattern: string, flags: string[]): RegexResult {
  try {
    return { ok: true, regex: new RegExp(pattern, flags.join('')) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: friendlyRegexError(message) };
  }
}

/** 正则是否可匹配空串（MatchDecorator 对空匹配会死循环，用于跳过高亮） */
export function canMatchEmpty(regex: RegExp): boolean {
  const saved = regex.lastIndex;
  regex.lastIndex = 0;
  const hit = regex.exec('') !== null;
  regex.lastIndex = saved;
  return hit;
}

/** 等价于 ECMAScript 规范的 AdvanceStringIndex：u flag 下代理对整体前进 */
function advanceStringIndex(text: string, index: number, unicode: boolean): number {
  if (!unicode || index + 1 >= text.length) return index + 1;
  const first = text.charCodeAt(index);
  if (first < 0xd800 || first > 0xdbff) return index + 1;
  const second = text.charCodeAt(index + 1);
  if (second < 0xdc00 || second > 0xdfff) return index + 1;
  return index + 2;
}

/**
 * 收集匹配结果：手动 exec 循环，空匹配时强制前进 lastIndex 防死循环。
 * 表格只收录前 MAX_TABLE_ROWS 条；总数统计到 MAX_MATCH_TOTAL 为止。
 */
export function collectMatches(regex: RegExp, text: string, limit = MAX_TABLE_ROWS): MatchSummary {
  const rows: MatchRow[] = [];
  let total = 0;
  let totalCapped = false;

  try {
    if (!regex.global) {
      const m = regex.exec(text);
      if (m) {
        total = 1;
        rows.push({ index: 1, full: m[0], groups: m.slice(1) });
      }
    } else {
      regex.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = regex.exec(text)) !== null) {
        total += 1;
        if (total <= limit) {
          rows.push({ index: total, full: m[0], groups: m.slice(1) });
        }
        // 空匹配不前进会死循环：按码点强制前进（u flag 下跳过整个代理对）
        if (m[0] === '') {
          regex.lastIndex = advanceStringIndex(text, regex.lastIndex, regex.unicode);
        }
        if (total >= MAX_MATCH_TOTAL) {
          totalCapped = true;
          break;
        }
      }
    }
  } finally {
    regex.lastIndex = 0;
  }

  return { rows, total, truncated: total > rows.length, totalCapped };
}
