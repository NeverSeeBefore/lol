/**
 * Base64/URL 编解码纯函数层（无新增依赖，仅用原生 API）。
 * Base64 全程 Unicode 安全：编码经 UTF-8 字节序列，解码经 TextDecoder fatal 模式校验。
 */

export type CodecResult = { ok: true; result: string } | { ok: false; error: string };

// 字节 → binary string 的分块大小（防止 String.fromCharCode.apply 展开过长数组栈溢出）
const CHUNK = 0x8000;

function bytesToBinaryString(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return binary;
}

/** 任意 Unicode 文本 → 标准 Base64（含中文/emoji 不抛 InvalidCharacterError） */
export function encodeBase64(text: string): CodecResult {
  const bytes = new TextEncoder().encode(text);
  return { ok: true, result: btoa(bytesToBinaryString(bytes)) };
}

/**
 * Base64 → UTF-8 文本。容错：忽略空白、URL-safe 变体（-/_）、缺失 padding。
 * 错误区分两类：输入不是合法 Base64 / 字节序列不是合法 UTF-8。
 */
export function decodeBase64(text: string): CodecResult {
  // 忽略所有空白字符（粘贴的 Base64 常带换行）
  let cleaned = text.replace(/\s+/g, '');
  // URL-safe 变体归一
  cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');

  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    return { ok: false, error: '不是合法 Base64：含非法字符或 padding 位置错误（合法字符为 A-Z a-z 0-9 + /）' };
  }

  const rest = cleaned.replace(/=+$/, '');
  if (rest.length % 4 === 1) {
    return { ok: false, error: `不是合法 Base64：有效长度 ${rest.length} 位，mod 4 余 1 不可能对应任何字节序列` };
  }
  // 补齐缺失的 padding
  const padded = rest + '='.repeat((4 - (rest.length % 4)) % 4);

  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    return { ok: false, error: '不是合法 Base64：atob 拒绝解码（含非法字符或长度错误）' };
  }

  const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
  try {
    // fatal 模式：非法 UTF-8 抛错而非静默替换为 U+FFFD
    return { ok: true, result: new TextDecoder('utf-8', { fatal: true }).decode(bytes) };
  } catch {
    return { ok: false, error: 'Base64 本身合法，但解码出的字节序列不是合法 UTF-8 文本' };
  }
}

/** encodeURIComponent 语义：未保留字符原样，空格编码为 %20 */
export function encodeUrl(text: string): CodecResult {
  return { ok: true, result: encodeURIComponent(text) };
}

/** decodeURIComponent 语义；+ 按 form（application/x-www-form-urlencoded）约定先还原为空格 */
export function decodeUrl(text: string): CodecResult {
  try {
    return { ok: true, result: decodeURIComponent(text.replace(/\+/g, ' ')) };
  } catch {
    return { ok: false, error: 'URL 解码失败：百分号序列非法/不完整，或解码出的字节序列不是合法 UTF-8' };
  }
}
