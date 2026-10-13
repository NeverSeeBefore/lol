import { useMemo, useState } from 'react';
import { App, Button, Segmented, Space } from 'antd';
import CodeEditor from 'Components/CodeEditor';
import { CodecResult, decodeBase64, decodeUrl, encodeBase64, encodeUrl } from './utils';
import styles from './index.module.less';

type Mode = 'b64-encode' | 'b64-decode' | 'url-encode' | 'url-decode';

const modeOptions: { value: Mode; label: string }[] = [
  { value: 'b64-encode', label: 'Base64 编码' },
  { value: 'b64-decode', label: 'Base64 解码' },
  { value: 'url-encode', label: 'URL 编码' },
  { value: 'url-decode', label: 'URL 解码' },
];

const modeMeta: Record<Mode, { inputPlaceholder: string; convert: (text: string) => CodecResult }> = {
  'b64-encode': { inputPlaceholder: '输入任意文本（中文/emoji 安全）…', convert: encodeBase64 },
  'b64-decode': { inputPlaceholder: '粘贴 Base64（容忍 URL-safe 变体与缺失 padding）…', convert: decodeBase64 },
  'url-encode': { inputPlaceholder: '输入要放进 URL 参数的文本…', convert: encodeUrl },
  'url-decode': { inputPlaceholder: '粘贴 URL 编码文本（+ 按 form 约定还原为空格）…', convert: decodeUrl },
};

function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

function statOf(text: string): string {
  return `${text.length} 字符 / ${utf8Bytes(text)} 字节`;
}

function Base64UrlCodecInner() {
  const { message } = App.useApp();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('b64-encode');

  // 输入即转换：output/error 全部由 useMemo 派生，切模式自动重算
  const result = useMemo<CodecResult | null>(() => (input ? modeMeta[mode].convert(input) : null), [input, mode]);
  const output = result?.ok ? result.result : '';
  const error = result && !result.ok ? result.error : null;

  const copy = async () => {
    if (!output) {
      message.warning('输出区为空');
      return;
    }
    await navigator.clipboard.writeText(output);
    message.success('已复制到剪贴板');
  };

  const clear = () => setInput('');

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>Base64/URL 编解码</div>

      <Space className={styles.toolbar} wrap>
        <Segmented<Mode> value={mode} options={modeOptions} onChange={setMode} />
        <Button onClick={copy}>复制</Button>
        <Button danger onClick={clear}>
          清空
        </Button>
        <span className={styles.note}>URL 编码空格为 %20；解码时 + 按 form 约定还原为空格</span>
      </Space>

      <div className={styles.panes}>
        <div className={styles.pane}>
          <div className={styles['pane-title']}>输入</div>
          <div className={styles['pane-editor']}>
            <CodeEditor
              language="text"
              value={input}
              onChange={setInput}
              placeholder={modeMeta[mode].inputPlaceholder}
            />
          </div>
        </div>
        <div className={styles.pane}>
          <div className={styles['pane-title']}>输出</div>
          <div className={styles['pane-editor']}>
            <CodeEditor language="text" value={output} readOnly placeholder="转换结果将显示在这里" />
          </div>
        </div>
      </div>

      <div className={styles.statusbar}>
        <span>输入 {statOf(input)}</span>
        {' | '}
        <span>输出 {statOf(output)}</span>
        {error && <span className={styles.invalid}> | {error}</span>}
      </div>
    </div>
  );
}

export default function Base64UrlCodec() {
  return (
    <App>
      <Base64UrlCodecInner />
    </App>
  );
}
