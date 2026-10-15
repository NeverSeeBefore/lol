import { useMemo, useState } from 'react';
import { App, Button, Segmented, Space } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import CodeEditor from 'Components/CodeEditor';
import { computeJsonDiff, computeTextDiff, JsonDiffResult, RENDER_MAX_ROWS, scaleOf, TextDiffResult } from './utils';
import styles from './index.module.less';

type Mode = 'text' | 'json';

const modeOptions: { value: Mode; label: string }[] = [
  { value: 'text', label: '文本' },
  { value: 'json', label: 'JSON' },
];

const modeMeta: Record<Mode, { language: 'json' | 'text'; placeholder: string; note: string }> = {
  text: {
    language: 'text',
    placeholder: '粘贴旧文本…',
    note: '行级对比：相邻删+增按行配对为「修改」',
  },
  json: {
    language: 'json',
    placeholder: '粘贴旧 JSON…',
    note: '键序无关；按路径展示变更；类型变化单独标注',
  },
};

/** 文本 diff 结果视图：行号 + +/-//~ 标记 + 三色着色，超 RENDER_MAX_ROWS 截断 */
function TextDiffView({ result }: { result: TextDiffResult }) {
  const rows = result.rows.slice(0, RENDER_MAX_ROWS);
  const cut = result.rows.length - rows.length;
  if (result.rows.length === 0) {
    return <div className={styles.empty}>两侧内容一致，无差异</div>;
  }
  return (
    <div className={styles.result}>
      {result.fallback && <div className={styles['result-note']}>差异过大计算超时，已按整体替换展示</div>}
      {rows.map((row, i) => (
        <div key={i} className={`${styles.row} ${styles[`row-${row.type}`]}`}>
          <span className={styles['line-no']}>{row.oldLine ?? ''}</span>
          <span className={styles['line-no']}>{row.newLine ?? ''}</span>
          <span className={styles.sign}>
            {row.type === 'add' ? '+' : row.type === 'del' ? '-' : row.type === 'mod' ? '~' : ''}
          </span>
          {row.type === 'mod' ? (
            <span className={styles.content}>
              <span className={styles['mod-old']}>{row.text}</span>
              <span className={styles['mod-arrow']}> → </span>
              <span className={styles['mod-new']}>{row.newText}</span>
            </span>
          ) : (
            <span className={styles.content}>{row.text}</span>
          )}
        </div>
      ))}
      {cut > 0 && (
        <div className={styles['result-note']}>
          仅展示前 {RENDER_MAX_ROWS} 行，剩余 {cut} 行已截断
        </div>
      )}
    </div>
  );
}

const kindLabel: Record<string, string> = { add: '新增', del: '删除', mod: '修改' };

/** JSON 语义 diff 结果视图：变更列表（badge + 路径 + old → new） */
function JsonDiffView({ result }: { result: JsonDiffResult }) {
  if (!result.ok) {
    return <div className={styles['result-error']}>{result.error}</div>;
  }
  if (result.changes.length === 0) {
    return <div className={styles.empty}>两侧 JSON 语义一致，无差异</div>;
  }
  return (
    <div className={styles.result}>
      {result.changes.map((c, i) => (
        <div key={i} className={`${styles.row} ${styles[`row-${c.kind}`]}`}>
          <span className={`${styles.badge} ${styles[`badge-${c.kind}`]}`}>{kindLabel[c.kind]}</span>
          <span className={styles.path}>{c.path}</span>
          {c.typeChanged && <span className={styles['type-changed']}>类型变化</span>}
          <span className={styles.content}>
            {c.kind !== 'add' && <span className={styles['mod-old']}>{c.oldValue}</span>}
            {c.kind === 'mod' && <span className={styles['mod-arrow']}> → </span>}
            {c.kind !== 'del' && <span className={styles['mod-new']}>{c.newValue}</span>}
          </span>
        </div>
      ))}
      {result.truncated && <div className={styles['result-note']}>变更过多，仅展示前 {result.changes.length} 条</div>}
    </div>
  );
}

