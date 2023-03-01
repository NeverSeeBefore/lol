/* eslint-disable no-bitwise */
/* eslint-disable unicorn/prefer-switch */
// https://blog.csdn.net/johnsuna/article/details/120226687

// RGB --> HSL https://blog.csdn.net/qq_36984465/article/details/109715123
const rgb2hsl = ([R, G, B]: number[]) => {
  // R, G and B input range = 0 ÷ 255
  // H, S and L output range = 0 ÷ 1.0

  const mR = +R / 255;
  const mG = +G / 255;
  const mB = +B / 255;

  const min = Math.min(mR, mG, mB); // Min. value of RGB
  const max = Math.max(mR, mG, mB); // Max. value of RGB
  const deltaMax = max - min; // Delta RGB value

  const L = (max + min) / 2;
  let H = 0;
  let S = 0;

  if (deltaMax === 0) {
    // This is a gray, no chroma...
    H = 0;
    S = 0;
  } // Chromatic data...
  else {
    S = L < 0.5 ? deltaMax / (max + min) : deltaMax / (2 - max - min);

    const deltaR = ((max - mR) / 6 + deltaMax / 2) / deltaMax;

    const deltaG = ((max - mG) / 6 + deltaMax / 2) / deltaMax;

    const deltaB = ((max - mB) / 6 + deltaMax / 2) / deltaMax;

    switch (max) {
      case mR:
        H = deltaB - deltaG;
        break;
      case mG:
        H = 1 / 3 + deltaR - deltaB;
        break;
      case mB:
        H = 2 / 3 + deltaG - deltaR;
        break;
      default:
        break;
    }

    if (H < 0) H += 1;
    if (H > 1) H -= 1;
  }
  return [H, S, L];
};

const hsl2rgb = ([H, S, L]: number[]) => {
  // H, S and L input range = 0 ÷ 1.0
  // R, G and B output range = 0 ÷ 255

  let R = 0;
  let G = 0;
  let B = 0;
  if (S === 0) {
    R = L * 255;
    G = L * 255;
    B = L * 255;
  } else {
    const v2 = L < 0.5 ? L * (1 + S) : L + S - S * L;

    const v1 = 2 * L - v2;

    const hue2rgb = (X: number, Y: number, vH: number) => {
      if (vH < 0) vH += 1;
      if (vH > 1) vH -= 1;
      if (6 * vH < 1) return X + (Y - X) * 6 * vH;
      if (2 * vH < 1) return Y;
      if (3 * vH < 2) return X + (Y - X) * (2 / 3 - vH) * 6;
      return X;
    };
    R = 255 * hue2rgb(v1, v2, H + 1 / 3);
    G = 255 * hue2rgb(v1, v2, H);
    B = 255 * hue2rgb(v1, v2, H - 1 / 3);
  }
  return [R, G, B];
};

const rgb2hsv = ([R, G, B]: number[]) => {
  // R, G and B input range = 0 ÷ 255
  // H, S and V output range = 0 ÷ 1.0

  const mR = R / 255;
  const mG = G / 255;
  const mB = B / 255;

  const min = Math.min(mR, mG, mB); // Min. value of RGB
  const max = Math.max(mR, mG, mB); // Max. value of RGB
  const deltaMax = max - min; // Delta RGB value

  const V = max;
  let H = 0;
  let S = 0;

  if (deltaMax === 0) {
    // This is a gray, no chroma...
    H = 0;
    S = 0;
  } // Chromatic data...
  else {
    S = deltaMax / max;

    const deltaR = ((max - mR) / 6 + deltaMax / 2) / deltaMax;
    const deltaG = ((max - mG) / 6 + deltaMax / 2) / deltaMax;
    const deltaB = ((max - mB) / 6 + deltaMax / 2) / deltaMax;

    switch (max) {
      case mR:
        H = deltaB - deltaG;
        break;
      case mG:
        H = 1 / 3 + deltaR - deltaB;
        break;
      case mB:
        H = 2 / 3 + deltaG - deltaR;
        break;
      default:
        break;
    }

    if (H < 0) H += 1;
    if (H > 1) H -= 1;
  }

  return [H, S, V];
};

const hex2rgb = (hex: string) => {
  const str = hex.slice(1);
  const arr =
    str.length === 3
      ? [...str].map((d) => Number.parseInt(d.repeat(2), 16))
      : [
          Number.parseInt(str.slice(0, 2), 16),
          Number.parseInt(str.slice(2, 4), 16),
          Number.parseInt(str.slice(4, 6), 16),
        ];
  return `rgb(${arr.join(', ')})`;
};

// from color-convert
// https://github.com/Qix-/color-convert/blob/master/conversions.js
// NOTE: conversions should only return primitive values (i.e. arrays, or
//       values that give correct `typeof` results).
//       do not use box values types (i.e. Number(), String(), etc.)

// rgb
const rgbCChsl = function (rgb: number[]) {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  const delta = max - min;
  let h = 0;
  let s;

  if (max === min) {
    h = 0;
  } else if (r === max) {
    h = (g - b) / delta;
  } else if (g === max) {
    h = 2 + (b - r) / delta;
  } else if (b === max) {
    h = 4 + (r - g) / delta;
  }

  h = Math.min(h * 60, 360);

  if (h < 0) {
    h += 360;
  }

  const l = (min + max) / 2;

  if (max === min) {
    s = 0;
  } else if (l <= 0.5) {
    s = delta / (max + min);
  } else {
    s = delta / (2 - max - min);
  }

  return [h, s * 100, l * 100];
};

