# Spec Delta

## Purpose

定义站点级暗色主题能力：以设计令牌与组件库主题映射的双轨制，约束全站页面与组件的颜色、对比度、焦点、选中态与禁用态表现，使界面符合 docs/design/ui-spec.md 的暗色规范。

## ADDED Requirements

### Requirement: 全站暗色背景与亮色文字

系统 SHALL 以令牌 `--bg-base`（#131417）作为页面底色、`--text-primary`（#E8ECF1）作为主文字色，并通过 `color-scheme: dark` 使原生控件（滚动条、表单、autofill）同样呈暗色。正文级文字与背景组合的对比度 MUST 达到 WCAG AA（≥4.5:1）。

#### Scenario: 打开任意页面

- **WHEN** 用户打开站点任意页面
- **THEN** 页面底色为 #131417，主文字为 #E8ECF1，浏览器原生滚动条与表单控件呈暗色

#### Scenario: 正文对比度

- **WHEN** 检查任意正文级文字与其背景
- **THEN** 对比度不低于 4.5:1

### Requirement: 设计令牌单一来源

系统 SHALL 在全局样式中引入 `src/static/styles/theme.less` 的 CSS 变量令牌，自定义组件 MUST 使用令牌而非硬编码色值。旧变量（`--dark-*`、`--white-*`、`--page-*`）SHALL 以别名形式保留一个版本周期。

#### Scenario: 组件引用颜色

- **WHEN** 检查任意自定义组件的样式源码
- **THEN** 颜色均来自 `var(--*)` 令牌引用，不出现新的硬编码十六进制色值（令牌定义文件本身除外）

#### Scenario: 旧变量兼容

- **WHEN** 旧代码引用 `--page-font-color` 等旧变量
- **THEN** 其解析结果与对应新令牌一致，页面渲染无变化

### Requirement: antd 组件暗色映射

系统 SHALL 通过 ConfigProvider 的 darkAlgorithm 与 token 覆盖使 antd 组件呈暗色：主按钮 MUST 为琥珀底（#FA8C16）配深棕黑文字（#1A1206），表单控件 MUST 无 focus 外发光，antd 容器/弹层/边框色 MUST 与 CSS 变量阶梯一致。

#### Scenario: 主按钮渲染

- **WHEN** 页面渲染 antd `Button type="primary"`
- **THEN** 按钮为琥珀底深棕黑字，文字对比度 ≥4.5:1

#### Scenario: 输入框焦点

- **WHEN** 用户聚焦 antd Input
- **THEN** 不出现默认外发光（controlOutline），焦点以 2px 描边表达

### Requirement: 统一焦点可见性

所有可交互元素 MUST 在键盘聚焦时呈现统一焦点样式：2px `--focus-ring` 描边加 2px 偏移，不使用外发光。

#### Scenario: 键盘导航

- **WHEN** 用户用 Tab 在按钮、链接、输入框之间移动焦点
- **THEN** 每个聚焦元素显示一致的 2px 琥珀描边

### Requirement: 选中态两级归属

路由级选中（当前工具、当前侧栏项）MUST 使用该工具专属色的 12% 透明度底色；数据级选中（列表行、表格行）MUST 使用 `--accent-bg` 琥珀浅底。同一界面不得混用。

#### Scenario: 工具页侧栏

- **WHEN** 用户在工具页选中"JSON 格式化"
- **THEN** 侧栏该项显示工具青色（#3EC6E0）12% 浅底与青色文字

#### Scenario: 文章列表选中

- **WHEN** 用户选中文章列表中的某一行
- **THEN** 该行显示琥珀 12% 浅底

### Requirement: 禁用态明度方向

禁用控件 MUST NOT 比其所在容器更亮；禁用态以透明或更暗底色加 `--text-disabled` 文字表达。

#### Scenario: 禁用按钮

- **WHEN** 按钮处于禁用状态
- **THEN** 其背景不为高于容器的明度档，文字为 #454F5B

### Requirement: 运行时颜色读取迁移

凡运行时通过 getComputedStyle 读取 CSS 变量的代码，MUST 改读新令牌，删除旧变量后渲染结果不得变化。

#### Scenario: TweenDemo 画布描边

- **WHEN** 删除旧变量别名后打开 Test 页的 TweenDemo
- **THEN** canvas 描边色与 `--text-primary` 一致，不出现静默变为纯白的情况
