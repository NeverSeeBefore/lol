# Spec Delta

## Purpose

定义「Markdown 预览」工具能力：左侧 Markdown 编辑（CodeEditor text 模式）、右侧实时渲染预览（useMemo 派生）。渲染管线为 `marked 解析 → DOMPurify 消毒 → dangerouslySetInnerHTML`，所有输出 MUST 经 DOMPurify 默认白名单消毒，拦截 script 标签、事件属性、javascript:/data:text/html URI、iframe、style 表达式等注入。支持 GFM（标题、列表、表格、删除线、代码围栏、引用、链接、图片、autolink）。工具栏提供常用语法快捷插入（加粗/斜体/链接/行内代码/代码块/表格模板）、复制消毒后 HTML、下载 .md。状态栏显示字符数与行数。全程浏览器本地完成，无网络请求。

## ADDED Requirements

### Requirement: 编辑与实时预览

系统 MUST 提供左右双栏布局：左为 Markdown 输入编辑器，右为渲染预览。输入变更 MUST 立即触发重新解析与渲染（派生计算，无需点击按钮）。输入为空时预览区 MUST 显示空态提示，不显示错误。

#### Scenario: 输入即渲染

- **WHEN** 用户在左侧输入 Markdown 文本
- **THEN** 右侧预览立即渲染对应 HTML

#### Scenario: 空输入

- **WHEN** 输入为空
- **THEN** 预览区显示空态提示，无报错

### Requirement: GFM 渲染

系统 MUST 正确渲染以下 GFM 语法：h1-h6 标题、有序/无序列表、表格、删除线、代码围栏（fenced code block）、行内代码、引用块、链接、图片、分割线、粗体/斜体。预览区 MUST 全套暗色化且颜色一律引用 theme.less 令牌（正文 --text-primary、代码块 --bg-base 底、表格边框 --border、链接 --accent-text、引用块左边条 --accent 等），不得出现硬编码色值。

#### Scenario: 标题与列表

- **WHEN** 输入含 `# 标题` 与 `- 项目` 列表
- **THEN** 预览渲染对应 h1 与 ul/li 结构

#### Scenario: 表格

- **WHEN** 输入 GFM 表格语法
- **THEN** 预览渲染 table 结构，边框使用 --border 令牌色

#### Scenario: 代码围栏

- **WHEN** 输入 ``` 包裹的代码块
- **THEN** 预览渲染 pre/code 结构，背景为 --bg-base，等宽字体

#### Scenario: 引用与删除线

- **WHEN** 输入 `> 引用` 与 `~~删除~~`
- **THEN** 预览渲染 blockquote（左边条 --accent 色）与 del 元素

#### Scenario: 中文排版

- **WHEN** 输入中文段落
- **THEN** 预览正确显示中文，无乱码与断行异常

### Requirement: XSS 消毒（安全硬性要求）

系统 MUST 将 marked 产出的全部 HTML 经 DOMPurify（默认配置）消毒后再注入 DOM。以下攻击向量 MUST 全部被拦截，预览区不得执行任何脚本、不得加载 iframe、不得保留危险 URI：

- `<script>` 标签注入
- `<img>` 等标签的 `on*` 事件属性
- `javascript:` 协议的链接 href
- `<iframe>` 嵌入
- `data:text/html` URI
- style 属性中的 `expression()` / `javascript:` URL

复制 HTML 功能 MUST 复制消毒后的 HTML。

#### Scenario: script 标签拦截

- **WHEN** 输入含 `<script>alert(1)</script>`
- **THEN** 预览 DOM 中不存在 script 元素，无脚本执行

#### Scenario: 事件属性拦截

- **WHEN** 输入含 `<img src=x onerror=alert(1)>`
- **THEN** 渲染出的 img 不含 onerror 属性

#### Scenario: javascript: 链接拦截

- **WHEN** 输入 `[x](javascript:alert(1))`
- **THEN** 渲染出的 a 标签不含 javascript: href

#### Scenario: iframe 拦截

- **WHEN** 输入含 `<iframe src="..."></iframe>`
- **THEN** 预览 DOM 中不存在 iframe 元素

#### Scenario: data:text/html 拦截

- **WHEN** 输入 `[x](data:text/html,<script>alert(1)</script>)`
- **THEN** 渲染出的链接不带 data:text/html href

#### Scenario: style 表达式拦截

- **WHEN** 输入含 `<div style="width:expression(alert(1))">` 或 style 中 javascript: URL
- **THEN** 危险样式不生效，无脚本执行

### Requirement: 工具栏快捷插入

系统 MUST 提供工具栏按钮：加粗、斜体、链接、行内代码、代码块、表格模板。点击按钮 MUST 在编辑器光标/选区处插入对应 Markdown 模板：有选区时包裹或替换选区，无选区时插入占位模板并选中占位文本以便直接改字。系统 MUST 提供「复制 HTML」（消毒后）与「下载 .md」按钮，操作后给出反馈提示。

#### Scenario: 无选区插入加粗

- **WHEN** 光标处无选区时点击「加粗」
- **THEN** 插入 `**粗体**` 且「粗体」二字处于选中态

#### Scenario: 有选区包裹

- **WHEN** 选中一段文字后点击「加粗」
- **THEN** 选区被 `**` 包裹

#### Scenario: 表格模板

- **WHEN** 点击「表格」
- **THEN** 插入含表头与分隔行的 GFM 表格模板

#### Scenario: 复制 HTML

- **WHEN** 点击「复制 HTML」
- **THEN** 剪贴板获得消毒后的 HTML 字符串，界面提示复制成功

### Requirement: 状态栏统计

系统 MUST 在状态栏显示输入的字符数与行数，随输入实时更新。

#### Scenario: 统计更新

- **WHEN** 输入 3 行共 20 字符的文本
- **THEN** 状态栏显示 20 字符 / 3 行

## Related Capabilities

（无）
