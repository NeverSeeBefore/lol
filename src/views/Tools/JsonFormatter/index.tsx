import { useMemo, useState } from 'react';
import { App, Button, Select, Space, Switch } from 'antd';
import { Diagnostic } from '@codemirror/lint';
import CodeEditor from 'Components/CodeEditor';
import { formatJson, Indent, JsonError, jsonErrorToDiagnostic, minifyJson, parseJson } from 'Utils/jsonFormat';
import styles from './index.module.less';

const indentOptions = [
  { value: 2, label: '2 空格' },
  { value: 4, label: '4 空格' },
  { value: 'tab', label: 'Tab' },
];

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function JsonFormatterInner() {
  const { message } = App.useApp();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState<Indent>(2);
  const [tolerant, setTolerant] = useState(false);
  const [error, setError] = useState<JsonError | null>(null);

  // 输入的实时校验结果（状态栏 + 错误展示共用）
  const parsed = useMemo(() => (input.trim() ? parseJson(input, { tolerant }) : null), [input, tolerant]);

  // CodeMirror lint：把解析错误转为行内标记；注意必须用传入的 doc 而非闭包中的 input
  const lint = useMemo(
    () =>
      (doc: string): Diagnostic[] => {
        if (!doc.trim()) return [];
        const result = parseJson(doc, { tolerant });
        if (result.ok) return [];
        const diagnostic = jsonErrorToDiagnostic(result.error, doc);
        return diagnostic ? [diagnostic] : [];
      },
    [tolerant],
  );

  const run = (action: 'format' | 'minify') => {
    if (!input.trim()) {
      message.warning('请先输入 JSON');
      return;
    }
    const opts = { indent, tolerant };
    const result = action === 'format' ? formatJson(input, opts) : minifyJson(input, opts);
    if (result.ok) {
      setOutput(result.result);
      setError(null);
    } else {
      setError(result.error);
      message.error('解析失败：' + result.error.message);
    }
  };

  const copy = async () => {
    if (!output) {
      message.warning('输出区为空');
      return;
    }
    await navigator.clipboard.writeText(output);
    message.success('已复制到剪贴板');
  };

  const download = () => {
    if (!output) {
      message.warning('输出区为空');
      return;
    }
    const url = URL.createObjectURL(new Blob([output], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    setInput('');
    setOutput('');
    setError(null);
  };

  const size = new Blob([input]).size;
  const lineCount = input ? input.split('\n').length : 0;
  const statusText = !input.trim() ? 'empty' : parsed?.ok ? 'valid JSON' : 'invalid JSON';
  const errorPosition = error && typeof error.line === 'number' ? `（Ln ${error.line}, Col ${error.column}）` : '';

  return (
    <div className={styles.wrap}>
      <Space className={styles.toolbar} wrap>
        <Button type="primary" onClick={() => run('format')}>
          格式化
        </Button>
        <Button onClick={() => run('minify')}>压缩</Button>
        <span>
          缩进：
          <Select<Indent> value={indent} options={indentOptions} onChange={setIndent} style={{ width: 96 }} />
        </span>
        <span>
          容错模式：
          <Switch checked={tolerant} onChange={setTolerant} />
        </span>
        <Button onClick={copy}>复制</Button>
        <Button onClick={download}>下载</Button>
        <Button danger onClick={clear}>
          清空
        </Button>
      </Space>

      <div className={styles.panes}>
        <div className={styles.pane}>
          <div className={styles['pane-title']}>输入</div>
          <div className={styles['pane-editor']}>
            <CodeEditor value={input} onChange={setInput} lint={lint} placeholder="粘贴 JSON 到这里…" />
          </div>
        </div>
        <div className={styles.pane}>
          <div className={styles['pane-title']}>输出</div>
          <div className={styles['pane-editor']}>
            <CodeEditor value={output} readOnly placeholder="格式化结果将显示在这里" />
          </div>
        </div>
      </div>

      <div className={styles.statusbar}>
        <span className={parsed && !parsed.ok ? styles.invalid : styles.valid}>{statusText}</span>
        {' | '}
        {formatSize(size)} | {lineCount} lines
        {error && (
          <span className={styles.invalid}>
            {' | '}
            {error.message}
            {errorPosition}
          </span>
        )}
      </div>
    </div>
  );
}

export default function JsonFormatter() {
  return (
    <App>
      <JsonFormatterInner />
    </App>
  );
}
