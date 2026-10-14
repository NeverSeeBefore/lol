import { useMemo, useState } from 'react';
import { App, Button, Segmented, Space } from 'antd';
import CodeEditor from 'Components/CodeEditor';
import { CodecResult, convertJsonToYaml, convertYamlToJson } from './utils';
import styles from './index.module.less';

type Mode = 'yaml-to-json' | 'json-to-yaml';

const modeOptions: { value: Mode; label: string }[] = [
  { value: 'yaml-to-json', label: 'YAML → JSON' },
  { value: 'json-to-yaml', label: 'JSON → YAML' },
];

const modeMeta: Record<
  Mode,
  {
    inputPlaceholder: string;
    /** CodeEditor language 仅挂载时读取，切换方向经 key={mode} 重挂载换语言 */
    inputLanguage: 'json' | 'text';
    outputLanguage: 'json' | 'text';
    note: string;
    convert: (text: string) => CodecResult;
  }
> = {
  'yaml-to-json': {
    inputPlaceholder: '粘贴 YAML（支持多文档 ---、锚点 &ref/*ref；注释不会保留）…',
    inputLanguage: 'text',
    outputLanguage: 'json',
    note: 'YAML 注释不会保留；多文档（---）将合并为 JSON 数组',
    convert: convertYamlToJson,
  },
  'json-to-yaml': {
    inputPlaceholder: '粘贴 JSON…',
    inputLanguage: 'json',
    outputLanguage: 'text',
    note: '输出为 2 空格缩进 YAML',
    convert: convertJsonToYaml,
  },
};

function utf8Bytes(text: string): number {
  return new TextEncoder().encode(text).length;
}

function statOf(text: string): string {
  return `${text.length} 字符 / ${utf8Bytes(text)} 字节`;
}

function YamlJsonConverterInner() {
  const { message } = App.useApp();
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<Mode>('yaml-to-json');

  // 输入即转换：output/error 全部由 useMemo 派生，切方向自动重算
  const result = useMemo<CodecResult | null>(() => (input ? modeMeta[mode].convert(input) : null), [input, mode]);
  const output = result?.ok ? result.result : '';
  const error = result && !result.ok ? result.error : null;
  const docCount = result?.ok ? result.docCount : undefined;

  const copy = async () => {
    if (!output) {
      message.warning('输出区为空');
      return;
    }
    await navigator.clipboard.writeText(output);
    message.success('已复制到剪贴板');
  };

  const clear = () => setInput('');

  const meta = modeMeta[mode];

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>YAML/JSON 转换</div>

      <Space className={styles.toolbar} wrap>
        <Segmented<Mode> value={mode} options={modeOptions} onChange={setMode} />
        <Button onClick={copy}>复制</Button>
        <Button danger onClick={clear}>
          清空
        </Button>
        <span className={styles.note}>{meta.note}</span>
      </Space>

      <div className={styles.panes}>
        <div className={styles.pane}>
          <div className={styles['pane-title']}>输入（{mode === 'yaml-to-json' ? 'YAML' : 'JSON'}）</div>
          <div className={styles['pane-editor']}>
            <CodeEditor
              key={`in-${mode}`}
              language={meta.inputLanguage}
              value={input}
              onChange={setInput}
              placeholder={meta.inputPlaceholder}
            />
          </div>
        </div>
        <div className={styles.pane}>
          <div className={styles['pane-title']}>输出（{mode === 'yaml-to-json' ? 'JSON' : 'YAML'}）</div>
          <div className={styles['pane-editor']}>
            <CodeEditor
              key={`out-${mode}`}
              language={meta.outputLanguage}
              value={output}
              readOnly
              placeholder="转换结果将显示在这里"
            />
          </div>
        </div>
      </div>

      <div className={styles.statusbar}>
        <span>输入 {statOf(input)}</span>
        {' | '}
        <span>输出 {statOf(output)}</span>
        {docCount !== undefined && docCount > 1 && <span> | 输入含 {docCount} 个文档，已合并为 JSON 数组</span>}
        {error && <span className={styles.invalid}> | {error}</span>}
      </div>
    </div>
  );
}

export default function YamlJsonConverter() {
  return (
    <App>
      <YamlJsonConverterInner />
    </App>
  );
}
