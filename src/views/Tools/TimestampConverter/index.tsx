import { useEffect, useState } from 'react';
import { App, Button, Input } from 'antd';
import { batchReplace, formatDateTime, parseDateTime, parseTimestamp, utcOffsetLabel } from './utils';
import styles from './index.module.less';

interface TsToDateResult {
  precisionLabel: string;
  local: string;
  utc: string;
}

interface DateToTsResult {
  s: string;
  ms: string;
}

function TimestampConverterInner() {
  const { message } = App.useApp();

  // ---- 当前时间戳卡片 ----
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const nowSec = Math.floor(now / 1000);

  // ---- 时间戳 → 日期 ----
  const [tsInput, setTsInput] = useState('');
  const [tsResult, setTsResult] = useState<TsToDateResult | null>(null);

  const convertTs = () => {
    const parsed = parseTimestamp(tsInput);
    if (!parsed.ok) {
      message.error(parsed.reason);
      return;
    }
    const date = new Date(parsed.ms);
    setTsResult({
      local: formatDateTime(date),
      precisionLabel: parsed.precision === 's' ? '秒' : '毫秒',
      utc: formatDateTime(date, 'UTC'),
    });
  };

  // ---- 日期 → 时间戳 ----
  const [dateInput, setDateInput] = useState('');
  const [dateResult, setDateResult] = useState<DateToTsResult | null>(null);

  const convertDate = () => {
    const parsed = parseDateTime(dateInput);
    if (!parsed.ok) {
      message.error(parsed.reason);
      return;
    }
    const ms = parsed.date.getTime();
    setDateResult({ ms: String(ms), s: String(Math.floor(ms / 1000)) });
  };

  // ---- 批量模式 ----
  const [batchInput, setBatchInput] = useState('');
  const [batchOutput, setBatchOutput] = useState('');
  const [batchCount, setBatchCount] = useState<number | null>(null);

  const runBatch = () => {
    if (!batchInput.trim()) {
      message.warning('请先粘贴日志文本');
      return;
    }
    const result = batchReplace(batchInput);
    setBatchOutput(result.text);
    setBatchCount(result.count);
    if (result.count === 0) {
      message.warning('未识别到时间戳：批量模式匹配 10 位（秒）或 13 位（毫秒）纯数字串');
    }
  };

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    message.success(`已复制 ${label}`);
  };

  const offset = utcOffsetLabel();

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>时间戳转换</div>

      <div className={styles.card}>
        <div className={styles['card-label']}>当前时间戳</div>
        <div className={styles['now-rows']}>
          <div className={styles['now-row']}>
            <span className={styles['now-value']}>{nowSec}</span>
            <span className={styles['now-unit']}>秒</span>
            <Button size="small" onClick={() => copy(String(nowSec), '秒级时间戳')}>
              复制
            </Button>
          </div>
          <div className={styles['now-row']}>
            <span className={styles['now-value']}>{now}</span>
            <span className={styles['now-unit']}>毫秒</span>
            <Button size="small" onClick={() => copy(String(now), '毫秒级时间戳')}>
              复制
            </Button>
          </div>
        </div>
      </div>

      <div className={styles['convert-panels']}>
        <div className={styles.card}>
          <div className={styles['card-label']}>时间戳 → 日期</div>
          <div className={styles['input-row']}>
            <Input
              className={styles['mono-input']}
              placeholder="如 1735689600（自动识别秒/毫秒）"
              value={tsInput}
              onChange={(e) => setTsInput(e.target.value)}
              onPressEnter={convertTs}
            />
            <Button type="primary" onClick={convertTs}>
              转换
            </Button>
          </div>
          {tsResult && (
            <div className={styles.results}>
              <div className={styles['result-note']}>识别为{tsResult.precisionLabel}级时间戳</div>
              <div className={styles['result-row']}>
                <span className={styles['result-label']}>本地（{offset}）</span>
                <span className={styles['result-value']}>{tsResult.local}</span>
                <Button size="small" onClick={() => copy(tsResult.local, '本地时间')}>
                  复制
                </Button>
              </div>
              <div className={styles['result-row']}>
                <span className={styles['result-label']}>UTC</span>
                <span className={styles['result-value']}>{tsResult.utc}</span>
                <Button size="small" onClick={() => copy(tsResult.utc, 'UTC 时间')}>
                  复制
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.card}>
          <div className={styles['card-label']}>日期 → 时间戳</div>
          <div className={styles['input-row']}>
            <Input
              className={styles['mono-input']}
              placeholder="如 2025-01-01 08:00:00（本地时区）"
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              onPressEnter={convertDate}
            />
            <Button type="primary" onClick={convertDate}>
              转换
            </Button>
          </div>
          {dateResult && (
            <div className={styles.results}>
              <div className={styles['result-row']}>
                <span className={styles['result-label']}>秒</span>
                <span className={styles['result-value']}>{dateResult.s}</span>
                <Button size="small" onClick={() => copy(dateResult.s, '秒级时间戳')}>
                  复制
                </Button>
              </div>
              <div className={styles['result-row']}>
                <span className={styles['result-label']}>毫秒</span>
                <span className={styles['result-value']}>{dateResult.ms}</span>
                <Button size="small" onClick={() => copy(dateResult.ms, '毫秒级时间戳')}>
                  复制
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles['card-label']}>批量模式 · 日志时间戳就地替换</div>
        <Input.TextArea
          className={styles['batch-input']}
          placeholder={
            '粘贴多行日志文本，其中的 10 位（秒）/ 13 位（毫秒）时间戳将被替换为本地可读时间\n如：request at 1735689600 done'
          }
          rows={4}
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
        />
        <div className={styles['batch-actions']}>
          <Button type="primary" onClick={runBatch}>
            转换
          </Button>
          {batchCount !== null && <span className={styles['batch-count']}>已替换 {batchCount} 处</span>}
          {batchOutput && (
            <Button size="small" onClick={() => copy(batchOutput, '批量结果')}>
              复制结果
            </Button>
          )}
        </div>
        {batchOutput && <Input.TextArea className={styles['batch-output']} readOnly rows={4} value={batchOutput} />}
      </div>
    </div>
  );
}

export default function TimestampConverter() {
  return (
    <App>
      <TimestampConverterInner />
    </App>
  );
}
