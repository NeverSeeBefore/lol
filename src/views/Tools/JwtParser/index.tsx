import { useMemo, useState } from 'react';
import { Alert, App, Button } from 'antd';
import CodeEditor from 'Components/CodeEditor';
import { extractTimeClaims, parseJwt, SegmentResult } from './utils';
import styles from './index.module.less';

function JwtParserInner() {
  const { message } = App.useApp();
  const [input, setInput] = useState('');

  // 输入即解析：结果全部由 useMemo 派生，空输入不报错
  const result = useMemo(() => (input.trim() ? parseJwt(input) : null), [input]);
  const claims = useMemo(
    () => (result?.ok && result.payload.ok ? extractTimeClaims(result.payload.data) : []),
    [result],
  );

  const copy = async (text: string, label: string) => {
    if (!text) {
      message.warning(`${label}为空，无可复制内容`);
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      message.success(`已复制${label}`);
    } catch {
      message.error('复制失败：浏览器拒绝了剪贴板写入（需用户授权或安全上下文），请手动选择文本复制');
    }
  };

  const renderSegment = (title: string, segment: SegmentResult | undefined) => (
    <div className={styles.section}>
      <div className={styles['section-head']}>
        <span className={styles['section-title']}>{title}</span>
        <Button disabled={!segment?.ok} size="small" onClick={() => void copy(segment?.ok ? segment.json : '', title)}>
          复制
        </Button>
      </div>
      {segment?.ok ? (
        <div className={styles.editor}>
          <CodeEditor language="json" value={segment.json} readOnly />
        </div>
      ) : (
        segment && <div className={styles.error}>{segment.error}</div>
      )}
    </div>
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>JWT 本地解析器</div>

      <Alert className={styles.privacy} message="纯本地解析，token 不会离开浏览器" showIcon type="info" />

      <div className={styles['input-pane']}>
        <div className={styles['pane-title']}>输入 JWT</div>
        <div className={styles['input-editor']}>
          <CodeEditor
            language="text"
            value={input}
            onChange={setInput}
            placeholder="粘贴 JWT（header.payload.signature）…"
          />
        </div>
      </div>

      {result && !result.ok && <div className={styles.error}>{result.error}</div>}

      {result?.ok && (
        <div className={styles.results}>
          {renderSegment('Header', result.header)}
          {renderSegment('Payload', result.payload)}

          {claims.length > 0 && (
            <div className={styles.claims}>
              {claims.map((claim) => (
                <div className={styles['claim-row']} key={claim.key}>
                  <span className={styles['claim-key']}>{claim.key}</span>
                  <span className={styles['claim-raw']}>{claim.raw}</span>
                  <span>本地 {claim.local}</span>
                  <span>UTC {claim.utc}</span>
                  {claim.statusText && (
                    <span className={claim.expired ? styles.expired : styles.valid}>{claim.statusText}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className={styles.section}>
            <div className={styles['section-head']}>
              <span className={styles['section-title']}>
                Signature
                <span className={styles['no-verify']}>不验证签名</span>
              </span>
              <Button
                disabled={!result.signature}
                size="small"
                onClick={() => void copy(result.signature, 'Signature')}
              >
                复制
              </Button>
            </div>
            <div className={styles.signature}>{result.signature || '（签名段为空）'}</div>
            <div className={styles.note}>仅展示原始签名段——解析成功不代表 token 可信</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JwtParser() {
  return (
    <App>
      <JwtParserInner />
    </App>
  );
}
