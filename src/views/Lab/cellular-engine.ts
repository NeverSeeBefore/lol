import type { PixelScene } from 'Src/lib/pixel';

export type CellularRule = 'life' | 'highlife' | 'seeds';

export interface RuleMask {
  birthMask: number;
  surviveMask: number;
  notation: string;
}

/** Parse B/S notation once; a digit may appear only once in each half. */
export function parseRuleNotation(input: string): RuleMask {
  const match = /^B([0-8]*)\/S([0-8]*)$/.exec(input.trim());
  if (!match) throw new Error('规则格式应为 B3/S23；B 和 S 后只能写 0–8。');
  const [birth, survive] = [match[1], match[2]];
  if (new Set(birth).size !== birth.length || new Set(survive).size !== survive.length) {
    throw new Error('同一组中不能重复填写邻居数。');
  }
  const mask = (digits: string) => [...digits].reduce((value, digit) => value | (1 << Number(digit)), 0);
  const sorted = (digits: string) => [...digits].sort().join('');
  return { birthMask: mask(birth), surviveMask: mask(survive), notation: `B${sorted(birth)}/S${sorted(survive)}` };
}

export const RULES: Record<CellularRule, RuleMask> = {
  life: parseRuleNotation('B3/S23'),
  highlife: parseRuleNotation('B36/S23'),
  seeds: parseRuleNotation('B2/S'),
};

/** Calculate one generation with dead cells beyond the board edges. */
export function stepCells(
  current: Uint8Array,
  width: number,
  height: number,
  rule: CellularRule | RuleMask,
): Uint8Array {
  const next = new Uint8Array(width * height);
  const { birthMask, surviveMask } = typeof rule === 'string' ? RULES[rule] : rule;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx;
          if ((dx === 0 && dy === 0) || nx < 0 || nx >= width) continue;
          neighbors += current[ny * width + nx];
        }
      }
      const index = y * width + x;
      next[index] = Number(Boolean(((current[index] ? surviveMask : birthMask) >> neighbors) & 1));
    }
  }

  return next;
}

export function countCells(cells: Uint8Array): number {
  let count = 0;
  for (const cell of cells) count += cell;
  return count;
}

export const PATTERNS = {
  glider: { label: '滑翔机', rows: ['.#.', '..#', '###'] },
  blinker: { label: '闪烁器', rows: ['###'] },
  rPentomino: { label: 'R 五连块', rows: ['.##', '##.', '.#.'] },
  gosperGun: {
    label: '高斯帕滑翔机枪',
    rows: [
      '........................#...........',
      '......................#.#...........',
      '............##......##............##',
      '...........#...#....##............##',
      '##........#.....#...##..............',
      '##........#...#.##....#.#...........',
      '..........#.....#......#...........',
      '...........#...#....................',
      '............##......................',
    ],
  },
} as const;

export type PatternId = keyof typeof PATTERNS;

export function patternFits(pattern: PatternId, width: number, height: number): boolean {
  const rows = PATTERNS[pattern].rows;
  return rows.length <= height && Math.max(...rows.map((row) => row.length)) <= width;
}

/** Return a new, centered board. Refuse patterns that cannot fit fully. */
export function placePattern(pattern: PatternId, width: number, height: number): Uint8Array | null {
  if (!patternFits(pattern, width, height)) return null;
  const rows = PATTERNS[pattern].rows;
  const offsetX = Math.floor((width - Math.max(...rows.map((row) => row.length))) / 2);
  const offsetY = Math.floor((height - rows.length) / 2);
  const cells = new Uint8Array(width * height);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === '#') cells[(offsetY + y) * width + offsetX + x] = 1;
    }
  });
  return cells;
}

export type BoardSnapshot = { generation: number; cells: Uint8Array };

/** Full-board comparison avoids false cycles from equal population counts. */
export function detectPeriod(cells: Uint8Array, generation: number, previous: readonly BoardSnapshot[]): number | null {
  for (let i = previous.length - 1; i >= 0; i -= 1) {
    const snapshot = previous[i];
    if (snapshot.cells.length !== cells.length) continue;
    if (snapshot.cells.every((cell, index) => cell === cells[index])) return generation - snapshot.generation;
  }
  return null;
}

export function appendLimited<T>(items: readonly T[], item: T, limit: number): T[] {
  return [...items.slice(-(limit - 1)), item];
}

/** Integer grid path between pointer samples, including both endpoints. */
export function rasterLine(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const points: [number, number][] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let error = dx - dy;
  while (true) {
    points.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    const doubled = error * 2;
    if (doubled > -dy) {
      error -= dy;
      x0 += sx;
    }
    if (doubled < dx) {
      error += dx;
      y0 += sy;
    }
  }
  return points;
}

/** Convert at most 72 complete board generations into Pixel Studio's v1 scene. */
export function boardsToPixelScene(boards: readonly Uint8Array[], width: number, height: number): PixelScene {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 8 || width > 96 || height < 8 || height > 96) {
    throw new Error('网格尺寸必须在 8 到 96 之间。');
  }
  if (boards.length === 0) throw new Error('没有可导出的画布。');
  const selected = boards.slice(-72);
  if (selected.some((board) => board.length !== width * height || board.some((cell) => cell !== 0 && cell !== 1))) {
    throw new Error('历史画布与当前网格尺寸或像素索引不一致。');
  }
  return {
    version: 1,
    width,
    height,
    palette: ['#00000000', '#f1a9c6'],
    frames: selected.map((board) => ({ durationMs: 150, cells: Array.from(board) })),
  };
}