function SemanticDiffInner() {
  const { message } = App.useApp();
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  const [mode, setMode] = useState<Mode>('text');
  // 手动模式的输入快照：null 表示尚未手动触发
  const [snapshot, setSnapshot] = useState<{ old: string; new: string } | null>(null);

  const scale = scaleOf(oldText, newText);
  const manual = scale === 'manual';

  // 实时模式直接派生；手动模式用快照（点「对比」时冻结当前输入）
  const effective = manual ? snapshot : { old: oldText, new: newText };

  const textResult = useMemo<TextDiffResult | null>(() => {
    if (mode !== 'text' || scale === 'over' || !effective) return null;
    if (!effective.old && !effective.new) return null;
    return computeTextDiff(effective.old, effective.new);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, effective?.old, effective?.new, scale]);

  const jsonResult = useMemo<JsonDiffResult | null>(() => {
    if (mode !== 'json' || scale === 'over' || !effective) return null;
    if (!effective.old && !effective.new) return null;
    return computeJsonDiff(effective.old, effective.new);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, effective?.old, effective?.new, scale]);

  const stats = mode === 'text' ? textResult?.stats : jsonResult?.ok ? jsonResult.stats : undefined;

  const swap = () => {
    setOldText(newText);
    setNewText(oldText);
    setSnapshot(null);
  };

  const clear = () => {
    setOldText('');
    setNewText('');
    setSnapshot(null);
  };

  const compare = () => {
    setSnapshot({ old: oldText, new: newText });
    message.success('已完成对比');
  };

  const statsText = stats
    ? mode === 'text'
      ? `+${stats.added} 行 / -${stats.removed} 行 / 修改 ${stats.modified} 处`
      : `+${stats.added} 键 / -${stats.removed} 键 / 修改 ${stats.modified} 处`
    : null;

  const meta = modeMeta[mode];

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>Diff 对比</div>

      <Space className={styles.toolbar} wrap>
        <Segmented<Mode>
          value={mode}
          options={modeOptions}
          onChange={(m) => {
            setMode(m);
            setSnapshot(null);
          }}
        />
        {manual && (
          <Button type="primary" onClick={compare}>
            对比
          </Button>
        )}
        <Button icon={<SwapOutlined />} onClick={swap}>
          交换左右
        </Button>
        <Button danger onClick={clear}>
          清空
        </Button>
        <span className={styles.note}>{meta.note}</span>
      </Space>

      <div className={styles.panes}>
        <div className={styles.pane}>
          <div className={styles['pane-title']}>旧（左）</div>
          <div className={styles['pane-editor']}>
            <CodeEditor
              key={`old-${mode}`}
              language={meta.language}
              value={oldText}
              onChange={setOldText}
              placeholder={meta.placeholder}
            />
          </div>
        </div>
        <div className={styles.pane}>
          <div className={styles['pane-title']}>新（右）</div>
          <div className={styles['pane-editor']}>
            <CodeEditor
              key={`new-${mode}`}
              language={meta.language}
              value={newText}
              onChange={setNewText}
              placeholder={mode === 'json' ? '粘贴新 JSON…' : '粘贴新文本…'}
            />
          </div>
        </div>
      </div>

      <div className={styles['diff-view']}>
        {scale === 'over' ? (
          <div className={styles['result-error']}>输入超过上限（合计 3 万行 / 3MB），请缩小后重试</div>
        ) : manual && !snapshot ? (
          <div className={styles.empty}>输入较大，已关闭实时对比，点击「对比」按钮查看结果</div>
        ) : mode === 'text' ? (
          textResult ? (
            <TextDiffView result={textResult} />
          ) : (
            <div className={styles.empty}>在两侧输入内容，差异将显示在这里</div>
          )
        ) : jsonResult ? (
          <JsonDiffView result={jsonResult} />
        ) : (
          <div className={styles.empty}>在两侧输入内容，差异将显示在这里</div>
        )}
      </div>

      <div className={styles.statusbar}>
        <span>旧 {oldText.length} 字符</span>
        {' | '}
        <span>新 {newText.length} 字符</span>
        {manual && <span> | 手动模式（输入较大）</span>}
        {statsText && <span> | {statsText}</span>}
        {jsonResult && !jsonResult.ok && <span className={styles.invalid}> | {jsonResult.error}</span>}
      </div>
    </div>
  );
}

export default function SemanticDiff() {
  return (
    <App>
      <SemanticDiffInner />
    </App>
  );
}
