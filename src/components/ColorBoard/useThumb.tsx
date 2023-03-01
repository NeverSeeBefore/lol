import { MouseEventHandler, useState } from 'react';

type coordinate = { x: number; y: number };
type useThumbParams = {
  minX?: number;
  minY?: number;
  maxX?: number;
  maxY?: number;
  initX?: number;
  initY?: number;
};
type useThumbReturn = [coordinate, MouseEventHandler];

function calcPosition(min: number | undefined, max: number | undefined, poi: number) {
  if (typeof min !== 'undefined' && poi < min) {
    return min;
  }
  if (typeof max !== 'undefined' && poi > max) {
    return max;
  }
  return poi;
}

export function useThumb({ minX, maxX, initX, minY, maxY, initY }: useThumbParams): useThumbReturn {
  const [position, setPosition] = useState({ x: initX || minX || 0, y: initY || minY || 0 });
  let offsetLeft = 0;
  let offsetTop = 0;

  const changePosition = (clientX: number, clientY: number) => {
    setPosition({
      x: calcPosition(minX, maxX, clientX - offsetLeft),
      y: calcPosition(minY, maxY, clientY - offsetTop),
    });
  };

  const mouseMove = (event: MouseEvent) => {
    changePosition(event.clientX, event.clientY);
  };

  const mouseUp = () => {
    document.removeEventListener('mousemove', mouseMove);
    document.removeEventListener('mouseup', mouseUp);
  };

  const mouseDown: MouseEventHandler<HTMLElement> = function mouseDown(event) {
    offsetLeft = event.currentTarget.offsetLeft;
    offsetTop = event.currentTarget.offsetTop;
    changePosition(event.clientX, event.clientY);
    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup', mouseUp);
  };

  return [position, mouseDown];
}
