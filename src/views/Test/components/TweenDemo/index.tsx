import React, { useEffect, useRef } from 'react';
import { tween, tweenDotObjDemo } from 'Utils/tween';
import styles from './index.module.less';

interface IProps {}

type TTweenKey = keyof typeof tween;

function TweenDemo() {
  console.log('render');
  const canvasRef = useRef<Partial<Record<string, HTMLCanvasElement>>>({});
  const canvasWidth = 100;
  const canvasHeight = 200;
  const canvasSightWidth = 100;
  const canvasSightHeight = 100;

  const funArr = Object.keys(tween) as TTweenKey[];

  useEffect(() => {
    console.log('rendered', canvasRef);
    for (const funName of funArr) {
      if (canvasRef.current[funName] !== undefined && tweenDotObjDemo[funName]) {
        const ctx = canvasRef.current[funName]?.getContext('2d') as CanvasRenderingContext2D;
        ctx.beginPath();
        ctx.translate(0, 50);
        ctx.moveTo(0, 0);
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--page-font-color') || 'white';
        // eslint-disable-next-line prefer-destructuring
        const length = tweenDotObjDemo[funName].length;
        const step = canvasSightWidth / length;
        for (let index = 0; index < length; index++) {
          ctx.lineTo(step * index, canvasSightHeight * tweenDotObjDemo[funName][index]);
        }
        ctx.stroke();
      }
    }
  });

  return (
    <div className={styles['tween-demo']}>
      {/* <Counter />

      <div>a : {a}</div>
      <div>b : {b}</div>
      <span>add: {add(a, b)}</span> */}

      {funArr.map((funName) => {
        return (
          <div className={styles['tween-demo-item']} key={funName} style={{ width: canvasWidth, height: canvasHeight }}>
            <canvas
              ref={(el: HTMLCanvasElement) => {
                canvasRef.current[funName] = el;
              }}
              width={canvasWidth}
              height={canvasHeight}
            />
            <div style={{ width: '100%', textAlign: 'center' }}>{funName}</div>
          </div>
        );
      })}
    </div>
  );
}

export default TweenDemo;
