# Design

## Context

资产盘点（已核实）：

- `src/views/Test/components/ColorTransform/` 是 `ColorBoard` 的裸包装，无业务逻辑
- `src/components/ColorBoard/`：HSV 取色板（色相条 + 饱和明度面板 + 透明度条 + 四种读数轮播），内部自治（useState + useThumb 管理滑块位置），**无受控接口**，父组件拿不到也设不了颜色
- `src/utils/colorConvert.ts`：15 个纯函数，覆盖 RGB↔HSL↔HSV↔HEX↔Gray；接口风格不统一（`rgb2hsl` 返回 0–1 数组、`rgbCChsl` 返回度/百分比数组、`hex2rgb` 返回 `rgb(...)` 字符串），无 alpha；Test 页在用，**不可改签名**
- 工具注册机制：`src/views/Tools/tools.tsx` 数组，路由（router/index.tsx）与子导航（Tools/index.tsx）共用
- 令牌 `--tool-color: #a78bfa` 已登记于 theme.less

约束：pnpm 严格隔离（dayjs、@ant-design/colors 是传递依赖，不可用——HEX 解析与对比度公式须自实现）；暗色规范禁止新增硬编码色值。

## Goals / Non-Goals

**Goals:**

- ColorBoard 受控化（向后兼容），工具页可受控设置/读取颜色
- 四格式双向互转 + 手动输入反解析 + 一键复制
- 相对 `--bg-base` 的 WCAG 对比度实时计算与 AA/AAA 判定（差异化点）
- `pnpm build` + `pnpm lint` 通过，Playwright 截图验收

**Non-Goals:**

- 不重构 `Utils/colorConvert` 的签名与实现
- 不做多底色对比（只对 bg-base）、不做调色板/配色方案生成
- 不做 alpha 通道的格式输入（rgba()/hsla() 解析），alpha 仅由取色板透明度条产生
- 不改 Test 页 ColorTransform 的用法

## Decisions

### D1: ColorBoard 接口方案——defaultValue + onChange + key 重挂载

`ColorBoard` 新增可选 props：`defaultValue?: string`（HEX，仅挂载时读取一次，初始化滑块位置与读数）与 `onChange?: (color: BoardColor) => void`（仅用户拖拽触发）。父组件要外部改色时 bump `key` 重挂载取色板。

为何不用经典受控 `value`：取色板内部把 h/s/v 量化到整数度/百分比，任意 HEX 反写会被吸附（#A78BFA → #A78CFA）；受控 value 下「写入 → 量化 → 回传 → 父态漂移」形成回声，effect 级联中 prop 变化与内部 hex 更新存在时序竞态（实测出现振荡与状态回滚）。defaultValue + key 重挂载把「外部写入」与「用户拖拽」彻底分离：拖拽不触发重挂载，输入反填才重挂载，无回声通道。`onChange` 内部用「上次通知值（hex+opacity）去重 + 挂载首帧跳过」双守卫，杜绝挂载回声与 setState 新数组同值导致的重复触发。

备选：受控 value + 量化结果比对抑制回传——时序竞态无法根除，否决。备选：在工具内 fork 一个取色板——重复 200 行拖拽逻辑，否决。

### D2: 工具内适配层 `Src/views/Tools/ColorConverter/utils.ts`

封装 `Utils/colorConvert` 的 CC 系列（度/百分比风格）：统一内部表示为 `{ r, g, b, a }`（0–255 + 0–1），对外提供：

- `formatHex / formatRgb / formatHsl / formatHsv`（标准化字符串）
- `parseHex / parseRgb / parseHsl / parseHsv`（容忍 `#` 省略、函数写法、纯数字串；失败返回 null）
- `relativeLuminance` 与 `contrastRatio`（WCAG 2.x 公式：sRGB 通道线性化 → Y = 0.2126R+0.7152G+0.0722B → (L1+0.05)/(L2+0.05)）；alpha<1 时先与底色做 source-over 合成再算
- 底色常量通过 `getComputedStyle(document.documentElement).getPropertyValue('--bg-base')` 运行时读取，回退 `#131417`——不硬编码进转换逻辑之外的展示

### D3: 页面状态模型——单一 RGBA 状态，输入框局部草稿

页面持有 `{ r, g, b, a }` 单一事实来源；四个格式行各自是「输入框（受控草稿）+ 复制按钮」，失焦/回车时解析草稿：成功则 setColor（经 ColorBoard value 回写滑块）并重置草稿为格式化值；失败则 message.error 并保留当前颜色。输入中不实时改颜色，避免半输入状态（如 `#A7`）引起跳动。

### D4: 对比度展示为独立卡片

格式行下方放对比度卡片：大字号显示比值（如 `15.5:1`）+ 判定徽标（AAA `--success` / AA `--success` / AA Large `--warning` / 不合格 `--error`）+ 一行预览（当前色文字置于 `--bg-base` 色块上）。徽标用语义令牌，不新增色值。

### D5: 工具注册

`tools.tsx` 追加 `{ name: '颜色转换', path: 'color', element: <ColorConverter /> }`，路由与子导航自动生效。页面标题用 `--tool-color`；antd 组件（Button/Input/message）继承既有 ConfigProvider 暗色映射。

## Risks / Trade-offs

- [取色板 h/s/v 量化导致外部写入的颜色轻微吸附（±1/255）] → 工具行保持用户输入的精确值，仅取色板自身读数显示量化值；视觉上不可分辨
- [拖拽中 bump key 会重挂载取色板、打断拖拽] → 仅在手动输入反填时 bump，拖拽路径不动 key
- [`Utils/colorConvert` 旧函数（rgb2hsl 等 0–1 风格）与 CC 系列混用出错] → 适配层只用 CC 系列 + 自实现 hex 解析，旧函数不碰
- [运行时读 `--bg-base` 时机过早拿到空值] → 模块级不读，在组件挂载后用 useMemo/effect 读，带 `#131417` 回退
- [stylelint 字母序/prettier 冲突] → 提交前跑 `pnpm lint` 与 lint-staged，--fix 整理

## Migration Plan

1. `ColorBoard` 加 `defaultValue`/`onChange`（向后兼容，初始状态派生自 defaultValue）
2. 新建 `ColorConverter/utils.ts` 适配层
3. 新建 `ColorConverter/index.tsx` + `index.module.less`
4. `tools.tsx` 注册
5. `pnpm build` + `pnpm lint`
6. `pnpm dev` + Playwright 截图验证（暗色、取色板、输入反填、对比度），发现问题修代码
7. 单提交 `feat: add color converter tool`，无回滚压力

## Open Questions

- 无（对比度阈值采用 WCAG 2.x 标准值 4.5/7/3，已在 spec 固化）
