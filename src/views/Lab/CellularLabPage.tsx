import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  PATTERNS,
  RULES,
  appendLimited,
  boardsToPixelScene,
  countCells,
  detectPeriod,
  patternFits,
  parseRuleNotation,
  placePattern,
  rasterLine,
  stepCells,
  type BoardSnapshot,
  type CellularRule,
  type PatternId,
  type RuleMask,
} from './cellular-engine';
import styles from './cellular.module.less';

const RULE_OPTIONS: { value: CellularRule; label: string; notation: string; description: string }[] = [
  {
    value: 'life',
    label: '生命游戏',
    notation: 'B3 / S23',
    description: '经典规则：三个邻居诞生，两个或三个邻居存活。',
  },
  {
    value: 'highlife',
    label: '高生命',
    notation: 'B36 / S23',
    description: '在经典规则上增加六邻居诞生，可能出现自我复制。',
  },
  { value: 'seeds', label: '种子', notation: 'B2 / S', description: '两个邻居诞生，所有活细胞在下一代消失。' },
];

type RuleSelection = CellularRule | 'custom';

const STEP_MS = 150;

function makeStartingCells(size: number): Uint8Array {
  return placePattern('glider', size, size)!;
}

export default function CellularLabPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trendRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);
  const lastStepRef = useRef(0);
  const elapsedRef = useRef(0);
  const cellsRef = useRef(makeStartingCells(40));
  const sizeRef = useRef(40);
  const generationRef = useRef(0);
  const ruleRef = useRef<RuleMask>(RULES.life);
  const customRuleRef = useRef<RuleMask>(RULES.life);
  const playingRef = useRef(false);
  const drawingRef = useRef(false);
  const lastPaintCellRef = useRef<{ x: number; y: number } | null>(null);
  const paintValueRef = useRef(1);
  const cursorRef = useRef({ x: 20, y: 20 });
  const canvasFocusedRef = useRef(false);
  const cursorStatusRef = useRef<HTMLOutputElement>(null);
  const generationLabelRef = useRef<HTMLOutputElement>(null);
  const populationLabelRef = useRef<HTMLOutputElement>(null);
  const cycleLabelRef = useRef<HTMLOutputElement>(null);
  const trendSummaryRef = useRef<HTMLOutputElement>(null);
  const exportStatusRef = useRef<HTMLOutputElement>(null);
  const trendSamplesRef = useRef<number[]>([5]);
  const snapshotsRef = useRef<BoardSnapshot[]>([{ generation: 0, cells: makeStartingCells(40) }]);
  const sceneBoardsRef = useRef<Uint8Array[]>([makeStartingCells(40)]);
  const [size, setSize] = useState(40);
  const [rule, setRule] = useState<RuleSelection>('life');
  const [activeCustomNotation, setActiveCustomNotation] = useState('B3/S23');
  const [customDraft, setCustomDraft] = useState('B3/S23');
  const [customError, setCustomError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const updateStats = useCallback(() => {
    if (generationLabelRef.current)
      generationLabelRef.current.textContent = String(generationRef.current).padStart(4, '0');
    if (populationLabelRef.current)
      populationLabelRef.current.textContent = String(countCells(cellsRef.current)).padStart(4, '0');
  }, []);

  const updateCursorDescription = useCallback((announce = false) => {
    const { x, y } = cursorRef.current;
    const state = cellsRef.current[y * sizeRef.current + x] ? '存活' : '空白';
    const description = `第 ${x + 1} 列，第 ${y + 1} 行，${state}。方向键移动，空格或回车切换细胞。`;
    canvasRef.current?.setAttribute('aria-label', description);
    if (announce && cursorStatusRef.current) cursorStatusRef.current.textContent = description;
  }, []);

  const drawTrend = useCallback(() => {
    const canvas = trendRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.round(bounds.width * dpr);
    const pixelHeight = Math.round(bounds.height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const theme = getComputedStyle(canvas);
    context.fillStyle = theme.getPropertyValue('--bg-overlay').trim();
    context.fillRect(0, 0, bounds.width, bounds.height);
    const samples = trendSamplesRef.current;
    const ceiling = Math.max(5, ...samples);
    if (trendSummaryRef.current) {
      trendSummaryRef.current.textContent = `最近 ${samples.length} 代 · 最少 ${Math.min(...samples)} · 最多 ${Math.max(...samples)}`;
    }
    context.strokeStyle = theme.getPropertyValue('--lab-accent').trim();
    context.lineWidth = 2;
    context.lineJoin = 'round';
    context.beginPath();
    samples.forEach((value, index) => {
      const x = (index / 79) * bounds.width;
      const y = bounds.height - 6 - (value / ceiling) * (bounds.height - 12);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  }, []);

  const resetAnalysis = useCallback(() => {
    trendSamplesRef.current = [countCells(cellsRef.current)];
    snapshotsRef.current = [{ generation: generationRef.current, cells: cellsRef.current.slice() }];
    sceneBoardsRef.current = [cellsRef.current.slice()];
    if (cycleLabelRef.current) cycleLabelRef.current.textContent = '观察中';
    if (exportStatusRef.current) exportStatusRef.current.textContent = '';
    drawTrend();
  }, [drawTrend]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;
    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    const dpr = window.devicePixelRatio || 1;
    const pixelWidth = Math.round(bounds.width * dpr);
    const pixelHeight = Math.round(bounds.height * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cellWidth = bounds.width / sizeRef.current;
    const cellHeight = bounds.height / sizeRef.current;
    const theme = getComputedStyle(canvas);
    context.fillStyle = theme.getPropertyValue('--bg-base').trim();
    context.fillRect(0, 0, bounds.width, bounds.height);
    context.strokeStyle = 'rgba(202, 221, 232, 0.07)';
    context.lineWidth = 1;
    context.beginPath();
    for (let i = 1; i < sizeRef.current; i += 1) {
      const x = Math.round(i * cellWidth) + 0.5;
      const y = Math.round(i * cellHeight) + 0.5;
      context.moveTo(x, 0);
      context.lineTo(x, bounds.height);
      context.moveTo(0, y);
      context.lineTo(bounds.width, y);
    }
    context.stroke();
    context.fillStyle = theme.getPropertyValue('--lab-accent').trim();
    const inset = Math.max(1, cellWidth * 0.12);
    for (let index = 0; index < cellsRef.current.length; index += 1) {
      if (!cellsRef.current[index]) continue;
      const x = (index % sizeRef.current) * cellWidth;
      const y = Math.floor(index / sizeRef.current) * cellHeight;
      context.fillRect(x + inset, y + inset, Math.max(1, cellWidth - inset * 2), Math.max(1, cellHeight - inset * 2));
    }
    if (canvasFocusedRef.current) {
      const { x, y } = cursorRef.current;
      context.strokeStyle = theme.getPropertyValue('--focus-ring').trim();
      context.lineWidth = Math.max(2, Math.min(cellWidth, cellHeight) * 0.14);
      context.strokeRect(x * cellWidth + 1, y * cellHeight + 1, cellWidth - 2, cellHeight - 2);
    }
  }, []);

  const advance = useCallback(() => {
    cellsRef.current = stepCells(cellsRef.current, sizeRef.current, sizeRef.current, ruleRef.current);
    generationRef.current += 1;
    const period = detectPeriod(cellsRef.current, generationRef.current, snapshotsRef.current);
    snapshotsRef.current = appendLimited(
      snapshotsRef.current,
      { generation: generationRef.current, cells: cellsRef.current },
      17,
    );
    sceneBoardsRef.current = appendLimited(sceneBoardsRef.current, cellsRef.current, 72);
    trendSamplesRef.current = appendLimited(trendSamplesRef.current, countCells(cellsRef.current), 80);
    if (cycleLabelRef.current) {
      cycleLabelRef.current.textContent = period === 1 ? '稳定态' : period ? `${period} 代周期` : '观察中';
    }
    updateStats();
    updateCursorDescription();
    draw();
    drawTrend();
  }, [draw, drawTrend, updateCursorDescription, updateStats]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(draw);
    observer.observe(canvas);
    const trendObserver = new ResizeObserver(drawTrend);
    if (trendRef.current) trendObserver.observe(trendRef.current);
    draw();
    drawTrend();
    updateStats();
    updateCursorDescription();
    return () => {
      observer.disconnect();
      trendObserver.disconnect();
    };
  }, [draw, drawTrend, updateCursorDescription, updateStats]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReducedMotion(preference.matches);
      if (preference.matches) {
        playingRef.current = false;
        setPlaying(false);
      }
    };
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!playing) return;
    lastStepRef.current = 0;
    elapsedRef.current = 0;
    const tick = (time: number) => {
      if (document.hidden) {
        frameRef.current = null;
        lastStepRef.current = 0;
        elapsedRef.current = 0;
        return;
      }
      if (lastStepRef.current !== 0) {
        elapsedRef.current += Math.min(time - lastStepRef.current, STEP_MS * 5);
        const steps = Math.min(5, Math.floor(elapsedRef.current / STEP_MS));
        for (let i = 0; i < steps; i += 1) advance();
        elapsedRef.current -= steps * STEP_MS;
      }
      lastStepRef.current = time;
      frameRef.current = requestAnimationFrame(tick);
    };
    const onVisibilityChange = () => {
      if (document.hidden) {
        if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
        lastStepRef.current = 0;
        elapsedRef.current = 0;
      } else if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (!document.hidden) frameRef.current = requestAnimationFrame(tick);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [advance, playing]);

  const togglePlaying = () => {
    playingRef.current = !playingRef.current;
    setPlaying(playingRef.current);
  };

  const changeSize = (nextSize: number) => {
    const clamped = Math.max(20, Math.min(64, nextSize));
    sizeRef.current = clamped;
    cellsRef.current = makeStartingCells(clamped);
    generationRef.current = 0;
    cursorRef.current = { x: Math.floor(clamped / 2), y: Math.floor(clamped / 2) };
    setSize(clamped);
    updateStats();
    resetAnalysis();
    updateCursorDescription(true);
    draw();
  };

  const changeRule = (nextRule: RuleSelection) => {
    ruleRef.current = nextRule === 'custom' ? customRuleRef.current : RULES[nextRule];
    setRule(nextRule);
    setCustomError('');
    resetAnalysis();
  };

  const applyCustomRule = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      const parsed = parseRuleNotation(customDraft);
      customRuleRef.current = parsed;
      ruleRef.current = parsed;
      setActiveCustomNotation(parsed.notation);
      setCustomDraft(parsed.notation);
      setRule('custom');
      setCustomError('');
      resetAnalysis();
    } catch (error) {
      setCustomError(error instanceof Error ? error.message : '规则无法识别。');
    }
  };

  const loadPattern = (pattern: PatternId) => {
    const cells = placePattern(pattern, sizeRef.current, sizeRef.current);
    if (!cells) return;
    cellsRef.current = cells;
    generationRef.current = 0;
    playingRef.current = false;
    setPlaying(false);
    updateStats();
    resetAnalysis();
    updateCursorDescription();
    draw();
  };

  const exportAnimation = () => {
    try {
      const scene = boardsToPixelScene(sceneBoardsRef.current, sizeRef.current, sizeRef.current);
      const url = URL.createObjectURL(new Blob([JSON.stringify(scene)], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `cellular-lab-${sizeRef.current}x${sizeRef.current}.json`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      if (exportStatusRef.current) exportStatusRef.current.textContent = `已导出 ${scene.frames.length} 帧像素动画。`;
    } catch (error) {
      if (exportStatusRef.current) {
        exportStatusRef.current.textContent = error instanceof Error ? error.message : '导出失败，请重试。';
      }
    }
  };

  const randomize = () => {
    const cells = new Uint8Array(sizeRef.current * sizeRef.current);
    for (let i = 0; i < cells.length; i += 1) cells[i] = Number(Math.random() < 0.24);
    cellsRef.current = cells;
    generationRef.current = 0;
    updateStats();
    resetAnalysis();
    updateCursorDescription();
    draw();
  };

  const clear = () => {
    cellsRef.current = new Uint8Array(sizeRef.current * sizeRef.current);
    generationRef.current = 0;
    playingRef.current = false;
    setPlaying(false);
    updateStats();
    resetAnalysis();
    updateCursorDescription();
    draw();
  };

  const handleCanvasKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const { x, y } = cursorRef.current;
    switch (event.key) {
      case 'ArrowUp':
        cursorRef.current = { x, y: Math.max(0, y - 1) };
        break;
      case 'ArrowDown':
        cursorRef.current = { x, y: Math.min(sizeRef.current - 1, y + 1) };
        break;
      case 'ArrowLeft':
        cursorRef.current = { x: Math.max(0, x - 1), y };
        break;
      case 'ArrowRight':
        cursorRef.current = { x: Math.min(sizeRef.current - 1, x + 1), y };
        break;
      case ' ':
      case 'Enter': {
        const index = y * sizeRef.current + x;
        cellsRef.current[index] = Number(!cellsRef.current[index]);
        updateStats();
        resetAnalysis();
        break;
      }
      default:
        return;
    }
    event.preventDefault();
    updateCursorDescription(true);
    draw();
  };

  const cellAtPointer = (event: PointerEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.floor(((event.clientX - bounds.left) / bounds.width) * sizeRef.current);
    const y = Math.floor(((event.clientY - bounds.top) / bounds.height) * sizeRef.current);
    if (x < 0 || x >= sizeRef.current || y < 0 || y >= sizeRef.current) return null;
    return { x, y };
  };

  const paint = (event: PointerEvent<HTMLCanvasElement>) => {
    const cell = cellAtPointer(event);
    if (!cell) return;
    const previous = lastPaintCellRef.current ?? cell;
    let changed = false;
    for (const [x, y] of rasterLine(previous.x, previous.y, cell.x, cell.y)) {
      const index = y * sizeRef.current + x;
      if (cellsRef.current[index] === paintValueRef.current) continue;
      cellsRef.current[index] = paintValueRef.current;
      changed = true;
    }
    lastPaintCellRef.current = cell;
    if (!changed) return;
    updateStats();
    resetAnalysis();
    updateCursorDescription();
    draw();
  };

  const startDrawing = (event: PointerEvent<HTMLCanvasElement>) => {
    const cell = cellAtPointer(event);
    if (!cell) return;
    drawingRef.current = true;
    lastPaintCellRef.current = cell;
    paintValueRef.current = cellsRef.current[cell.y * sizeRef.current + cell.x] ? 0 : 1;
    event.currentTarget.setPointerCapture(event.pointerId);
    paint(event);
  };

  const selectedRule = RULE_OPTIONS.find((option) => option.value === rule);

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div className={styles.kicker}>
            <span className={styles.pulse} /> LAB / 生命沙盘
          </div>
          <h1>
            从一格生命，
            <br />
            观察整个世界。
          </h1>
          <p>画下几个细胞，放开时间。简单的邻居规则会长出意想不到的形状。</p>
        </header>

        <div className={styles.layout}>
          <section className={styles.stage} aria-label="细胞演化画布">
            <div className={styles['stage-top']}>
              <div className={styles['stage-title']}>
                <span className={styles['stage-dot']} /> 演化视野
              </div>
              <span className={styles['stage-meta']}>
                {size} × {size} CELLS
              </span>
            </div>
            <div className={styles['canvas-wrap']}>
              <canvas
                ref={canvasRef}
                className={styles.canvas}
                tabIndex={0}
                aria-label="生命沙盘画布。方向键移动，空格或回车切换细胞。"
                onKeyDown={handleCanvasKeyDown}
                onFocus={() => {
                  canvasFocusedRef.current = true;
                  updateCursorDescription(true);
                  draw();
                }}
                onBlur={() => {
                  canvasFocusedRef.current = false;
                  draw();
                }}
                onPointerDown={startDrawing}
                onPointerMove={(event) => {
                  if (drawingRef.current) paint(event);
                }}
                onPointerUp={() => {
                  drawingRef.current = false;
                  lastPaintCellRef.current = null;
                }}
                onPointerCancel={() => {
                  drawingRef.current = false;
                  lastPaintCellRef.current = null;
                }}
                onLostPointerCapture={() => {
                  drawingRef.current = false;
                  lastPaintCellRef.current = null;
                }}
              />
            </div>
            <div className={styles['stage-bottom']}>
              <span>拖动绘制 · 方向键移动 · 空格切换细胞</span>
              <output ref={cursorStatusRef} aria-live="polite" className={styles['cursor-status']} />
              <span>边界之外视为空白</span>
            </div>
          </section>

          <aside className={styles.panel} aria-label="生命沙盘控制台">
            <div className={styles.readouts}>
              <div>
                <span>代数</span>
                <output ref={generationLabelRef} aria-label="代数">
                  0000
                </output>
              </div>
              <div>
                <span>存活细胞</span>
                <output ref={populationLabelRef} aria-label="存活细胞">
                  0005
                </output>
              </div>
            </div>

            <div className={styles['panel-section']}>
              <h2>时间控制</h2>
              <div className={styles['main-actions']}>
                <button
                  type="button"
                  className={styles['primary-button']}
                  onClick={togglePlaying}
                  disabled={reducedMotion}
                >
                  {playing ? 'Ⅱ 暂停' : '▶ 开始演化'}
                </button>
                <button type="button" className={styles['secondary-button']} onClick={advance}>
                  单步 →
                </button>
              </div>
              {reducedMotion && <p className={styles.note}>系统已启用减少动态效果。可以使用单步观察演化。</p>}
            </div>

            <div className={styles['panel-section']}>
              <label className={styles['section-label']} htmlFor="cellular-rule">
                演化规则
              </label>
              <select
                id="cellular-rule"
                className={styles.select}
                value={rule}
                onChange={(event) => changeRule(event.target.value as RuleSelection)}
              >
                {RULE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} · {option.notation}
                  </option>
                ))}
                <option value="custom">自定义 B/S 规则</option>
              </select>
              <p className={styles.note}>
                {selectedRule?.description ?? `当前：${activeCustomNotation}。B 为出生，S 为存活。`}
              </p>
              {rule === 'custom' && (
                <form className={styles['rule-form']} onSubmit={applyCustomRule}>
                  <label htmlFor="cellular-custom-rule">编辑规则</label>
                  <div>
                    <input
                      id="cellular-custom-rule"
                      className={styles['rule-input']}
                      value={customDraft}
                      onChange={(event) => {
                        setCustomDraft(event.target.value);
                        setCustomError('');
                      }}
                      aria-invalid={Boolean(customError)}
                      aria-describedby="cellular-rule-help cellular-rule-error"
                      spellCheck={false}
                    />
                    <button type="submit" className={styles['secondary-button']}>
                      应用
                    </button>
                  </div>
                  <p id="cellular-rule-help" className={styles.note}>
                    例如 B3/S23、B36/S23、B2/S；数字只允许 0–8，不可重复。
                  </p>
                  <p id="cellular-rule-error" className={styles['rule-error']} role="alert">
                    {customError}
                  </p>
                </form>
              )}
            </div>

            <div className={styles['panel-section']}>
              <label className={styles['section-label']} htmlFor="cellular-size">
                网格密度{' '}
                <strong>
                  {size} × {size}
                </strong>
              </label>
              <input
                id="cellular-size"
                className={styles.range}
                type="range"
                min="20"
                max="64"
                step="4"
                value={size}
                onChange={(event) => changeSize(Number(event.target.value))}
              />
              <div className={styles['range-ends']}>
                <span>20 × 20</span>
                <span>64 × 64</span>
              </div>
            </div>

            <div className={styles['panel-section']}>
              <h2>画布</h2>
              <div className={styles['secondary-actions']}>
                <button type="button" className={styles['secondary-button']} onClick={randomize}>
                  随机撒种
                </button>
                <button type="button" className={styles['secondary-button']} onClick={clear}>
                  清空画布
                </button>
              </div>
            </div>

            <div className={styles['panel-section']}>
              <h2>预设图案</h2>
              <div className={styles['pattern-list']}>
                {(Object.keys(PATTERNS) as PatternId[]).map((pattern) => {
                  const fits = patternFits(pattern, size, size);
                  return (
                    <button
                      key={pattern}
                      type="button"
                      className={styles['pattern-button']}
                      onClick={() => loadPattern(pattern)}
                      disabled={!fits}
                      title={fits ? `载入${PATTERNS[pattern].label}` : '当前网格过小，至少需要 36 × 36'}
                    >
                      <span>{PATTERNS[pattern].label}</span>
                      <span>{fits ? '载入 ↗' : '需 36 × 36'}</span>
                    </button>
                  );
                })}
              </div>
              <p className={styles.note}>载入会替换当前画布，并从第 0 代重新开始。</p>
            </div>

            <div className={styles['panel-section']}>
              <h2>种群趋势</h2>
              <canvas ref={trendRef} className={styles['trend-canvas']} aria-hidden="true" />
              <div className={styles['trend-meta']}>
                <output ref={trendSummaryRef} aria-label="种群趋势摘要">
                  最近 1 代 · 最少 5 · 最多 5
                </output>
                <output ref={cycleLabelRef} aria-label="演化状态" aria-live="polite">
                  观察中
                </output>
              </div>
              <p className={styles.note}>对比最近 16 代的完整画布，识别稳定态或短周期。</p>
            </div>

            <div className={styles['panel-section']}>
              <h2>带走这段演化</h2>
              <p className={styles.note}>
                将最近最多 72 代导出为像素动画 JSON，每帧 150 毫秒。可在<Link to="../pixel-studio">像素工作室</Link>
                导入播放。
              </p>
              <button type="button" className={styles['export-button']} onClick={exportAnimation}>
                导出像素动画 ↓
              </button>
              <output ref={exportStatusRef} className={styles['export-status']} aria-live="polite" />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
