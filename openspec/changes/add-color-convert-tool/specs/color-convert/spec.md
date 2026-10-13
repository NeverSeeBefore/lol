# Spec Delta

## Purpose

定义颜色转换工具能力：以 HSV 取色板为入口，提供 HEX/RGB/HSL/HSV 四种格式的双向互转（显示与手动输入反向解析）、一键复制，以及相对站点暗色底色的 WCAG 对比度实时评估（AA/AAA），帮助前端开发在暗色主题下挑选可读性合规的颜色。

## ADDED Requirements

### Requirement: 取色板选色

系统 SHALL 提供 HSV 取色板（色相条 + 饱和明度面板 + 透明度条），用户拖拽选色后，四种格式的读数 MUST 实时联动更新。取色板组件 MUST 支持可选的 `defaultValue`/`defaultOpacity`/`onChange` 接口（default* 仅挂载时读取，外部改色经 key 重挂载驱动），不传时维持自治行为，既有调用方（Test 页）行为不变。

#### Scenario: 拖拽选色

- **WHEN** 用户在取色板上拖动色相条、饱和明度面板或透明度条
- **THEN** HEX/RGB/HSL/HSV 四个格式读数与对比度结果实时更新

#### Scenario: 向后兼容

- **WHEN** Test 页的 ColorTransform 不传受控 props 渲染取色板
- **THEN** 取色板行为与改造前一致（自治、可拖拽、读数切换正常）

### Requirement: 四格式互转显示

系统 SHALL 同时显示当前颜色的 HEX、RGB、HSL、HSV 四种格式读数。RGB 分量以 0–255 整数显示，HSL/HSV 的色相以 0–360 整数度、饱和度与明度/亮度以 0–100 百分比显示，HEX 以 `#` 前缀六位大写显示。

#### Scenario: 格式一致性

- **WHEN** 当前颜色确定（如纯红）
- **THEN** 四行读数分别为 `#FF0000`、`rgb(255, 0, 0)`、`hsl(0, 100%, 50%)`、`hsv(0, 100%, 100%)`，互相换算一致

### Requirement: 手动输入反向解析

系统 SHALL 允许用户在任一格式输入框中键入合法颜色值，解析成功后 MUST 反填写色板滑块位置并联动其余三种格式；解析失败时 MUST 提示输入无效且不破坏当前颜色状态。HEX 输入 MUST 兼容 `#RGB`/`#RRGGBB`（`#` 可省略）；RGB/HSL/HSV 输入 MUST 兼容 `rgb(r, g, b)`/`hsl(h, s%, l%)`/`hsv(h, s%, v%)` 函数写法与纯逗号分隔数字。

#### Scenario: 输入 HEX

- **WHEN** 用户在 HEX 输入框键入 `a78bfa` 并确认
- **THEN** 取色板滑块移动到对应位置，RGB/HSL/HSV 读数更新为对应值

#### Scenario: 输入无效值

- **WHEN** 用户键入 `xyz` 并确认
- **THEN** 界面提示无法解析，当前颜色与其余读数保持不变

### Requirement: 一键复制

系统 SHALL 为每种格式读数提供复制按钮，点击后把该格式的字符串写入剪贴板并给出成功反馈。

#### Scenario: 复制 HEX

- **WHEN** 用户点击 HEX 行的复制按钮
- **THEN** 剪贴板内容为 `#A78BFA` 形式的字符串，界面提示已复制

### Requirement: WCAG 对比度提示

系统 SHALL 实时计算当前颜色相对站点底色 `--bg-base`（#131417）的 WCAG 对比度比值（按相对亮度公式，保留至少一位小数），并 MUST 给出判定：≥7:1 标 AAA、≥4.5:1 标 AA、≥3:1 标 AA Large（仅大字）、其余标不合格。透明度 <1 时 MUST 按与底色混合后的合成色计算。

#### Scenario: 高对比度颜色

- **WHEN** 当前颜色为 `#E8ECF1`（主文字色）
- **THEN** 显示对比度约 15.5:1 并标 AAA

#### Scenario: 低对比度颜色

- **WHEN** 当前颜色接近底色（如 `#1A1C20`）
- **THEN** 对比度接近 1:1，判定为不合格并明确展示

### Requirement: 暗色规范与工具专属色

工具页面 MUST 遵守暗色规范：颜色一律引用 theme.less 令牌，不新增硬编码色值；页面标题与内容级选中态使用 `--tool-color`（#A78BFA）；按钮、链接、focus 等交互元素仍用琥珀系令牌。

#### Scenario: 页面渲染

- **WHEN** 打开 `/tools/color`
- **THEN** 页面为暗色底，标题为紫色 `--tool-color`，按钮/输入框等交互元素继承琥珀系暗色令牌，无新增硬编码色值
