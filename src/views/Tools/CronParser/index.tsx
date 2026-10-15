import { useEffect, useMemo, useState } from 'react';
import { Alert, App, Button, Input, Segmented, Table, Tag } from 'antd';
import { getNextExecutions, gmtOffsetLabel, parseCron } from './utils';
import styles from './index.module.less';

const PRESETS = [
  { label: '每分钟', value: '* * * * *' },
  { label: '每小时', value: '0 * * * *' },
  { label: '每天零点', value: '0 0 * * *' },
  { label: '每天 9:30', value: '30 9 * * *' },
  { label: '工作日 9 点', value: '0 9 * * 1-5' },
  { label: '每周一', value: '0 9 * * 1' },
  { label: '每月 1 号', value: '0 0 1 * *' },
  { label: '每年元旦', value: '0 0 1 1 *' },
];

const FIELD_COLUMNS = [
  {
    title: '段',
    key: 'index',
    width: 88,
    render: (_: unknown, r: { index: number; label: string }) => `第 ${r.index} 段 · ${r.label}`,
  },
  { title: '原始值', dataIndex: 'raw', key: 'raw', width: 140, className: styles['mono-cell'] },
  { title: '含义', dataIndex: 'meaning', key: 'meaning', width: 200 },
  { title: '取值集合', dataIndex: 'values', key: 'values', className: styles['mono-cell'] },
];

function CronParserInner() {
  const { message } = App.useApp();
  const [input, setInput] = useState('0 9 * * 1-5');
  const [count, setCount] = useState<number>(10);

  const outcome = useMemo(() => parseCron(input), [input]);

  // 未来执行时间：normalized 由取值集合重建，cron-parser 理论上不会再抛错；
  // 仍兜底（计算失败/空序列）为页面内 Alert，toast 放 effect 避免 render 副作用
  const execResult = useMemo<{ times: string[] | null; error: string | null }>(() => {
    if (outcome.status !== 'ok') return { times: null, error: null };
    try {
      return { times: getNextExecutions(outcome.normalized, count), error: null };
    } catch (e) {
      return { times: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [outcome, count]);

  useEffect(() => {
    if (execResult.error) message.error(`执行时间计算失败：${execResult.error}`);
  }, [execResult, message]);

  const copy = async () => {
    if (!input.trim()) {
      message.warning('表达式为空，无可复制内容');
      return;
    }
    try {
      await navigator.clipboard.writeText(input);
      message.success('已复制表达式');
    } catch {
      message.error('复制失败，请检查浏览器剪贴板权限');
    }
  };

  const offset = gmtOffsetLabel();

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>Cron 解析</div>

      <div className={styles.card}>
        <div className={styles['card-label']}>Cron 表达式（5 段：分 时 日 月 周；6 段含秒自动识别）</div>
        <div className={styles['input-row']}>
          <Input
            className={styles['mono-input']}
            placeholder="如 */5 * * * * 或 0 9 * * 1-5"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            status={outcome.status === 'error' ? 'error' : undefined}
          />
          <Button onClick={copy} disabled={!input.trim()}>
            复制表达式
          </Button>
        </div>
        <div className={styles.presets}>
          <span className={styles['presets-label']}>常用：</span>
          {PRESETS.map((p) => (
            <Tag key={p.value} className={styles['preset-tag']} onClick={() => setInput(p.value)}>
              {p.label}
            </Tag>
          ))}
        </div>
      </div>

      {outcome.status === 'error' && <Alert className={styles.alert} type="error" showIcon title={outcome.message} />}

      {outcome.status === 'ok' && (
        <>
          <div className={styles.card}>
            <div className={styles['card-label']}>人类可读描述</div>
            <div className={styles.description}>{outcome.description}</div>
          </div>

          <div className={styles.card}>
            <div className={styles['exec-header']}>
              <span className={styles['card-label']}>未来执行时间 · 按本地时区（{offset}）计算</span>
              <Segmented
                size="small"
                value={count}
                onChange={(v) => setCount(v as number)}
                options={[
                  { label: '未来 5 次', value: 5 },
                  { label: '未来 10 次', value: 10 },
                  { label: '未来 20 次', value: 20 },
                ]}
              />
            </div>
            {execResult.error && <Alert type="error" showIcon title={`执行时间计算失败：${execResult.error}`} />}
            {!execResult.error && execResult.times && execResult.times.length === 0 && (
              <Alert type="warning" showIcon title="该表达式在未来可预见的年份内不会触发" />
            )}
            {!execResult.error && execResult.times && execResult.times.length > 0 && (
              <ol className={styles['exec-list']}>
                {execResult.times.map((t, i) => (
                  <li key={`${t}-${i}`} className={styles['exec-item']}>
                    <span className={styles['exec-index']}>{i + 1}</span>
                    <span className={styles['exec-time']}>{t}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className={styles.card}>
            <div className={styles['card-label']}>字段分解</div>
            <Table size="small" rowKey="index" pagination={false} columns={FIELD_COLUMNS} dataSource={outcome.fields} />
          </div>
        </>
      )}
    </div>
  );
}

export default function CronParser() {
  return (
    <App>
      <CronParserInner />
    </App>
  );
}
