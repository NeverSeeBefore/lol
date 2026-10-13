# Spec Delta

## Purpose

定义正则表达式测试工具能力：以正则输入行（图案 + flags）与测试文本编辑器为入口，提供实时匹配高亮、命中数与捕获组统计、语法错误友好提示与常用模板填入，帮助前端开发在本地快速验证正则，避免把敏感文本粘贴到在线工具。

## ADDED Requirements

### Requirement: 正则输入与 flags 开关

系统 SHALL 提供正则图案输入框与 flags 开关组（g/i/m/s/u/y 六个，antd Checkbox.Group），任一变更 MUST 触发实时重新匹配，无需点击执行按钮。

#### Scenario: 输入正则实时匹配

- **WHEN** 用户在图案输入框输入 `\d+` 且测试文本含数字
- **THEN** 测试文本中的数字片段实时高亮，统计区显示命中数

#### Scenario: 切换 flags

- **WHEN** 用户勾选 `i`（忽略大小写）
- **THEN** 匹配结果立即按新 flags 重算，高亮与统计同步更新

### Requirement: 匹配高亮

系统 SHALL 在测试文本编辑器内对匹配片段实时高亮：使用 CodeMirror 6 `MatchDecorator` + `Decoration.mark`（类名 `cm-live-match`），高亮背景 MUST 为 `--tool-regex-bg`（工具专属色 `--tool-regex` 的 12% 透明度底）。高亮用正则 MUST 带 `g` flag。正则可匹配空串时 MUST 跳过编辑器高亮并给出提示（MatchDecorator 对空匹配不前进 lastIndex，会死循环）。

#### Scenario: 匹配片段高亮渲染

- **WHEN** 正则 `\w+@(\w+)\.com`、测试文本含邮箱地址
- **THEN** 编辑器内每个匹配片段带 `--tool-regex-bg` 背景色

#### Scenario: 空匹配正则防护

- **WHEN** 用户输入 `a*`（可匹配空串）
- **THEN** 编辑器高亮被跳过，界面提示原因；匹配统计仍正常计算

### Requirement: 匹配统计与捕获组表格

系统 SHALL 实时显示命中数，并以表格列出各次匹配的捕获组内容：行 MUST 为「第 N 个匹配 × 匹配全文 × 组 1…组 N」，空捕获组显示占位符 `-`。表格 MUST 限制最多 100 行，超出时提示已截断。无 `g` flag 时统计语义为首个匹配。

#### Scenario: 捕获组表格

- **WHEN** 正则 `(\w+)@(\w+)\.com`、测试文本含两个邮箱
- **THEN** 表格显示 2 行，列为 # / 匹配全文 / 组 1 / 组 2，各组内容正确

#### Scenario: 命中数截断

- **WHEN** 匹配数超过 100
- **THEN** 表格只显示前 100 行并提示截断，命中数显示真实总数

### Requirement: 语法错误友好提示

系统 SHALL 在正则语法非法时实时给出说明原因的中文错误文案（由 RegExp 构造的 SyntaxError 转换而来，不含道歉措辞），此时 MUST 清除高亮与统计，不产生匹配结果。

#### Scenario: 括号未闭合

- **WHEN** 用户输入 `(\d+`
- **THEN** 图案输入框下方显示说明「括号未闭合」语义的红色错误文案，编辑器无高亮，统计区无结果

### Requirement: 超长文本防护

系统 SHALL 在测试文本超过 100,000 字符时跳过匹配与高亮，并提示原因；正则执行 MUST 全程 try/catch 兜底，异常时给出错误提示而非白屏。

#### Scenario: 超长文本跳过

- **WHEN** 测试文本长度超过 100,000 字符
- **THEN** 界面提示文本过长已跳过匹配，高亮与统计不执行，页面保持响应

### Requirement: 常用正则模板

系统 SHALL 提供 6–8 个常用正则模板（至少含手机号、邮箱、URL、身份证号、IPv4），点击 MUST 将模板的图案与 flags 填入输入区（不改动测试文本）。

#### Scenario: 模板填入

- **WHEN** 用户点击「手机号」模板
- **THEN** 图案输入框填入手机号正则、flags 设为模板默认值，匹配立即按新正则重算

### Requirement: 暗色规范与工具专属色

工具页面 MUST 遵守暗色规范：颜色一律引用 theme.less 令牌，不新增硬编码色值；theme.less MUST 登记 `--tool-regex: #87df49`（草绿 95°，暗层）与 `--tool-regex-bg: rgb(135 223 73 / 12%)`；docs/design/ui-spec.md §2.4 工具专属色表格 MUST 同步登记一行；页面标题用 `--tool-regex`，交互元素仍用琥珀系令牌。

#### Scenario: 页面渲染

- **WHEN** 打开 `/tools/regex`
- **THEN** 页面为暗色底，标题为草绿 `--tool-regex`，匹配高亮为 12% 透明度草绿底，其余交互元素继承暗色令牌
