import { isScalar, parseAllDocuments, stringify as yamlStringify } from 'yaml';

export type CodecResult =
  { ok: true; result: string; docCount?: number; warning?: string } | { ok: false; error: string };

/** yaml 库解析错误/警告的最小结构（YAMLParseError / YAMLWarning 均带 linePos 行列定位） */
interface YamlErrorLike {
  message: string;
  linePos?: { line: number; col: number }[];
}

function isYamlErrorLike(e: unknown): e is YamlErrorLike {
  return (
    typeof e === 'object' && e !== null && 'message' in e && typeof (e as { message: unknown }).message === 'string'
  );
}

/**
 * YAML 错误/警告 → 友好提示：linePos 提取行列号重组为「第 N 行：原因」。
 * 库 message 内嵌输入代码片段回显（"\n\n 2\n ^\n"），截首行并剥掉
 * 「 at line N, column M」尾巴，避免剧透输入内容。
 */
export function formatYamlError(e: unknown): string {
  if (!isYamlErrorLike(e)) return 'YAML 解析失败';
  const firstLine = e.message.split('\n')[0].replace(/ at line \d+, column \d+:?$/, '');
  const pos = e.linePos?.[0];
  return pos ? `第 ${pos.line} 行：${firstLine}` : firstLine;
}

/**
 * 极简 JSON 校验器：只在 JSON.parse 失败后的错误路径上运行，
 * 返回第一个语法错误的字符下标（用于行列换算），合法时返回 null。
 * 不构建值，O(n) 单趟；严格遵循 JSON 文法（对象/数组/字符串转义/数字/true/false/null）。
 */
function findJsonErrorPos(input: string): number | null {
  let i = 0;
  const n = input.length;
  const ws = () => {
    while (i < n && (input[i] === ' ' || input[i] === '\t' || input[i] === '\n' || input[i] === '\r')) i++;
  };
  const fail = (): never => {
    throw i;
  };
  const parseString = () => {
    // 调用时 input[i] === '"'
    i++;
    while (i < n) {
      const ch = input[i];
      if (ch === '\\') {
        i += 2; // 跳过转义字符本身（\uXXXX 的宽松处理不影响定位）
        continue;
      }
      if (ch === '"') {
        i++;
        return;
      }
      i++;
    }
    fail(); // 字符串未闭合
  };
  const parseNumber = () => {
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/.exec(input.slice(i));
    if (!m) {
      throw i;
    }
    i += m[0].length;
  };
  const expect = (word: string) => {
    if (input.startsWith(word, i)) {
      i += word.length;
      return;
    }
    fail();
  };
  const parseValue = (): void => {
    ws();
    if (i >= n) fail();
    const c = input[i];
    if (c === '{') {
      i++;
      ws();
      if (input[i] === '}') {
        i++;
        return;
      }
      for (;;) {
        ws();
        if (input[i] !== '"') fail();
        parseString();
        ws();
        if (input[i] !== ':') fail();
        i++;
        parseValue();
        ws();
        if (input[i] === ',') {
          i++;
          continue;
        }
        if (input[i] === '}') {
          i++;
          return;
        }
        fail();
      }
    } else if (c === '[') {
      i++;
      ws();
      if (input[i] === ']') {
        i++;
        return;
      }
      for (;;) {
        parseValue();
        ws();
        if (input[i] === ',') {
          i++;
          continue;
        }
        if (input[i] === ']') {
          i++;
          return;
        }
        fail();
      }
    } else if (c === '"') {
      parseString();
    } else if (c === 't') {
      expect('true');
    } else if (c === 'f') {
      expect('false');
    } else if (c === 'n') {
      expect('null');
    } else {
      parseNumber();
    }
  };
  try {
    parseValue();
    ws();
    if (i < n) fail();
    return null;
  } catch (pos) {
    return typeof pos === 'number' ? pos : null;
  }
}

/**
 * JSON.parse 错误 → 友好提示。
 * V8 消息有两种格式：「... at position N」（有位置）与
 * 「Unexpected token '}', ..."原文" is not valid JSON」（无位置且内嵌输入回显）。
 * 位置统一由 findJsonErrorPos 自扫换算为行号；消息剥掉 position 尾巴与原文回显。
 */
