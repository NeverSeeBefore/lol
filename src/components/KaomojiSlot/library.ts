/** 精选颜文字：保留不同长度和完整的手势、身体与情绪。 */
export const KAOMOJI_LIBRARY = [
  { face: '(•ᴗ•)', mood: '开心' },
  { face: '(＾▽＾)', mood: '开心' },
  { face: '(≧◡≦)', mood: '开心' },
  { face: '(๑˃ᴗ˂)ﻭ', mood: '开心' },
  { face: 'ヽ(>∀<☆)ノ', mood: '开心' },
  { face: '٩(◕‿◕｡)۶', mood: '开心' },
  { face: 'ヾ(⌐■_■)ノ♪', mood: '开心' },
  { face: '＼(≧▽≦)／', mood: '开心' },
  { face: '(*¯︶¯*)', mood: '开心' },
  { face: '♪(´▽｀)', mood: '开心' },
  { face: '(｡◕‿◕｡)', mood: '可爱' },
  { face: '(づ｡◕‿‿◕｡)づ', mood: '可爱' },
  { face: 'ʕ•ᴥ•ʔ', mood: '可爱' },
  { face: 'ʕっ•ᴥ•ʔっ', mood: '可爱' },
  { face: '(=^･ω･^=)', mood: '可爱' },
  { face: '(ฅ^•ﻌ•^ฅ)', mood: '可爱' },
  { face: '(｡♥‿♥｡)', mood: '可爱' },
  { face: '(ﾉ◕ヮ◕)ﾉ*:･ﾟ✧', mood: '可爱' },
  { face: '(♡˙︶˙♡)', mood: '可爱' },
  { face: '꒰ᐢ. .ᐢ꒱', mood: '可爱' },
  { face: '(⊙_⊙)', mood: '惊讶' },
  { face: '(°ロ°) !', mood: '惊讶' },
  { face: 'Σ(°△°|||)', mood: '惊讶' },
  { face: '(☉_☉)', mood: '惊讶' },
  { face: '＼(〇_ｏ)／', mood: '惊讶' },
  { face: '(；ﾟДﾟ)', mood: '惊讶' },
  { face: '(゜-゜)', mood: '惊讶' },
  { face: '(╯°□°）╯︵ ┻━┻', mood: '动作' },
  { face: '┬─┬ノ( º _ ºノ)', mood: '动作' },
  { face: 'ᕕ( ᐛ )ᕗ', mood: '动作' },
  { face: 'ᕙ(⇀‸↼‶)ᕗ', mood: '动作' },
  { face: '(ง •̀_•́)ง', mood: '动作' },
  { face: '(っ˘ڡ˘ς)', mood: '动作' },
  { face: '(ノಠ益ಠ)ノ彡┻━┻', mood: '动作' },
  { face: 'ε=ε=ε=┌(￣▽￣)┘', mood: '动作' },
  { face: '(っ´▽｀)っ', mood: '动作' },
  { face: '(－_－) zzZ', mood: '安静' },
  { face: '(￣o￣) . z Z', mood: '安静' },
  { face: '( ˘ω˘ )', mood: '安静' },
  { face: '(´-ω-`)', mood: '安静' },
  { face: '(｡-_-｡)', mood: '安静' },
  { face: '(╥﹏╥)', mood: '难过' },
  { face: '(ಥ_ಥ)', mood: '难过' },
  { face: '(｡•́︿•̀｡)', mood: '难过' },
  { face: '(つ﹏⊂)', mood: '难过' },
  { face: '(っ- ‸ - ς)', mood: '难过' },
  { face: '(；へ：)', mood: '难过' },
  { face: 'ಠ_ಠ', mood: '无语' },
  { face: '(¬_¬)', mood: '无语' },
  { face: '(눈_눈)', mood: '无语' },
  { face: '¯\\_(ツ)_/¯', mood: '无语' },
  { face: '(￣ヘ￣)', mood: '无语' },
  { face: '(；一_一)', mood: '无语' },
] as const;

/** 短颜文字的组合零件；与精选库混合抽取。 */
export const FRAMES = [
  { left: '(', right: ')' },
  { left: '（', right: '）' },
  { left: '༼', right: '༽' },
  { left: 'ʕ', right: 'ʔ' },
  { left: '⸜(', right: ')⸝' },
] as const;

export const EYES = [
  { left: '•', right: '•' },
  { left: '＾', right: '＾' },
  { left: '◕', right: '◕' },
  { left: '눈', right: '눈' },
  { left: '≧', right: '≦' },
  { left: '´', right: '`' },
  { left: '｡', right: '｡' },
  { left: '◠', right: '◠' },
  { left: 'ಠ', right: 'ಠ' },
  { left: '⊙', right: '⊙' },
] as const;

export const MOUTHS = ['ᴗ', 'ω', '▽', '︿', '﹏', '益', 'ヮ', '∀', '﹃', '‿', 'з', 'ᗜ'] as const;

function composedKaomoji(): string {
  const frame = FRAMES[Math.floor(Math.random() * FRAMES.length)];
  const eyes = EYES[Math.floor(Math.random() * EYES.length)];
  const mouth = MOUTHS[Math.floor(Math.random() * MOUTHS.length)];
  return `${frame.left}${eyes.left}${mouth}${eyes.right}${frame.right}`;
}

/** 随机抽取完整表情；精选库与组合库各占一半，并避免连续重复。 */
export function randomKaomoji(previous?: string): string {
  let face: string;
  do {
    face =
      Math.random() < 0.5
        ? KAOMOJI_LIBRARY[Math.floor(Math.random() * KAOMOJI_LIBRARY.length)].face
        : composedKaomoji();
  } while (face === previous);
  return face;
}
