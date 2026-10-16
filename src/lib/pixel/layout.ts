export function getPixelLayout(
  cssWidth: number,
  cssHeight: number,
  columns: number,
  rows: number,
  squarePixels: boolean,
) {
  const pixelSize = Math.max(cssWidth / columns, cssHeight / rows);
  const pixelWidth = squarePixels ? pixelSize : cssWidth / columns;
  const pixelHeight = squarePixels ? pixelSize : cssHeight / rows;
  return {
    pixelWidth,
    pixelHeight,
    offsetX: squarePixels ? (cssWidth - pixelWidth * columns) / 2 : 0,
    offsetY: squarePixels ? (cssHeight - pixelHeight * rows) / 2 : 0,
  };
}
