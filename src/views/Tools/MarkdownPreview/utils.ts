import { marked } from 'marked';
import DOMPurify from 'dompurify';
import type { EditorView } from '@codemirror/view';

// 显式声明解析选项，不依赖库默认值（GFM 表格/删除线开，单行换行不转 <br>）
const MARKED_OPTIONS = { gfm: true, breaks: false } as const;

// style 属性二次消毒：DOMPurify 默认保留 style 属性，expression()/javascript: URL 在现代浏览器
// 虽不执行，但按验收要求对残留危险样式一律清空（一次性注册钩子，模块级单例）
const DANGEROUS_CSS = /expression\s*\(|javascript\s*:|vbscript\s*:|-moz-binding|behavior\s*:/i;
DOMPurify.addHook('uponSanitizeAttribute', (_node, data) => {
  if (data.attrName === 'style' && DANGEROUS_CSS.test(data.attrValue)) {
    data.attrValue = '';
  }
});

/**
 * Markdown → 消毒后 HTML 的唯一入口（硬性安全要求）：
 * marked 不做任何消毒，所有输出必须经 DOMPurify 默认白名单过滤。
 * 默认配置即覆盖：script 标签剥离、on* 事件属性移除、javascript:/data:text/html URI 拒绝、
 * iframe 剥离；style 属性再经上方钩子清剿 expression()/javascript: 等危险值。
 */
export function renderMarkdown(src: string): string {
  if (!src.trim()) return '';
  const raw = marked.parse(src, MARKED_OPTIONS);
  // marked.parse 开启 async 选项才返回 Promise，此处恒为 string
  return DOMPurify.sanitize(raw as string);
}

/** 快捷插入片段定义：wrap 类包裹选区，build 类生成多行模板 */
export interface Snippet {
  label: string;
  /** 无选区时插入的占位文本 */
  placeholder: string;
  /** 选区两侧包裹标记；省略则走 build 模板插入 */
  wrap?: [string, string];
  /** 自定义生成插入内容（块级模板自行处理换行，避免粘连上文） */
  build?: (selected: string) => string;
}

export const SNIPPETS: Snippet[] = [
  { label: '加粗', placeholder: '粗体', wrap: ['**', '**'] },
  { label: '斜体', placeholder: '斜体', wrap: ['*', '*'] },
  { label: '行内代码', placeholder: 'code', wrap: ['`', '`'] },
  {
    label: '链接',
    placeholder: '链接文字',
    build: (selected) => `[${selected || '链接文字'}](https://)`,
  },
  {
    label: '代码块',
    placeholder: 'code',
    build: (selected) => `\n\`\`\`\n${selected || 'code'}\n\`\`\`\n`,
  },
  {
    label: '表格',
    placeholder: '',
    build: () => '\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n',
  },
];

/**
 * 在编辑器光标/选区处插入 Markdown 模板：
 * 有选区时包裹（wrap 类）或嵌入模板（build 类）；无选区时插入占位文本并选中它，便于直接改字。
 * 事务经 EditorView.dispatch 派发，CodeEditor 的 updateListener 会同步回 React state。
 */
export function insertSnippet(view: EditorView, snippet: Snippet): void {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);

  let inserted: string;
  if (snippet.build) {
    inserted = snippet.build(selected);
  } else if (snippet.wrap) {
    const [pre, post] = snippet.wrap;
    inserted = `${pre}${selected || snippet.placeholder}${post}`;
  } else {
    inserted = snippet.placeholder;
  }

  // 选中新插入的占位文本（仅当原文无选区且占位非空时），否则光标落到插入内容末尾
  const placeholderRange =
    !selected && !snippet.build && snippet.wrap
      ? { anchor: from + snippet.wrap[0].length, head: from + snippet.wrap[0].length + snippet.placeholder.length }
      : null;

  view.dispatch({
    changes: { from, to, insert: inserted },
    selection: placeholderRange ?? { anchor: from + inserted.length },
    scrollIntoView: true,
  });
  view.focus();
}

/** 下载当前 Markdown 源文本为 .md 文件 */
export function downloadMarkdown(source: string, filename = 'document.md'): void {
  const blob = new Blob([source], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** 状态栏统计：字符数与行数（空文本计 0 行） */
export function statsOf(source: string): { chars: number; lines: number } {
  return { chars: source.length, lines: source === '' ? 0 : source.split('\n').length };
}
