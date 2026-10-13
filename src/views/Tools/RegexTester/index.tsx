import { useMemo, useState } from 'react';
import { App, Checkbox, Input, Table, Tag, Tooltip } from 'antd';
import CodeEditor from 'Components/CodeEditor';
import {
  FLAG_OPTIONS,
  MAX_TABLE_ROWS,
  MAX_TEXT_LENGTH,
  MatchRow,
  REGEX_TEMPLATES,
  buildRegex,
  canMatchEmpty,
  collectMatches,
} from './utils';
import styles from './index.module.less';

const DEFAULT_TEXT =
  '订单 tel=13812345678 已确认，联系 backup@example.com 或 admin@lol-f.dev，详见 https://lol-f.dev/tools/regex';

function RegexTesterInner() {
  const { message } = App.useApp();
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<string[]>(['g']);
  const [text, setText] = useState(DEFAULT_TEXT);

  // 派生链：正则构造 → 防护判断 → 匹配统计 / 高亮 regex
  const regexResult = useMemo(() => (pattern ? buildRegex(pattern, flags) : null), [pattern, flags]);

  const tooLong = text.length > MAX_TEXT_LENGTH;
  const matchesEmpty = useMemo(
    () => (regexResult?.ok && !tooLong ? canMatchEmpty(regexResult.regex) : false),
    [regexResult, tooLong],
  );

  const summary = useMemo(() => {
    if (!regexResult?.ok || tooLong || !text) return null;
    try {
      return collectMatches(regexResult.regex, text);
    } catch (err) {
      // 兜底：病态正则运行期异常（如引擎内部错误）不白屏
      message.error(`匹配执行失败：${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regexResult, text, tooLong]);

  // 高亮用 regex 恒带 g；空匹配正则跳过高亮（MatchDecorator 对空匹配会死循环）
  const highlightRegex = useMemo(() => {
    if (!regexResult?.ok || tooLong || matchesEmpty || !text) return null;
    const flagsWithG = regexResult.regex.global ? regexResult.regex.flags : `${regexResult.regex.flags}g`;
    try {
      return new RegExp(regexResult.regex.source, flagsWithG);
    } catch {
      return null;
    }
  }, [regexResult, tooLong, matchesEmpty, text]);

  const error = regexResult && !regexResult.ok ? regexResult.error : null;

  const applyTemplate = (name: string) => {
    const tpl = REGEX_TEMPLATES.find((t) => t.name === name);
    if (!tpl) return;
    setPattern(tpl.pattern);
    setFlags(tpl.flags);
  };

  // 表格列：# / 匹配全文 / 组 1…N（N 取首行组数）
  const groupCount = summary?.rows[0]?.groups.length ?? 0;
  const columns = [
    { title: '#', dataIndex: 'index', width: 56 },
    { title: '匹配全文', dataIndex: 'full' },
    ...Array.from({ length: groupCount }, (_, i) => ({
      title: `组 ${i + 1}`,
      dataIndex: `group${i}`,
    })),
  ];
  const tableData = (summary?.rows ?? []).map((row: MatchRow) => {
    const record: Record<string, string | number> = { key: row.index, index: row.index, full: row.full };
    row.groups.forEach((g, i) => {
      record[`group${i}`] = g ?? '-';
    });
    return record;
  });

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>正则表达式测试</div>

      <div className={styles['pattern-row']}>
        <span className={styles.slash}>/</span>
        <Input
          className={styles['pattern-input']}
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="输入正则图案，如 (\w+)@(\w+)\.com"
          status={error ? 'error' : ''}
          allowClear
        />
        <span className={styles.slash}>/</span>
        <Checkbox.Group value={flags} onChange={(v) => setFlags(v as string[])} className={styles.flags}>
          {FLAG_OPTIONS.map((f) => (
            <Tooltip key={f.value} title={f.title}>
              <Checkbox value={f.value}>{f.label}</Checkbox>
            </Tooltip>
          ))}
        </Checkbox.Group>
      </div>
      {error && <div className={styles.invalid}>{error}</div>}

      <div className={styles.templates}>
        <span className={styles.note}>常用模板：</span>
        {REGEX_TEMPLATES.map((t) => (
          <Tag key={t.name} className={styles.template} onClick={() => applyTemplate(t.name)}>
            {t.name}
          </Tag>
        ))}
      </div>

      <div className={styles['pane-title']}>测试文本</div>
      <div className={styles.editor}>
        <CodeEditor
          language="text"
          value={text}
          onChange={setText}
          placeholder="粘贴或输入要测试的文本…"
          highlightRegex={highlightRegex}
        />
      </div>

      <div className={styles.statusbar}>
        <span>文本 {text.length} 字符</span>
        {' | '}
        {tooLong ? (
          <span className={styles.invalid}>文本超过 {MAX_TEXT_LENGTH.toLocaleString()} 字符，已跳过匹配与高亮</span>
        ) : error ? (
          <span>修正正则后自动恢复匹配</span>
        ) : !pattern ? (
          <span>输入正则后实时匹配</span>
        ) : summary ? (
          <span>
            命中 {summary.total.toLocaleString()} 个匹配
            {summary.totalCapped && '（已达统计上限）'}
            {summary.truncated && `，表格仅显示前 ${MAX_TABLE_ROWS} 条`}
            {matchesEmpty && '；该正则可匹配空串，已跳过编辑器高亮'}
          </span>
        ) : (
          <span>无匹配</span>
        )}
      </div>

      {summary && summary.rows.length > 0 && (
        <Table
          className={styles.table}
          size="small"
          columns={columns}
          dataSource={tableData}
          pagination={false}
          scroll={{ y: 240 }}
        />
      )}
    </div>
  );
}

export default function RegexTester() {
  return (
    <App>
      <RegexTesterInner />
    </App>
  );
}
