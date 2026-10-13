# Tasks

## 1. ColorBoard 对外接口（向后兼容）

- [x] 1.1 `ColorBoard` 新增可选 props `defaultValue?: string`（HEX，仅挂载时读取）/`onChange?: (color) => void`（仅拖拽触发）
- [x] 1.2 初始状态（h/s/v/rgb/hsl/hex 与三个滑块位置）挂载时从 defaultValue 派生；不传时行为与改造前一致
- [x] 1.3 onChange 双守卫：上次通知值（hex+opacity）去重 + 挂载首帧跳过（杜绝量化回声与重复触发）

## 2. 适配层

- [x] 2.1 新建 `Src/views/Tools/ColorConverter/utils.ts`：统一 `{ r, g, b, a }` 内部表示，封装 CC 系列函数
- [x] 2.2 实现 `formatHex/Rgb/Hsl/Hsv` 四个格式化函数（HEX 六位大写带 `#`）
- [x] 2.3 实现 `parseHex/Rgb/Hsl/Hsv` 四个解析函数（容忍 `#` 省略、函数写法、纯数字串；失败返回 null）
- [x] 2.4 实现 `relativeLuminance`/`contrastRatio`（WCAG 2.x 公式；alpha<1 先与底色 source-over 合成）

## 3. 工具页面

- [x] 3.1 新建 `Src/views/Tools/ColorConverter/index.tsx` + `index.module.less`：单一 RGBA 状态 + ColorBoard（key 重挂载驱动反填）
- [x] 3.2 四个格式行：输入框草稿（失焦/回车解析反填，失败 message.error 且颜色不变）+ 复制按钮（clipboard + message.success）
- [x] 3.3 对比度卡片：运行时读 `--bg-base`（回退 #131417），显示比值 + AAA/AA/AA Large/不合格徽标（语义令牌）+ 色块文字预览
- [x] 3.4 暗色规范：标题用 `--tool-color`，交互元素用琥珀系令牌，无新增硬编码色值

## 4. 注册与验证

- [x] 4.1 `tools.tsx` 注册 `{ name: '颜色转换', path: 'color' }`
- [x] 4.2 `pnpm build` 通过
- [x] 4.3 `pnpm lint` 无新增 error/warning 爆发
- [x] 4.4 `pnpm dev` 起服务，Playwright 截图 `/tools/color`（暗色、取色板可用、输入反填可用），存 /tmp/lolf-review/color-convert.png
- [x] 4.5 git 提交 `feat: add color converter tool`（含 openspec change 目录）

## Workflow follow-up

- 用户确认验收后运行 openspec archive 归档本变更