const rgbCChsv = function (rgb: number[]) {
  let rdif;
  let gdif;
  let bdif;
  let h = 0;
  let s;

  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const v = Math.max(r, g, b);
  const diff = v - Math.min(r, g, b);
  const diffc = function (c: number) {
    return (v - c) / 6 / diff + 1 / 2;
  };

  if (diff === 0) {
    h = 0;
    s = 0;
  } else {
    s = diff / v;
    rdif = diffc(r);
    gdif = diffc(g);
    bdif = diffc(b);

    if (r === v) {
      h = bdif - gdif;
    } else if (g === v) {
      h = 1 / 3 + rdif - bdif;
    } else if (b === v) {
      h = 2 / 3 + gdif - rdif;
    }

    if (h < 0) {
      h += 1;
    } else if (h > 1) {
      h -= 1;
    }
  }

  return [h * 360, s * 100, v * 100];
};

const rgbCChex = function (args: number[]) {
  const integer =
    ((Math.round(args[0]) & 0xff) << 16) + ((Math.round(args[1]) & 0xff) << 8) + (Math.round(args[2]) & 0xff);

  const string = integer.toString(16).toUpperCase();
  return '000000'.slice(string.length) + string;
};

const rgbCCgray = function (rgb: number[]) {
  const val = (rgb[0] + rgb[1] + rgb[2]) / 3;
  return [(val / 255) * 100];
};

// hsl
const hslCCrgb = function (hsl: number[]) {
  const h = hsl[0] / 360;
  const s = hsl[1] / 100;
  const l = hsl[2] / 100;
  let t3;
  let val;

  if (s === 0) {
    val = l * 255;
    return [val, val, val];
  }

  const t2 = l < 0.5 ? l * (1 + s) : l + s - l * s;

  const t1 = 2 * l - t2;

  const rgb = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    t3 = h + (1 / 3) * -(i - 1);
    if (t3 < 0) {
      t3++;
    }

    if (t3 > 1) {
      t3--;
    }

    if (6 * t3 < 1) {
      val = t1 + (t2 - t1) * 6 * t3;
    } else if (2 * t3 < 1) {
      val = t2;
    } else if (3 * t3 < 2) {
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
    } else {
      val = t1;
    }

    rgb[i] = Math.round(val * 255);
  }

  return rgb;
};

const hslCChsv = function (hsl: number[]) {
  const h = hsl[0];
  let s = hsl[1] / 100;
  let l = hsl[2] / 100;
  let smin = s;
  const lmin = Math.max(l, 0.01);

  l *= 2;
  s *= l <= 1 ? l : 2 - l;
  smin *= lmin <= 1 ? lmin : 2 - lmin;
  const v = (l + s) / 2;
  const sv = l === 0 ? (2 * smin) / (lmin + smin) : (2 * s) / (l + s);

  return [h, sv * 100, v * 100];
};

// hsv
const hsvCCrgb = function (hsv: number[]) {
  const h = hsv[0] / 60;
  const s = hsv[1] / 100;
  let v = hsv[2] / 100;

  const hi = Math.floor(h) % 6;

  const f = h - Math.floor(h);
  const p = 255 * v * (1 - s);
  const q = 255 * v * (1 - s * f);
  const t = 255 * v * (1 - s * (1 - f));
  v *= 255;

  switch (hi) {
    case 0:
      return [Math.round(v), Math.round(t), Math.round(p)];
    case 1:
      return [Math.round(q), Math.round(v), Math.round(p)];
    case 2:
      return [Math.round(p), Math.round(v), Math.round(t)];
    case 3:
      return [Math.round(p), Math.round(q), Math.round(v)];
    case 4:
      return [Math.round(t), Math.round(p), Math.round(v)];
    // 5
    default:
      return [Math.round(v), Math.round(p), Math.round(q)];
  }
};

const hsvCChsl = function (hsv: number[]) {
  const h = hsv[0];
  const s = hsv[1] / 100;
  const v = hsv[2] / 100;
  const vmin = Math.max(v, 0.01);
  let sl;
  let l;

  l = (2 - s) * v;
  const lmin = (2 - s) * vmin;
  sl = s * vmin;
  sl /= lmin <= 1 ? lmin : 2 - lmin;
  sl = sl || 0;
  l /= 2;

  return [h, Math.round(sl * 100) / 100, Math.round(l * 100) / 100];
};

// gray
const grayCCrgb = function (args: number[]) {
  return [(args[0] / 100) * 255, (args[0] / 100) * 255, (args[0] / 100) * 255];
};

const grayCChsl = function (args: number[]) {
  return [0, 0, args[0]];
};

const grayCChex = function (gray: number[]) {
  const val = Math.round((gray[0] / 100) * 255) & 0xff;
  const integer = (val << 16) + (val << 8) + val;

  const string = integer.toString(16).toUpperCase();
  return '000000'.slice(string.length) + string;
};

export default {
  rgb2hsl,
  hsl2rgb,
  rgb2hsv,
  hex2rgb,
  rgbCChsl,
  rgbCChsv,
  rgbCChex,
  rgbCCgray,
  hslCCrgb,
  hslCChsv,
  hsvCCrgb,
  grayCCrgb,
  hsvCChsl,
  grayCChsl,
  grayCChex,
};
