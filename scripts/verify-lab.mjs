import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import ts from 'typescript';

const root = new URL('../', import.meta.url);

function loadTypescript(relativePath, names) {
  const sourceUrl = new URL(relativePath, root);
  const source = readFileSync(sourceUrl, 'utf8');
  let selected = source;
  if (names) {
    const parsed = ts.createSourceFile(relativePath, source, ts.ScriptTarget.Latest, true);
    selected = parsed.statements
      .filter((statement) => {
        if (ts.isFunctionDeclaration(statement)) return names.includes(statement.name?.text);
        if (ts.isVariableStatement(statement))
          return statement.declarationList.declarations.some((declaration) =>
            names.includes(declaration.name.getText(parsed)),
          );
        return false;
      })
      .map((statement) => statement.getText(parsed))
      .join('\n');
  }
  const { outputText } = ts.transpileModule(selected, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const module = { exports: {} };
  const requireLocal = (specifier) => {
    if (!specifier.startsWith('.')) throw new Error(`Unexpected test import: ${specifier}`);
    return loadTypescript(new URL(`${specifier}.ts`, sourceUrl).pathname.replace(new URL('.', root).pathname, ''));
  };
  new Function('module', 'exports', 'require', outputText)(module, module.exports, requireLocal);
  return module.exports;
}

const {
  stepCells,
  countCells,
  parseRuleNotation,
  patternFits,
  placePattern,
  detectPeriod,
  rasterLine,
  boardsToPixelScene,
} = loadTypescript('src/views/Lab/cellular-engine.ts');
const {
  validatePixelScene,
  getPixelLayout,
  interpolatePixelColor,
  getCellTransitionProgress,
  cubicBezierAt,
  getStreamFrameIndex,
  compositePixelStreamsAt,
} = loadTypescript('src/lib/pixel/index.ts');
const { createPixelWallScene } = loadTypescript('src/views/Lab/pixel-wall-scene.ts', [
  'WIDTH',
  'HEIGHT',
  'FRAME_COUNT',
  'palette',
  'buildings',
  'stars',
  'createPixelWallScene',
]);

function board(width, height, points) {
  const cells = new Uint8Array(width * height);
  for (const [x, y] of points) cells[y * width + x] = 1;
  return cells;
}

test('Life blinker oscillates with period two', () => {
  const horizontal = board(5, 5, [
    [1, 2],
    [2, 2],
    [3, 2],
  ]);
  const vertical = board(5, 5, [
    [2, 1],
    [2, 2],
    [2, 3],
  ]);
  assert.deepEqual(stepCells(horizontal, 5, 5, 'life'), vertical);
  assert.deepEqual(stepCells(vertical, 5, 5, 'life'), horizontal);
  assert.equal(countCells(vertical), 3);
});

test('Life glider moves one cell diagonally after four generations', () => {
  let cells = board(8, 8, [
    [2, 1],
    [3, 2],
    [1, 3],
    [2, 3],
    [3, 3],
  ]);
  for (let generation = 0; generation < 4; generation += 1) cells = stepCells(cells, 8, 8, 'life');
  assert.deepEqual(
    cells,
    board(8, 8, [
      [3, 2],
      [4, 3],
      [2, 4],
      [3, 4],
      [4, 4],
    ]),
  );
});

test('custom B/S rules parse strictly and apply their birth mask', () => {
  const normalized = parseRuleNotation('B63/S32');
  assert.equal(normalized.notation, 'B36/S23');
  assert.deepEqual(stepCells(new Uint8Array(25), 5, 5, parseRuleNotation('B0/S')), new Uint8Array(25).fill(1));
  for (const input of ['B33/S23', 'B3/S223', 'B9/S', 'B3S23', 'B3/S2x']) {
    assert.throws(() => parseRuleNotation(input));
  }
});

test('period detection compares whole boards and chooses recent match', () => {
  const a = board(5, 5, [
    [1, 2],
    [2, 2],
    [3, 2],
  ]);
  const b = stepCells(a, 5, 5, 'life');
  assert.equal(detectPeriod(b, 1, [{ generation: 0, cells: a }]), null);
  assert.equal(
    detectPeriod(a, 2, [
      { generation: 0, cells: a },
      { generation: 1, cells: b },
    ]),
    2,
  );
  assert.equal(
    detectPeriod(a, 4, [
      { generation: 0, cells: a },
      { generation: 2, cells: a },
    ]),
    2,
  );
});

test('Bresenham includes endpoints across horizontal, steep, and reverse lines', () => {
  assert.deepEqual(rasterLine(0, 0, 3, 0), [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
  ]);
  assert.deepEqual(rasterLine(0, 0, 2, 4), [
    [0, 0],
    [0, 1],
    [1, 2],
    [1, 3],
    [2, 4],
  ]);
  assert.deepEqual(rasterLine(3, 3, 0, 0), [
    [3, 3],
    [2, 2],
    [1, 1],
    [0, 0],
  ]);
  assert.deepEqual(rasterLine(2, 2, 2, 2), [[2, 2]]);
});

test('patterns fit at exact bounds and reject dimensions one cell too small', () => {
  assert.equal(patternFits('gosperGun', 36, 9), true);
  assert.equal(patternFits('gosperGun', 35, 9), false);
  assert.equal(patternFits('gosperGun', 36, 8), false);
  assert.equal(placePattern('gosperGun', 35, 9), null);
  const placed = placePattern('blinker', 5, 5);
  assert.deepEqual(
    placed,
    board(5, 5, [
      [1, 2],
      [2, 2],
      [3, 2],
    ]),
  );
});

test('board export keeps the last 72 complete frames in v1 scene format', () => {
  const boards = Array.from({ length: 73 }, () => new Uint8Array(64));
  boards[0][0] = 1;
  boards[72][63] = 1;
  const scene = boardsToPixelScene(boards, 8, 8);
  assert.equal(scene.version, 1);
  assert.deepEqual([scene.width, scene.height], [8, 8]);
  assert.deepEqual(scene.palette, ['#00000000', '#f1a9c6']);
  assert.equal(scene.frames.length, 72);
  assert.equal(scene.frames[0].cells[0], 0);
  assert.equal(scene.frames[71].cells[63], 1);
  assert.ok(scene.frames.every((frame) => frame.durationMs === 150 && frame.cells.length === 64));
  assert.deepEqual(validatePixelScene(scene), scene);
  assert.throws(() => boardsToPixelScene([], 8, 8));
  assert.throws(() => boardsToPixelScene([new Uint8Array(63)], 8, 8));
  assert.throws(() => boardsToPixelScene([new Uint8Array(64)], 7, 8));
});

test('PixelScene validator accepts valid input and rejects malformed boundaries', () => {
  const valid = {
    version: 1,
    width: 8,
    height: 8,
    palette: ['#0000', '#abcdef'],
    frames: [{ durationMs: 1, cells: Array(64).fill(1) }],
  };
  assert.equal(validatePixelScene(valid), valid);
  const invalid = [
    null,
    { ...valid, version: 2 },
    { ...valid, width: 7 },
    { ...valid, height: 97 },
    { ...valid, palette: ['red'] },
    { ...valid, palette: Array(257).fill('#000') },
    { ...valid, frames: [] },
    { ...valid, frames: Array(73).fill(valid.frames[0]) },
    { ...valid, frames: [{ durationMs: 0, cells: valid.frames[0].cells }] },
    { ...valid, frames: [{ durationMs: 1000, cells: Array(63).fill(0) }] },
    { ...valid, frames: [{ durationMs: 1000, cells: Array(64).fill(2) }] },
  ];
  for (const scene of invalid) assert.throws(() => validatePixelScene(scene));
});

test('pixel wall uses a valid double-resolution scene and square cells at wide and narrow sizes', () => {
  const scene = createPixelWallScene();
  assert.deepEqual([scene.width, scene.height], [96, 52]);
  assert.equal(scene.frames.length, 32);
  assert.deepEqual(validatePixelScene(scene), scene);
  const wide = getPixelLayout(960, 420, 96, 52, true);
  assert.equal(wide.pixelWidth, wide.pixelHeight);
  assert.equal(wide.pixelWidth, 10);
  const narrow = getPixelLayout(390, 520, 96, 52, true);
  assert.equal(narrow.pixelWidth, narrow.pixelHeight);
  assert.ok(narrow.offsetX < 0);
});

test('individual pixel colors interpolate, including alpha', () => {
  assert.equal(interpolatePixelColor('#000000', '#ffffff', 0), 'rgba(0, 0, 0, 1)');
  assert.equal(interpolatePixelColor('#000000', '#ffffff', 0.5), 'rgba(128, 128, 128, 1)');
  assert.equal(interpolatePixelColor('#000000', '#ffffff', 1), 'rgba(255, 255, 255, 1)');
  assert.equal(interpolatePixelColor('#0000', '#fff', 0.5), 'rgba(128, 128, 128, 0.5)');
});

test('changed pixels stagger their transitions across the frame interval', () => {
  assert.equal(getCellTransitionProgress(0, 240, 180, 0, 96), 0);
  assert.ok(getCellTransitionProgress(40, 240, 180, 0, 96) > 0);
  assert.equal(getCellTransitionProgress(40, 240, 180, 11, 96), 0);
  assert.equal(getCellTransitionProgress(240, 240, 180, 11, 96), 1);
  assert.equal(getCellTransitionProgress(20, 240, 0, 11, 96), 1);
  assert.ok(getCellTransitionProgress(500, 240, 1000, 0, 96) < 1);
  assert.equal(getCellTransitionProgress(1000, 240, 1000, 0, 96), 1);
});

test('custom cubic-bezier curve changes per-pixel timing while preserving endpoints', () => {
  const linear = [0, 0, 1, 1];
  const easeOut = [0, 0, 0.2, 1];
  assert.equal(cubicBezierAt(0, easeOut), 0);
  assert.equal(cubicBezierAt(1, easeOut), 1);
  assert.ok(Math.abs(cubicBezierAt(0.5, linear) - 0.5) < 0.001);
  assert.ok(cubicBezierAt(0.5, easeOut) > 0.5);
  assert.ok(
    getCellTransitionProgress(500, 1000, 1000, 0, 96, easeOut) >
      getCellTransitionProgress(500, 1000, 1000, 0, 96, linear),
  );
});

test('multiple pixel streams keep independent clocks and top visible pixels win without blending', () => {
  const base = {
    version: 1,
    width: 16,
    height: 16,
    palette: ['#112233', '#445566'],
    frames: [
      { durationMs: 100, cells: Array(256).fill(0) },
      { durationMs: 100, cells: Array(256).fill(1) },
    ],
  };
  const overlayCells = Array(64).fill(0);
  overlayCells[0] = 1;
  const overlay = {
    version: 1,
    width: 8,
    height: 8,
    palette: ['#0000', '#ff000080'],
    frames: [
      { durationMs: 150, cells: Array(64).fill(0) },
      { durationMs: 150, cells: overlayCells },
    ],
  };
  assert.equal(getStreamFrameIndex(base, 125), 1);
  assert.equal(getStreamFrameIndex(overlay, 125), 0);
  assert.equal(getStreamFrameIndex(overlay, 175), 1);
  const early = compositePixelStreamsAt([base, overlay], 125);
  const later = compositePixelStreamsAt([base, overlay], 175);
  assert.equal(early[0], '#445566');
  assert.equal(later[0], '#ff0000');
  assert.equal(later[1], '#ff0000');
  assert.equal(later[2], '#445566');
  assert.equal(later.length, 256);
});

test('pixel core exposes scene validation, timeline and compositing without a React component', () => {
  const core = loadTypescript('src/lib/pixel/index.ts');
  assert.equal(typeof core.validatePixelScene, 'function');
  assert.equal(typeof core.getStreamFrameIndex, 'function');
  assert.equal(typeof core.compositePixelStreamsAt, 'function');
  assert.equal(typeof core.PixelPlayback, 'function');
});

test('pixel playback keeps independent streams and continues interrupted cell transitions', () => {
  const { PixelPlayback } = loadTypescript('src/lib/pixel/player.ts');
  const scene = (colors, durationMs) => ({
    version: 1,
    width: 8,
    height: 8,
    palette: colors,
    frames: colors.map((_, index) => ({ durationMs, cells: Array(64).fill(index) })),
  });
  const playback = new PixelPlayback(
    [scene(['#000000', '#ffffff'], 100), scene(['#0000', '#ff000080'], 150)],
    200,
    [0, 0, 1, 1],
  );
  assert.equal(playback.sample(0), true);
  assert.equal(playback.colorAt(0, 0), '#000000');
  assert.equal(playback.sample(110), true);
  assert.equal(playback.colorAt(0, 110), 'rgba(0, 0, 0, 1)');
  const beforeInterrupt = playback.colorAt(0, 160);
  assert.equal(playback.sample(160), true);
  assert.equal(playback.colorAt(0, 160), beforeInterrupt);
  assert.notEqual(playback.colorAt(0, 210), beforeInterrupt);
});

test('single-stream playback preserves palette alpha', () => {
  const { PixelPlayback } = loadTypescript('src/lib/pixel/player.ts');
  const playback = new PixelPlayback([
    {
      version: 1,
      width: 8,
      height: 8,
      palette: ['#ff000080'],
      frames: [{ durationMs: 100, cells: Array(64).fill(0) }],
    },
  ]);
  playback.sample(0);
  assert.equal(playback.colorAt(0, 0), '#ff000080');
});

test('ripple timeline forms dots, sends three waves, and collapses to a seed', () => {
  const { sampleRippleCell, sampleRippleStage } = loadTypescript('src/components/RippleGrid/ripple.ts');
  const blank = sampleRippleCell(11, 6, 23, 13, 0, []);
  const center = sampleRippleCell(11, 6, 23, 13, 1, []);
  const forming = sampleRippleCell(15, 6, 23, 13, 3.1, []);
  const grownEdge = sampleRippleCell(15, 6, 23, 13, 5.5, []);
  const eye = sampleRippleCell(9, 5, 23, 13, 5.5, []);
  const paleEye = sampleRippleCell(8, 5, 23, 13, 5.5, []);
  assert.equal(blank.energy, 0);
  assert.ok(center.energy > blank.energy);
  assert.ok(forming.formation > 0 && forming.formation < 1);
  assert.ok(grownEdge.energy > forming.energy);
  assert.ok(eye.highlight > grownEdge.highlight);
  assert.ok(eye.highlight > paleEye.highlight && paleEye.highlight > grownEdge.highlight);
  for (const launch of [5.15, 5.85, 6.55]) {
    const wave = sampleRippleCell(11, 6, 23, 13, launch, []);
    const between = sampleRippleCell(11, 6, 23, 13, launch - 0.25, []);
    assert.ok(wave.highlight > between.highlight);
  }
  assert.ok(sampleRippleStage(9.1).zoom < sampleRippleStage(8.2).zoom);
  assert.ok(sampleRippleStage(9.55).zoom < 0.1);
  assert.ok(sampleRippleStage(9.6).seed > 0);
  const cycleEnd = sampleRippleStage(9.999);
  const nextCycle = sampleRippleStage(10);
  assert.ok(cycleEnd.seed > 0.99 && nextCycle.seed > 0.99);
  assert.ok(Math.abs(cycleEnd.zoom - nextCycle.zoom) < 0.001);
  assert.ok(sampleRippleStage(10.6).zoom > nextCycle.zoom);
  const impulse = [{ x: 11, y: 6, startedAt: 5 }];
  const atWavefront = sampleRippleCell(17, 6, 23, 13, 6.15, impulse);
  const withoutImpulse = sampleRippleCell(17, 6, 23, 13, 6.15, []);
  assert.ok(atWavefront.highlight > withoutImpulse.highlight);
  assert.ok(
    [blank, center, forming, grownEdge, eye, atWavefront].every(
      ({ energy, highlight, scale }) =>
        energy >= 0 && energy <= 1 && highlight >= 0 && highlight <= 1 && scale > 0 && scale <= 1.2,
    ),
  );
});
