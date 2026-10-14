# Spec Delta

## Purpose

定义 YAML ↔ JSON 双向转换工具能力：双栏编辑器，方向切换（YAML → JSON / JSON → YAML），输入即转换。YAML 侧基于 `yaml` 库解析，错误含行列号时给出「第 N 行」式定位提示；多文档合并为 JSON 数组；锚点/别名自动展开；YAML → JSON 方向明确提示注释会丢失。全程浏览器本地完成，无网络请求。

## ADDED Requirements

### Requirement: 双向转换与方向切换

系统 SHALL 提供 YAML → JSON 与 JSON → YAML 两个转换方向，以 Segmented 控件切换。输入变更或方向切换时系统 MUST 立即重新转换（派生计算，无需点击按钮）。JSON 输出 MUST 为 2 空格缩进的格式化 JSON；YAML 输出 MUST 为 2 空格缩进的 YAML。

#### Scenario: YAML 转 JSON

- **WHEN** 方向为 YAML → JSON 且输入合法 YAML（对象/数组/嵌套/中文）
- **THEN** 输出区显示对应的 2 空格缩进 JSON，中文不转义为 \u 序列

#### Scenario: JSON 转 YAML

- **WHEN** 方向为 JSON → YAML 且输入合法 JSON
- **THEN** 输出区显示对应的 2 空格缩进 YAML

#### Scenario: 往返一致

- **WHEN** 用户将 YAML 转为 JSON 后，把结果切到 JSON → YAML 再转回
- **THEN** 数据内容（键值、嵌套结构、数组顺序）与原 YAML 解析结果等价

#### Scenario: 输入为空

- **WHEN** 输入区为空
- **THEN** 输出区清空，不显示任何错误

### Requirement: YAML 解析错误定位

系统 MUST 在 YAML 解析失败时，从解析错误的行列信息中提取位置，给出形如「第 N 行：原因」的友好错误提示；无行列信息时至少给出错误原因。提示 MUST NOT 重复回显库报错中内嵌的输入代码片段。JSON 解析失败时系统 MUST 给出错误提示，错误消息含字符位置时 SHOULD 换算为行列号。

#### Scenario: YAML 语法错误

- **WHEN** 输入第 3 行存在非法缩进或不闭合的 flow 序列
- **THEN** 状态栏/错误区显示「第 3 行：…」开头的提示，且提示中不含输入原文回显

#### Scenario: JSON 语法错误

- **WHEN** 方向为 JSON → YAML 且输入非法 JSON
- **THEN** 显示说明原因的错误提示

### Requirement: YAML 特性边界

系统 MUST 按以下规则处理 YAML 特性：

- **多文档**（`---` 分隔）：单文档时输出其对应 JSON；多文档时 MUST 将所有文档合并为一个 JSON 数组输出，并在界面提示实际文档数
- **锚点/别名**（`&ref` / `*ref`）：解析时 MUST 自动展开为内联值
- **注释**：YAML → JSON 方向时系统 MUST 在界面常驻提示「注释不会保留」；JSON → YAML 方向不显示该提示
- **null 写法**：`~`、`null`、`Null`、空值 MUST 统一解析为 JSON null
- **日期类标量**：保持字符串原样（不实例化为 Date），保证往返安全

#### Scenario: 多文档输入

- **WHEN** 输入含 2 个 `---` 分隔的 YAML 文档
- **THEN** 输出为含 2 个元素的 JSON 数组，界面提示文档数为 2

#### Scenario: 锚点展开

- **WHEN** 输入含 `a: &x 1` 与 `b: *x`
- **THEN** 输出 JSON 中 a 与 b 均为内联值 1

#### Scenario: 注释丢失提示

- **WHEN** 方向为 YAML → JSON
- **THEN** 工具栏常驻显示「注释不会保留」类提示；含注释的输入转换后输出不含注释

### Requirement: 一键复制与状态统计

系统 SHALL 提供输出一键复制按钮，复制成功 MUST 给出反馈，输出为空时点击 MUST 提示「输出区为空」。系统 SHALL 在状态栏显示输入与输出的字符数/字节数统计。

#### Scenario: 复制输出

- **WHEN** 转换成功后用户点击复制
- **THEN** 剪贴板写入输出内容，界面提示「已复制」

#### Scenario: 状态栏统计

- **WHEN** 输入或输出内容变化
- **THEN** 状态栏同步显示输入与输出的字符数与 UTF-8 字节数
