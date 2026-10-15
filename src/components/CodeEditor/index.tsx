import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { Compartment, EditorState, Extension } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  MatchDecorator,
  ViewPlugin,
  ViewUpdate,
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
  /** 语言扩展，仅挂载时读取（编辑器实例只创建一次）；默认 'json' 保持既有行为 */
  language?: 'json' | 'text';
  /**
   * 实时匹配高亮：对文档中匹配该正则的片段加 `.cm-live-match` 标记（样式由调用方定义）。
   * 必须带 `g` flag（MatchDecorator 要求）；调用方须保证正则不匹配空串（否则跳过高亮）。
   */
  highlightRegex?: RegExp | null;
  /**
   * 可选：挂载后把 EditorView 实例写入该 ref（卸载时置 null），
   * 供调用方读写选区/派发事务（如 Markdown 工具栏插入语法）。实例生命周期仍由本组件管理。
   */
  editorRef?: RefObject<EditorView | null>;
}

/** 匹配高亮插件：MatchDecorator 只计算可视区间，正则变更经 Compartment 重配置 */
function buildHighlight(regex: RegExp | null | undefined): Extension {
  if (!regex) return [];
  const decorator = new MatchDecorator({
    regexp: regex,
    decoration: Decoration.mark({ class: 'cm-live-match' }),
  });
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;

      constructor(view: EditorView) {
        this.decorations = decorator.createDeco(view);
      }

      update(update: ViewUpdate) {
        this.decorations = decorator.updateDeco(update, this.decorations);
      }
    },
    { decorations: (v) => v.decorations },
  );
}

/**
 * CodeMirror 6 受控封装：React 侧只见 value/onChange，
 * EditorView 生命周期在 useEffect 内创建与销毁。
 */
export default function CodeEditor({
  value,
  onChange,
  readOnly = false,
  lint,
  placeholder,
  language = 'json',
  highlightRegex = null,
  editorRef,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const highlightCompartmentRef = useRef<Compartment | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const lintRef = useRef(lint);
  lintRef.current = lint;
  const highlightRegexRef = useRef(highlightRegex);
  highlightRegexRef.current = highlightRegex;

  useEffect(() => {
    if (!containerRef.current) return;

    const highlightCompartment = new Compartment();
    highlightCompartmentRef.current = highlightCompartment;

    const extensions = [
      lineNumbers(),
      highlightActiveLineGutter(),
      highlightActiveLine(),
      history(),
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      ...(language === 'json' ? [json()] : []),
      darkTheme,
      syntaxHighlighting(darkHighlight, { fallback: true }),
      EditorView.lineWrapping,
      EditorState.readOnly.of(readOnly),
      EditorView.editable.of(!readOnly),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) onChangeRef.current?.(update.state.doc.toString());
      }),
      ...(lintRef.current ? [linter((view) => lintRef.current?.(view.state.doc.toString()) ?? []), lintGutter()] : []),
      highlightCompartment.of(buildHighlight(highlightRegexRef.current)),
      ...(placeholder ? [cmPlaceholder(placeholder)] : []),
    ];

    const view = new EditorView({
      state: EditorState.create({ doc: value, extensions }),
      parent: containerRef.current,
    });
    viewRef.current = view;
    if (editorRef) editorRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
      highlightCompartmentRef.current = null;
      if (editorRef) editorRef.current = null;
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

  // 高亮正则变化时经 Compartment 重配置（reconfigure 空扩展等价于移除高亮）
  useEffect(() => {
    const view = viewRef.current;
    const compartment = highlightCompartmentRef.current;
    if (view && compartment) {
      view.dispatch({ effects: compartment.reconfigure(buildHighlight(highlightRegex)) });
    }
  }, [highlightRegex]);

  return <div className={styles.editor} ref={containerRef} />;
}
