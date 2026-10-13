# Design

## Context

现状盘点（grep 全量结果）：

- `global.less`：旧变量 `--dark-deep/--dark-normal/--white-normal/--page-*`，body 已暗色（#1c1c1c + 白字）
- 硬编码颜色分布：`Tools/.active` #fa8c16、`JsonFormatter` #888/#52c41a/#ff4d4f、`CodeEditor` 整套浅色（#fff/#24292f/#d9d9d9）、`Counter` #000/#eee、`TweenDemo` 边框 #eee 且运行时读 `--page-font-color`
- **功能色豁免**：`ColorBoard` 的色相梯度（#f00/#ff0…）与 canvas 取色是颜色工具的功能本身，不改；`Loading` 的 rgba(134,112,64) 恰好是琥珀系 canvas 动画色，视觉符合规范，不改
- 入口：`src/index.tsx` 挂 Redux/Router，`src/app.tsx` 无 ConfigProvider

约束：antd 6（CSS-in-JS 运行时主题，不吃 CSS 变量）；规范与令牌已提交（b898918），是事实来源。

## Goals / Non-Goals

**Goals:**

- 双轨接入：CSS 变量管自定义组件，ConfigProvider 管 antd 组件，两边灰阶一致
- 全站暗色无浅色残留（重点：CodeEditor）
- `pnpm build` + `pnpm lint` 通过，浏览器实测截图验收

**Non-Goals:**

- 不做浅色/暗色主题切换（暗色是唯一主题）
- 不重构组件结构、不改功能逻辑
- 不动 ColorBoard 功能色与 Loading canvas 动画色
- 不新增工具卡片墙等规范中的示例组件（属后续功能，非本次迁移）

## Decisions

### D1: ConfigProvider 挂在 index.tsx 最外层

放在 `BrowserRouter`/`Provider` 之外，保证未来任何位置用 antd 组件都被覆盖。备选：挂 app.tsx——可行但层级较浅，未来加 Provider 时易漏。

### D2: antd token 按规范 §6.2 完整映射

`darkAlgorithm` + `colorBgBase: '#131417'` + 钉死 `colorBgContainer/colorBgElevated/colorBgLayout/colorBorder/colorBorderSecondary/colorTextSecondary/colorTextTertiary/colorTextLightSolid: '#1a1206'` + `controlOutlineWidth: 0`，components 级 Button/Input borderRadius 4、Modal borderRadiusLG 12。备选：只设 colorPrimary/colorBgBase——被对抗评审否决（白字琥珀按钮 2.2:1、外发光、派生灰阶漂移）。

### D3: 旧变量改别名而非立即删除

`global.less` 中 `--dark-normal: var(--bg-base)` 等别名保留一个版本周期；`TweenDemo` 运行时读取改 `--text-primary`（唯一运行时消费者，必须随迁移改）。备选：直接删除——TweenDemo 会静默变白描边，否决。

### D4: CodeEditor 整体转暗而非保留浅色"纸张感"

底 `--bg-raised`、字 `--text-primary`、边框 `--border-control`。备选：保留浅色编辑器当"白纸"——暗色站里一块亮白区域是视觉事故，否决。

### D5: JsonFormatter 状态色改用语义令牌

#888→`--text-tertiary`、#52c41a→`--success`、#ff4d4f→`--error`。Tools `.active` #fa8c16→`--accent-text`（文字场景用亮一度琥珀，规范 §5）。

### D6: focus 描边用一条全局规则

`global.less` 加 `:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px }`，配合 antd `controlOutlineWidth: 0`，自定义组件无需逐个写。

## Risks / Trade-offs

- [antd 派生色与 CSS 变量残余色差] → 已钉死全部派生 token；验收时截图比对 Modal/Table 与自定义卡片
- [stylelint `order/properties-alphabetical-order` 对改动文件报序] → 迁移后跑 `pnpm lint`，保存时 --fix 整理
- [prettier/stylelint 对 theme.less 空行规则冲突] → 已用 `stylelint-disable-next-line` 注释解决（b898918 提交中验证通过）
- [Nav 当前是纯文本链接 + " | "分隔，20px 字号与规范冲突] → 本次顺带按规范降到 15px 档并令牌化，不改结构

## Migration Plan

1. global.less：@import theme.less + 旧变量别名化 + color-scheme + ::selection + 全局 focus-visible
2. index.tsx：挂 ConfigProvider（D1/D2）
3. 组件迁移（D3/D4/D5）：CodeEditor、Tools、JsonFormatter、Counter、TweenDemo、ColorBoard 边框
4. `pnpm build` + `pnpm lint` 验证
5. `pnpm dev` 起服务，Playwright 截图逐页验收（含 antd 组件渲染），发现问题回写规范或修代码
6. 无回滚压力：单提交可 revert

## Open Questions

- antd 组件在真实页面的残余色差程度（验收步骤 5 实测后决定是否需要 components 级进一步钉死）
