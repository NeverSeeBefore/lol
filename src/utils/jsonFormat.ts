import JSON5 from 'json5';
import { Diagnostic } from '@codemirror/lint';

/** 缩进选项：2 / 4 空格或 Tab */
export type Indent = 2 | 4 | 'tab';

export interface JsonError {
  message: string;
  line?: number;
  column?: number;
}

export type JsonParseResult = { ok: true; value: unknown } | { ok: false; error: JsonError };

export type JsonFormatResult = { ok: true; result: string } | { ok: false; error: JsonError };

/** 字符偏移量 -> 行列号（均从 1 开始） */
export function offsetToLineColumn(input: string, offset: number): { line: number; column: number } {
  const before = input.slice(0, offset);
  const line = before.split('\n').length;
  const column = offset - before.lastIndexOf('\n');
  return { line, column };
}

/** 行列号（均从 1 开始） -> 字符偏移量 */
export function lineColumnToOffset(input: string, line: number, column: number): number {
  const lines = input.split('\n');
  let offset = 0;
  for (let i = 0; i < Math.min(line - 1, lines.length); i++) {
    offset += lines[i].length + 1;
  }
  return Math.min(offset + column - 1, input.length);
}

/**
 * 把解析异常统一为 JsonError：
 * - JSON5 错误对象自带 lineNumber / columnNumber
 * - V8 JSON.parse 部分版本带 "at position N"，由偏移换算行列；取不到则只保留 message
 */
function toJsonError(e: unknown, input: string): JsonError {
  if (!(e instanceof Error)) return { message: String(e) };

  const json5Err = e as { lineNumber?: number; columnNumber?: number };
  if (typeof json5Err.lineNumber === 'number' && typeof json5Err.columnNumber === 'number') {
    return { message: e.message, line: json5Err.lineNumber, column: json5Err.columnNumber };
  }

  const match = /position (\d+)/.exec(e.message);
  if (match) {
    const offset = Number(match[1]);
    return { message: e.message, ...offsetToLineColumn(input, offset) };
  }

  return { message: e.message };
}

/** 解析 JSON 文本；tolerant 开启时用 JSON5 容错解析（注释/尾逗号/单引号等） */
export function parseJson(input: string, opts: { tolerant?: boolean } = {}): JsonParseResult {
  try {
    const value = opts.tolerant ? JSON5.parse(input) : JSON.parse(input);
    return { ok: true, value };
  } catch (e) {
    return { ok: false, error: toJsonError(e, input) };
  }
}

/** 格式化：解析后按指定缩进输出严格 JSON */
export function formatJson(input: string, opts: { indent?: Indent; tolerant?: boolean } = {}): JsonFormatResult {
  const parsed = parseJson(input, opts);
  if (!parsed.ok) return parsed;
  const indent = opts.indent === 'tab' ? '\t' : (opts.indent ?? 2);
  return { ok: true, result: JSON.stringify(parsed.value, null, indent) };
}

/** 压缩：解析后输出去除空白的单行严格 JSON */
export function minifyJson(input: string, opts: { tolerant?: boolean } = {}): JsonFormatResult {
  const parsed = parseJson(input, opts);
  if (!parsed.ok) return parsed;
  return { ok: true, result: JSON.stringify(parsed.value) };
}

/** 把 JsonError 转成 CodeMirror lint Diagnostic；无位置信息时返回 null（降级为仅状态栏展示） */
export function jsonErrorToDiagnostic(error: JsonError, doc: string): Diagnostic | null {
  if (typeof error.line !== 'number' || typeof error.column !== 'number') return null;
  const from = lineColumnToOffset(doc, error.line, error.column);
  return {
    from,
    to: Math.min(from + 1, doc.length),
    severity: 'error',
    message: error.message,
  };
}
