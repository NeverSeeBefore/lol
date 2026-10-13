import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLine,
  highlightActiveLineGutter,
  placeholder as cmPlaceholder,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { Diagnostic, forceLinting, lintGutter, linter } from '@codemirror/lint';
import { tags } from '@lezer/highlight';
import styles from './index.module.less';

// 暗色主题：色值引用全局令牌（docs/design/ui-spec.md §5 代码块条目）
const darkTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'var(--bg-raised)',
      color: 'var(--text-primary)',
      height: '100%',
    },
    '&.cm-focused': { outline: 'none' }, // 焦点描边由全局 :focus-visible 统一表达
    '.cm-activeLine': { backgroundColor: 'var(--bg-hover)' },
    '.cm-activeLineGutter': { backgroundColor: 'var(--bg-hover)' },
    '.cm-content': { caretColor: 'var(--accent-text)', fontFamily: 'var(--font-mono)' },
    '.cm-cursor': { borderLeftColor: 'var(--accent-text)' },
    '.cm-gutters': {
      backgroundColor: 'var(--bg-raised)',
      border: 'none',
      color: 'var(--text-tertiary)',
    },
  },
  { dark: true },
);

// 语法着色：专用 code-token 色板，不挪用语义色
const darkHighlight = HighlightStyle.define([
  { tag: tags.propertyName, color: 'var(--code-key)' },
  { tag: tags.string, color: 'var(--code-string)' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--code-number)' },
]);

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  /** 基于文档内容产出诊断标记（行内红波浪线）；返回空数组表示无错误 */
  lint?: (doc: string) => Diagnostic[];
  placeholder?: string;
}

/**
 * CodeMirror 6 受控封装：React 侧只见 value/onChange，
 * EditorView 生命周期在 useEffect 内创建与销毁。
 */
export default function CodeEditor({ value, onChange, readOnly = false, lint, placeholder }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lintRef = useRef(lint);
  lintRef.current = lint;

  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      json(),
      darkTheme,
      syntaxHighlighting(darkHighlight, { fallback: true }),
      EditorView.lineWrapping,
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onChangeRef.current?.(update.state.doc.toString());
      }),
      ...(lintRef.current ? [linter((view) => lintRef.current?.(view.state.doc.toString()) ?? []), lintGutter()] : []),
      ...(placeholder ? [cmPlaceholder(placeholder)] : []),
    ];

    const view = new EditorView({
      state: EditorState.create({ doc: value, extensions }),
      parent: containerRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // 编辑器实例只创建一次；value/lint 的变更由下方 effect 同步
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 外部 value 变更时同步进编辑器（与文档一致时不重复写入）
  useEffect(() => {
    const view = viewRef.current;
    if (view && value !== view.state.doc.toString()) {
      view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: value } });
    }
  }, [value]);

  // lint 函数变化（如容错模式开关）时强制重新诊断
  useEffect(() => {
    const view = viewRef.current;
    if (view && lint) forceLinting(view);
  }, [lint]);

  return <div className={styles.editor} ref={containerRef} />;
}