export function formatJsonError(e: unknown, input: string): string {
  const message = e instanceof Error ? e.message : 'JSON 解析失败';
  const reason = message
    .split('\n')[0]
    .replace(/, \.{3}[\s\S]*$/, '') // 剥掉新版 V8 的 ', ..."原文" is not valid JSON' 回显尾巴
    .replace(/"? is not valid JSON$/, '')
    .replace(/ at position \d+( \(line \d+ column \d+\))?$/, '') // 浏览器 V8 会追加 (line N column M)
    .replace(/ in JSON$/, '');
  const pos = findJsonErrorPos(input);
  if (pos === null) return reason;
  const line = input.slice(0, pos).split('\n').length;
  return `第 ${line} 行：${reason}`;
}

/**
 * YAML → JSON：parseAllDocuments 支持多文档（---），
 * 单文档输出单个 JSON；多文档合并为 JSON 数组并回报 docCount。
 * 锚点/别名解析时自动展开（merge: true 连 << 合并键也展开）；日期标量保持字符串（yaml 2.x 默认），往返安全。
 *
 * 实测注意点：
 * - parseAllDocuments 解析失败不抛异常，错误收进 doc.errors，toJSON 仍返回
 *   尽力而为的结果——必须显式检查 errors，否则非法 YAML 会静默产出错误 JSON。
 * - 纯注释/纯空白输入返回 0 个文档，JSON.stringify(undefined) 得到 undefined
 *   （不是字符串）——按空输入处理，否则下游 .length 直接白屏。
 * - 行尾 '---' 会产生 contents 为 null 的幻影尾文档，过滤掉再计数。
 * - 未知 tag（如 !nosuchtag）静默降级为字符串，收进 doc.warnings——透出为状态栏提示。
 */
export function convertYamlToJson(input: string): CodecResult {
  try {
    const docs = parseAllDocuments(input, { merge: true });
    // 过滤尾部幻影文档（行尾 --- / 尾部注释行）：内容为 null 且 source 为空串
    // （真实写的 'null' 字面量文档 source 为 'null'，不会被误杀）
    const isPhantomDoc = (doc: (typeof docs)[number]) =>
      doc.errors.length === 0 && isScalar(doc.contents) && doc.contents.value === null && doc.contents.source === '';
    while (docs.length > 0 && isPhantomDoc(docs[docs.length - 1])) {
      docs.pop();
    }
    const firstError = docs.flatMap((doc) => doc.errors)[0];
    if (firstError) {
      return { ok: false, error: formatYamlError(firstError) };
    }
    const firstWarning = docs.flatMap((doc) => doc.warnings)[0];
    const warning = firstWarning ? formatYamlError(firstWarning) : undefined;
    const values = docs.map((doc) => doc.toJSON());
    // 纯注释/纯空白输入：0 个文档，按空输入处理
    if (values.length === 0) {
      return { ok: true, result: '' };
    }
    const result = values.length > 1 ? JSON.stringify(values, null, 2) : (JSON.stringify(values[0], null, 2) ?? '');
    if (values.length > 1) {
      return { ok: true, result, docCount: values.length, warning };
    }
    return { ok: true, result, warning };
  } catch (e) {
    // 别名构成循环引用时 JSON.stringify 也会抛错，统一走友好提示
    if (e instanceof TypeError && /circular/i.test(e.message)) {
      return { ok: false, error: '含循环引用（锚点/别名自引用），无法转为 JSON' };
    }
    return { ok: false, error: formatYamlError(e) };
  }
}

/** JSON → YAML：固定 2 空格缩进，中文不转义 */
export function convertJsonToYaml(input: string): CodecResult {
  let data: unknown;
  try {
    data = JSON.parse(input);
  } catch (e) {
    return { ok: false, error: formatJsonError(e, input) };
  }
  try {
    return { ok: true, result: yamlStringify(data, { indent: 2 }) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'YAML 序列化失败' };
  }
}
