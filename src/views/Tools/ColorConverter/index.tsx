import { useCallback, useEffect, useMemo, useState } from 'react';
import { App, Button, Input } from 'antd';
import ColorBoard, { BoardColor } from 'Components/ColorBoard';
import {
  compositeOver,
  contrastLevel,
  contrastRatio,
  formatHex,
  formatHsl,
  formatHsv,
  formatRgb,
  parseHex,
  parseHsl,
  parseHsv,
  parseRgb,
  Rgb,
  Rgba,
} from './utils';
import styles from './index.module.less';

/** 默认颜色：与工具专属色 --tool-color 一致（内容数据，非样式色值） */
const DEFAULT_COLOR: Rgba = { r: 167, g: 139, b: 250, a: 1 };
/** --bg-base 的回退值（运行时优先从 CSS 变量读取） */
const FALLBACK_BG: Rgb = [19, 20, 23];

const LEVEL_TEXT: Record<string, string> = {
  AAA: 'AAA',
  AA: 'AA',
  AA_LARGE: 'AA Large（仅大字）',
  FAIL: '不合格',
};

interface FormatRowProps {
  label: string;
  /** 当前颜色的格式化读数 */
  text: string;
  /** 解析用户输入，失败返回 null */
  parse: (input: string) => Rgb | null;
  /** 解析成功后应用新颜色 */
  onApply: (rgb: Rgb) => void;
}

function FormatRow({ label, text, parse, onApply }: FormatRowProps) {
  const { message } = App.useApp();
  // draft 为 null 表示未在编辑，输入框显示格式化读数
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    if (draft === null) return;
    const parsed = parse(draft);
    if (parsed) {
      onApply(parsed);
    } else {
      message.error(`无法解析 ${label} 输入：${draft}`);
    }
    setDraft(null);
  };

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    message.success(`已复制 ${label}`);
  };

  return (
    <div className={styles['format-row']}>
      <span className={styles['row-label']}>{label}</span>
      <Input
        className={styles['row-input']}
        value={draft ?? text}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onPressEnter={commit}
      />
      <Button onClick={copy}>复制</Button>
    </div>
  );
}

function ColorConverterInner() {
  const [color, setColor] = useState<Rgba>(DEFAULT_COLOR);
  const [bg, setBg] = useState<Rgb>(FALLBACK_BG);
  // 手动输入反填时 bump 此 key 重挂载取色板（拖拽不 bump，避免拖拽中重挂载）
  const [boardKey, setBoardKey] = useState(0);

  // 运行时读取站点底色令牌（模块级读取时机过早可能拿到空值）
  useEffect(() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--bg-base').trim();
    const parsed = parseHex(raw);
    if (parsed) setBg(parsed);
  }, []);

  // ColorBoard：defaultValue 仅挂载时读取，外部反填靠 key 重挂载；
  // onChange 只在用户拖拽时触发（useCallback 保持稳定）
  const boardHex = formatHex(color);
  const handleBoardChange = useCallback((c: BoardColor) => {
    setColor({ r: c.rgb[0], g: c.rgb[1], b: c.rgb[2], a: c.opacity });
  }, []);

  const applyRgb = useCallback((rgb: Rgb) => {
    setColor((prev) => ({ r: rgb[0], g: rgb[1], b: rgb[2], a: prev.a }));
    setBoardKey((k) => k + 1);
  }, []);

  // WCAG 对比度：alpha < 1 时先与底色合成
  const composite = useMemo(() => compositeOver(color, bg), [color, bg]);
  const ratio = useMemo(() => contrastRatio(composite, bg), [composite, bg]);
  const level = contrastLevel(ratio);
  const rgbaCss = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>颜色转换</div>
      <div className={styles.main}>
        <div className={styles.board}>
          <ColorBoard key={boardKey} defaultValue={boardHex} defaultOpacity={color.a} onChange={handleBoardChange} />
        </div>
        <div className={styles.panel}>
          <FormatRow label="HEX" text={formatHex(color)} parse={parseHex} onApply={applyRgb} />
          <FormatRow label="RGB" text={formatRgb(color)} parse={parseRgb} onApply={applyRgb} />
          <FormatRow label="HSL" text={formatHsl(color)} parse={parseHsl} onApply={applyRgb} />
          <FormatRow label="HSV" text={formatHsv(color)} parse={parseHsv} onApply={applyRgb} />

          <div className={styles['contrast-card']}>
            <div className={styles['contrast-head']}>
              <span className={styles['contrast-label']}>对比度（相对页面底色）</span>
              <span className={styles.ratio}>{ratio.toFixed(2)}:1</span>
              <span className={styles[`badge-${level.toLowerCase().replace('_', '-')}`]}>{LEVEL_TEXT[level]}</span>
            </div>
            <div className={styles.preview} style={{ color: rgbaCss }}>
              Aa 预览文字：当前颜色在暗色底上的阅读效果
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ColorConverter() {
  return (
    <App>
      <ColorConverterInner />
    </App>
  );
}
