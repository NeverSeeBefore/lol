# Spec Delta

## Purpose

定义缓动函数可视化工具能力：以按族分组的曲线网格总览为入口，帮助前端开发直观对比项目内置的全部缓动曲线，点选后查看放大曲线与实时动画预览，并获取可直接粘贴的 CSS 代码（cubic-bezier 拟合或 @keyframes），解决「选缓动靠猜、写代码靠查表」的日常痛点。

## ADDED Requirements

### Requirement: 曲线网格总览

系统 SHALL 将 tween.ts 采样数据中的全部缓动曲线（45 条，与 tweenDotObjDemo 一一对应）按族分组（Quad/Cubic/Quart/Quint/Sine/Expo/Circ/Back/Elastic/Bounce/Other）以网格形式展示，每条曲线用 canvas 绘制其函数图像，并标注函数名。

#### Scenario: 打开工具页

- **WHEN** 用户打开 `/tools/easing`
- **THEN** 页面展示全部 45 条曲线的网格总览，曲线按族分组排列，每条曲线标注函数名，曲线图像与采样数据一致

#### Scenario: 暗色渲染

- **WHEN** 页面在暗色主题下渲染曲线
- **THEN** 网格与曲线颜色取自 theme.less 令牌（经 getComputedStyle 读取），无硬编码色值

### Requirement: 点选切换与详情展示

系统 SHALL 支持点选网格中任一曲线，详情区展示该曲线的放大图像与族/名称信息；再次点选其他曲线时详情区同步更新，当前选中曲线在网格中有明确选中态。

#### Scenario: 点选曲线

- **WHEN** 用户点击网格中的 easeInOutQuad
- **THEN** 详情区展示 easeInOutQuad 的放大曲线图与名称，网格中该项呈现选中态

#### Scenario: 切换选中

- **WHEN** 用户已选中 easeInOutQuad，再点击 easeOutBounce
- **THEN** 详情区切换为 easeOutBounce 的放大曲线，网格选中态同步移动

### Requirement: 实时动画预览

系统 SHALL 在详情区提供实时动画预览：一个小球按当前选中缓动函数循环运动（rAF 驱动），切换曲线时动画立即按新函数运行。

#### Scenario: 动画运行

- **WHEN** 用户选中任一曲线
- **THEN** 预览区小球按该缓动函数的节奏循环运动，且运动轨迹速度特征与曲线形状一致

#### Scenario: 切换曲线后动画更新

- **WHEN** 用户在动画运行中切换选中曲线
- **THEN** 小球立即按新缓动函数运动，无卡顿或残留旧节奏

### Requirement: CSS 代码输出

系统 SHALL 为当前选中曲线生成可复制的 CSS 代码：值域在 [0,1] 内的曲线 MUST 给出 `cubic-bezier()` 最小二乘拟合值（拟合误差需在可接受范围）；值域超出 [0,1] 的曲线（Back/Elastic/Bounce 类等）MUST NOT 输出 cubic-bezier，改为输出 `@keyframes` 代码并在 UI 明确提示「该曲线值域超出 [0,1]，按约定不输出 cubic-bezier，请使用 @keyframes」。

#### Scenario: 普通曲线的 cubic-bezier 输出

- **WHEN** 用户选中 easeInOutQuad
- **THEN** 代码区输出 `cubic-bezier(0.45, 0, 0.55, 1)`（允许四舍五入到两位小数的等价值），且可一键复制

#### Scenario: 超界曲线的 keyframes 兜底

- **WHEN** 用户选中 easeOutBack（值域超出 1）
- **THEN** 代码区只输出 `@keyframes` 代码，不出现 cubic-bezier，UI 给出「值域超出 [0,1]，按约定不输出 cubic-bezier」的明确提示

#### Scenario: 复制代码

- **WHEN** 用户点击复制按钮
- **THEN** 当前代码写入剪贴板，界面提示已复制

### Requirement: 暗色规范与工具专属色

工具页面 MUST 遵守暗色规范：颜色一律引用 theme.less 令牌（含 canvas 内绘制颜色经 getComputedStyle 读取令牌），不新增硬编码色值；theme.less 工具专属色区块 MUST 登记 `--tool-easing: #c5eb84`（荧光绿 82°，亮层），页面标题与选中态使用 `--tool-easing`，按钮、focus 等交互元素仍用琥珀系令牌。

#### Scenario: 页面渲染

- **WHEN** 打开 `/tools/easing`
- **THEN** 页面为暗色底，标题为荧光绿 `--tool-easing`，交互元素继承暗色令牌，无新增硬编码色值
