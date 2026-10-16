import type { PixelScene } from 'Src/lib/pixel';

const MAX_FRAMES = 72;
const MAX_SECONDS = 6;
const MAX_FPS = 12;

type PixelFrame = PixelScene['frames'][number];

function validateGrid(width: number, height: number) {
  if (![width, height].every((value) => Number.isInteger(value) && value >= 8 && value <= 96)) {
    throw new Error('网格宽高必须为 8 到 96 之间的整数。');
  }
}

function abortIfNeeded(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException('转换已取消', 'AbortError');
}

/* eslint-disable @typescript-eslint/no-use-before-define */
function waitForMedia(
  element: HTMLImageElement | HTMLVideoElement,
  event: string,
  signal: AbortSignal,
  timeout = 15000,
  isReady?: () => boolean,
) {
  return new Promise<void>((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timer);
      element.removeEventListener(event, success);
      element.removeEventListener('error', failure);
      signal.removeEventListener('abort', canceled);
      if (error) reject(error);
      else resolve();
    };
    const success = () => finish();
    const failure = () => finish(new Error('无法读取该媒体文件，请换用浏览器支持的格式。'));
    const canceled = () => finish(new DOMException('转换已取消', 'AbortError'));
    const timer = window.setTimeout(() => finish(new Error('读取媒体超时，请尝试更短的视频或其他格式。')), timeout);
    element.addEventListener(event, success, { once: true });
    element.addEventListener('error', failure, { once: true });
    signal.addEventListener('abort', canceled, { once: true });
    if (signal.aborted) canceled();
    else if (isReady?.()) success();
  });
}

function createSampler(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('浏览器无法创建画布，请检查浏览器设置。');
  return { canvas, context };
}

function readFrame(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
  context: CanvasRenderingContext2D,
  palette: string[],
  colors: Map<string, number>,
  durationMs: number,
): PixelFrame {
  context.clearRect(0, 0, width, height);
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  context.drawImage(source, (width - drawWidth) / 2, (height - drawHeight) / 2, drawWidth, drawHeight);
  const data = context.getImageData(0, 0, width, height).data;
  const cells = new Array<number>(width * height);
  for (let i = 0; i < cells.length; i += 1) {
    const offset = i * 4;
    // Alpha: 0, 85, 170, 255. RGB: 3/3/2 bits. A shared scene palette
    // keeps the first 255 visible colors; later buckets reuse nearest RGBA.
    const alpha = Math.round(data[offset + 3] / 85) * 85;
    if (alpha === 0) {
      cells[i] = 0;
      continue;
    }
    const r = (data[offset] & 0xe0) | 0x10;
    const g = (data[offset + 1] & 0xe0) | 0x10;
    const b = (data[offset + 2] & 0xc0) | 0x20;
    const key = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${alpha.toString(16).padStart(2, '0')}`;
    let index = colors.get(key);
    if (index === undefined) {
      if (palette.length < 256) {
        index = palette.length;
        palette.push(key);
      } else {
        let bestDistance = Infinity;
        index = 1;
        for (let j = 1; j < palette.length; j += 1) {
          const color = palette[j];
          const distance =
            (r - parseInt(color.slice(1, 3), 16)) ** 2 +
            (g - parseInt(color.slice(3, 5), 16)) ** 2 +
            (b - parseInt(color.slice(5, 7), 16)) ** 2 +
            3 * (alpha - parseInt(color.slice(7, 9), 16)) ** 2;
          if (distance < bestDistance) {
            bestDistance = distance;
            index = j;
          }
        }
      }
      colors.set(key, index);
    }
    cells[i] = index;
  }
  return { durationMs, cells };
}

function sceneBuilder(width: number, height: number) {
  const palette = ['#00000000'];
  const colors = new Map<string, number>();
  const { context } = createSampler(width, height);
  return {
    palette,
    frame: (source: CanvasImageSource, sourceWidth: number, sourceHeight: number, durationMs: number) =>
      readFrame(source, sourceWidth, sourceHeight, width, height, context, palette, colors, durationMs),
  };
}

export async function imageToPixelScene(
  file: File,
  width: number,
  height: number,
  signal: AbortSignal,
): Promise<PixelScene> {
  validateGrid(width, height);
  abortIfNeeded(signal);
  const url = URL.createObjectURL(file);
  const image = new Image();
  try {
    const loaded = waitForMedia(image, 'load', signal);
    image.src = url;
    await loaded;
    abortIfNeeded(signal);
    if (!image.naturalWidth || !image.naturalHeight) throw new Error('图片尺寸无效，请换一张图片。');
    const builder = sceneBuilder(width, height);
    return {
      version: 1,
      width,
      height,
      palette: builder.palette,
      frames: [builder.frame(image, image.naturalWidth, image.naturalHeight, 1000)],
    };
  } finally {
    image.src = '';
    URL.revokeObjectURL(url);
  }
}

async function seekVideo(video: HTMLVideoElement, time: number, signal: AbortSignal) {
  abortIfNeeded(signal);
  if (Math.abs(video.currentTime - time) < 0.001 && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) return;
  const ready = waitForMedia(video, 'seeked', signal);
  video.currentTime = time;
  await ready;
  abortIfNeeded(signal);
}

export async function videoToPixelScene(
  file: File,
  width: number,
  height: number,
  fps: number,
  requestedSeconds: number,
  signal: AbortSignal,
  onProgress: (completed: number, total: number) => void,
): Promise<PixelScene> {
  validateGrid(width, height);
  abortIfNeeded(signal);
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  try {
    const metadata = waitForMedia(video, 'loadedmetadata', signal);
    video.src = url;
    video.load();
    await metadata;
    abortIfNeeded(signal);
    if (!Number.isFinite(video.duration) || video.duration <= 0 || !video.videoWidth || !video.videoHeight) {
      throw new Error('视频时长或尺寸无效，请选择可定位的本地视频。');
    }
    await waitForMedia(
      video,
      'loadeddata',
      signal,
      15000,
      () => video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA,
    );
    const safeFps = Math.min(MAX_FPS, Math.max(1, Math.round(fps)));
    const seconds = Math.min(MAX_SECONDS, Math.max(0.1, requestedSeconds), video.duration);
    const total = Math.min(MAX_FRAMES, Math.max(1, Math.ceil(seconds * safeFps)));
    const builder = sceneBuilder(width, height);
    const frames: PixelFrame[] = [];
    for (let i = 0; i < total; i += 1) {
      await seekVideo(video, Math.min(i / safeFps, Math.max(0, video.duration - 0.001)), signal);
      const frameDurationMs = Math.max(1, Math.round(Math.min(1 / safeFps, seconds - i / safeFps) * 1000));
      frames.push(builder.frame(video, video.videoWidth, video.videoHeight, frameDurationMs));
      onProgress(i + 1, total);
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      abortIfNeeded(signal);
    }
    return { version: 1, width, height, palette: builder.palette, frames };
  } finally {
    video.pause();
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(url);
  }
}
