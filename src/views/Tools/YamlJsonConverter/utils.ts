import { parseAllDocuments, stringify as yamlStringify } from 'yaml';

export type CodecResult = { ok: true; result: string; docCount?: number } | { ok: false; error: string };

/** yaml 库解析错误的最小结构（YAMLParseError 带 linePos 行列定位） */
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
 * YAML 错误 → 友好提示：linePos 提取行列号重组为「第 N 行：原因」。
 * 库 message 内嵌输入代码片段回显（"\n\n 2\n ^\n"），截首行并剥掉
 * 「 at line N, column M」尾巴，避免剧透输入内容。
 */
export function formatYamlError(e: unknown): string {
  if (!isYamlErrorLike(e)) return 'YAML 解析失败';
  const firstLine = e.message.split('\n')[0].replace(/ at line \d+, column \d+:?$/, '');
  const pos = e.linePos?.[0];
  return pos ? `第 ${pos.line} 行：${firstLine}` : firstLine;
}

/** JSON.parse 错误 → 友好提示：V8 消息含「at position N」时换算为行列号 */
export function formatJsonError(e: unknown, input: string): string {
  const message = e instanceof Error ? e.message : 'JSON 解析失败';
  const match = /at position (\d+)/.exec(message);
  if (!match) return message;
  const pos = Number(match[1]);
  const before = input.slice(0, pos);
  const line = before.split('\n').length;
  const reason = message.replace(/ at position \d+.*$/, '');
  return `第 ${line} 行：${reason}`;
}

/**
 * YAML → JSON：parseAllDocuments 支持多文档（---），
 * 单文档输出单个 JSON；多文档合并为 JSON 数组并回报 docCount。
 * 锚点/别名解析时自动展开（merge: true 连 << 合并键也展开）；日期标量保持字符串（yaml 2.x 默认），往返安全。
 *
 * 注意：parseAllDocuments 解析失败不抛异常，错误收进 doc.errors，
 * toJSON 仍返回尽力而为的结果——必须显式检查 errors，否则非法 YAML 会静默产出错误 JSON。
 */
export function convertYamlToJson(input: string): CodecResult {
  try {
    const docs = parseAllDocuments(input, { merge: true });
    const firstError = docs.flatMap((doc) => doc.errors)[0];
    if (firstError) {
      return { ok: false, error: formatYamlError(firstError) };
    }
    const values = docs.map((doc) => doc.toJSON());
    if (values.length > 1) {
      return { ok: true, result: JSON.stringify(values, null, 2), docCount: values.length };
    }
    return { ok: true, result: JSON.stringify(values[0], null, 2) };
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
