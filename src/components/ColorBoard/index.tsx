import { SwapOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import colorConvert from 'Src/utils/colorConvert';
import styles from './index.module.less';
import { useThumb } from './useThumb';

enum ColorTypeEnum {
  RGB = 'RGB',
  HSV = 'HSV',
  HSL = 'HSL',
  HEX = 'HEX',
}

export interface BoardColor {
  /** 六位大写 HEX（不带 #） */
  hex: string;
  /** [r, g, b]，0-255 整数 */
  rgb: number[];
  /** 透明度 0-1 */
  opacity: number;
}

interface ColorBoardProps {
  /**
   * 初始颜色（HEX，`#` 可省略），仅在挂载时读取一次；
   * 外部要改色请用 key 重挂载。不传时组件自治（向后兼容，默认红色）
   */
  defaultValue?: string;
  /** 拖拽滑块导致颜色变化时触发（挂载首帧不触发） */
  onChange?: (color: BoardColor) => void;
}

/** 解析 #RGB / #RRGGBB（# 可省略）为 [r, g, b]，失败返回 null */
const parseHexToRgb = (hex: string): number[] | null => {
  const str = hex.trim().replace(/^#/, '');
  if (!/^([\da-f]{3}|[\da-f]{6})$/i.test(str)) return null;
  const full = str.length === 3 ? [...str].map((d) => d + d).join('') : str;
  return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16));
};

export default function ColorBorad({ defaultValue, onChange }: ColorBoardProps) {
  const width = 200;

  // 初始颜色：挂载时解析一次，派生出各状态与滑块初始位置
  // （内部 h/s/v 会量化到整数度/百分比，故初始色可能略有吸附）
  const [initial] = useState(() => {
    const parsed = defaultValue ? parseHexToRgb(defaultValue) : null;
    const [h, s, v] = parsed ? colorConvert.rgbCChsv(parsed) : [0, 100, 100];
    const hue = Math.round(h);
    const saturation = Math.round(s) / 100;
    const value = Math.round(v) / 100;
    const rgb = colorConvert.hsvCCrgb([hue, saturation * 100, value * 100]);
    return {
      hue,
      saturation,
      value,
      rgb,
      hsl: colorConvert.hsvCChsl([hue, saturation * 100, value * 100]),
      hex: colorConvert.rgbCChex(rgb),
      hueThumbX: (h / 360) * width,
      satThumbX: (s / 100) * width,
      valThumbY: (1 - v / 100) * width,
    };
  });

  const [colorType, setColorType] = useState<ColorTypeEnum>(ColorTypeEnum.HSV);
  const [hue, setHue] = useState(initial.hue);
  const [saturation, setSaturation] = useState(initial.saturation);
  const [value, setValue] = useState(initial.value);
  const [opacity, setOpacity] = useState(1);
  const [rgb, setRgb] = useState(initial.rgb);
  const [hsl, setHsl] = useState(initial.hsl);
  const [hex, setHex] = useState(initial.hex);

  // 上一次已通知父组件的颜色（hex 由 rgb 派生，hex+opacity 即可完整去重）；
  // setRgb 新数组同值造成的 effect 重跑不会重复触发 onChange
  const lastNotifiedRef = useRef<{ hex: string; opacity: number } | null>(null);
  // 挂载首帧的派生态同步不视为用户操作（此时是 defaultValue 的量化回声，不应覆盖父组件的精确值）
  const skipFirstChangeRef = useRef(true);

  const [hueThumbPosition, hueThumbMouseDown] = useThumb({
    minX: 0,
    maxX: width,
    initX: initial.hueThumbX,
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
    initX: initial.satThumbX,
    initY: initial.valThumbY,
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

  // 颜色变化时通知父组件（onChange 需用 useCallback 保持稳定）
  useEffect(() => {
    const last = lastNotifiedRef.current;
    if (last && last.hex === hex && last.opacity === opacity) return;
    lastNotifiedRef.current = { hex, opacity };
    if (skipFirstChangeRef.current) {
      skipFirstChangeRef.current = false;
      return;
    }
    onChange?.({ hex, rgb, opacity });
  }, [hex, rgb, opacity, onChange]);

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
    </div>
  );
}
