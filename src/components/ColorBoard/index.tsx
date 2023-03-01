import { SwapOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import colorConvert from 'Src/utils/colorConvert';
import styles from './index.module.less';
import { useThumb } from './useThumb';

enum ColorTypeEnum {
  RGB = 'RGB',
  HSV = 'HSV',
  HSL = 'HSL',
  HEX = 'HEX',
}

export default function ColorBorad() {
  const width = 200;

  const [colorType, setColorType] = useState<ColorTypeEnum>(ColorTypeEnum.HSV);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [value, setValue] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const [rgb, setRgb] = useState([0, 0, 0]);
  const [hsl, setHsl] = useState([0, 0, 0]);
  const [hex, setHex] = useState('000000');

  const [hueThumbPosition, hueThumbMouseDown] = useThumb({
    minX: 0,
    maxX: width,
  });
  const [opacityThumbPosition, opacityThumbMouseDown] = useThumb({
    minX: 0,
    maxX: width,
    initX: width,
  });
  const [satValThumbPosition, satValThumbMouseDown] = useThumb({
    minX: 0,
    maxX: width,
    minY: 0,
    maxY: width,
    initX: width,
    initY: 0,
  });

  // 色相
  useEffect(() => {
    setHue(Math.round((hueThumbPosition.x / width) * 360));
  }, [hueThumbPosition]);

  // 饱和度、亮度
  useEffect(() => {
    const { x, y } = satValThumbPosition;
    setSaturation(Math.round((x / width) * 100) / 100);
    setValue(Math.round((1 - y / width) * 100) / 100);
  }, [satValThumbPosition]);

  // 透明度
  useEffect(() => {
    setOpacity(Math.round((opacityThumbPosition.x / width) * 100) / 100);
  }, [opacityThumbPosition]);

  useEffect(() => {
    setRgb(colorConvert.hsvCCrgb([hue, saturation * 100, value * 100]));
    setHsl(colorConvert.hsvCChsl([hue, saturation * 100, value * 100]));
    // setHsl(colorConvert.hsvCChsl([hue, saturation * 100, value * 100]));
  }, [hue, saturation, value]);

  useEffect(() => {
    setHex(colorConvert.rgbCChex(rgb));
  }, [rgb]);

  const changeColorType = () => {
    const { RGB, HEX, HSL, HSV } = ColorTypeEnum;
    switch (colorType) {
      case RGB:
        setColorType(HEX);
        break;
      case HEX:
        setColorType(HSL);
        break;
      case HSL:
        setColorType(HSV);
        break;
      case HSV:
        setColorType(RGB);
        break;
    }
  };
  return (
    <div className={styles.container} style={{ width }}>
      <div
        className={styles.swatches}
        style={{ backgroundColor: `hsl(${hue}, 100%, 50%)` }}
        onMouseDown={satValThumbMouseDown}
      >
        <div
          className={styles['swatches-thumb']}
          style={{ left: `${satValThumbPosition.x}px`, top: `${satValThumbPosition.y}px` }}
        />
      </div>
      <div className={styles['hue-stripe']} onMouseDown={hueThumbMouseDown}>
        <div className={styles.thumb} style={{ left: `${hueThumbPosition.x}px` }} />
      </div>
      <div className={styles['opacity-wrap']} onMouseDown={opacityThumbMouseDown}>
        <div
          className={styles.opacity}
          style={{
            backgroundImage: `linear-gradient(to right, transparent 0%, rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`,
          }}
        >
          <div className={styles.thumb} style={{ left: `${opacityThumbPosition.x}px` }} />
        </div>
      </div>
      <div className={styles['result-wrap']}>
        <div className={styles.left}>{colorType}</div>
        <div className={styles.center}>
          {colorType === ColorTypeEnum.HSV && (
            <div className={styles['color-value']}>
              <span>{hue}</span> <span>{saturation}</span> <span>{value}</span> <span>{opacity}</span>
            </div>
          )}
          {colorType === ColorTypeEnum.RGB && (
            <div className={styles['color-value']}>
              <span>{rgb[0]}</span> <span>{rgb[1]}</span> <span>{rgb[2]}</span> <span>{opacity}</span>
            </div>
          )}
          {colorType === ColorTypeEnum.HSL && (
            <div className={styles['color-value']}>
              <span>{hsl[0]}</span> <span>{hsl[1]}</span> <span>{hsl[2]}</span> <span>{opacity}</span>
            </div>
          )}
          {colorType === ColorTypeEnum.HEX && (
            <div className={styles['color-value']}>
              <span>#{hex}</span>
            </div>
          )}
        </div>
        <div className={styles.right}>
          <div className={styles['color-preview-box']}>
            <div
              style={{
                backgroundColor: `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`,
              }}
            />
          </div>
          <SwapOutlined onClick={changeColorType} />
        </div>
      </div>
      {/* <div className="test">
        <input type="color" name="" id="" />
        <br />
        H: {hueThumbPosition.x}
        <br />
        S: {satValThumbPosition.x}
        <br />
        V: {satValThumbPosition.y}
        <br />
        A: {opacityThumbPosition.x}
        <br />
        H: {hue}
        <br />
        S: {saturation}
        <br />
        V: {value}
        <br />
        A: {opacity}
        <br />
      </div> */}
    </div>
  );
}
