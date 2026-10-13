# Spec Delta

## Purpose

JSON 格式化工具：在浏览器本地对 JSON 文本进行校验、格式化、压缩与导出，并支持容错模式解析非严格 JSON（注释、尾逗号、单引号）。

## ADDED Requirements

### Requirement: 格式化与压缩

系统 SHALL 将输入 JSON 按可选缩进（2 空格 / 4 空格 / Tab）格式化输出，并 SHALL 提供压缩（去除空白）输出。

#### Scenario: 格式化有效 JSON

- **WHEN** 用户输入有效 JSON 并选择 2 空格缩进执行格式化
- **THEN** 输出区展示按 2 空格缩进美化后的 JSON

#### Scenario: 压缩 JSON

- **WHEN** 用户输入有效 JSON 并执行压缩
- **THEN** 输出区展示去除所有多余空白的单行 JSON

### Requirement: 语法校验与错误定位

系统 SHALL 校验输入是否为合法 JSON；校验失败时 MUST 给出错误原因及行列位置，并在编辑器行内标记错误。

#### Scenario: 输入非法 JSON

- **WHEN** 用户输入非法 JSON（如 `{"a":}`）
- **THEN** 系统展示错误原因与行列号，且编辑器在对应行内位置给出可见标记

### Requirement: 容错解析模式

系统 SHALL 提供可开关的容错模式；开启后 MUST 接受 JSON5 语法（注释、尾逗号、单引号、不加引号的 key），输出仍为严格 JSON。关闭时按严格 JSON 校验。

#### Scenario: 容错模式解析 JSON5

- **WHEN** 容错模式开启，用户输入 `{ // 注释
a: 1, }` 并执行格式化
- **THEN** 输出为严格 JSON `{ "a": 1 }` 的格式化结果

#### Scenario: 严格模式拒绝 JSON5

- **WHEN** 容错模式关闭，用户输入带尾逗号的 `{ "a": 1, }`
- **THEN** 系统报告语法错误并给出行列位置

### Requirement: 结果导出

系统 SHALL 支持将输出内容复制到剪贴板、下载为 `.json` 文件，并支持一键清空输入。

#### Scenario: 复制结果

- **WHEN** 用户点击复制按钮
- **THEN** 输出区内容进入剪贴板，且界面给出成功反馈

#### Scenario: 下载结果

- **WHEN** 用户点击下载按钮
- **THEN** 浏览器下载包含输出内容的 `.json` 文件

### Requirement: 纯本地处理

所有解析与转换 MUST 在浏览器本地完成，系统 MUST NOT 将用户输入发送至任何网络端点。

#### Scenario: 离线使用

- **WHEN** 用户断网后使用本工具的全部解析功能
- **THEN** 所有功能正常工作，无任何网络请求发出

### Requirement: 编辑器体验

输入与输出区 SHALL 提供语法高亮与行号；输出区 MUST 为只读。状态栏 SHALL 展示校验状态、字符/行数等基本信息。

#### Scenario: 查看输出

- **WHEN** 格式化成功后用户查看输出区
- **THEN** 输出内容带语法高亮与行号，且不可编辑
