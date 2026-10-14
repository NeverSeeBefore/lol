# Spec Delta

## Purpose

定义 JWT 本地解析工具能力：以单个编辑器为入口，粘贴 JWT 即拆解 Header / Payload / Signature 三段并结构化展示，对 Payload 中的时间戳声明（exp/iat/nbf）做可读化与过期状态判定。全程在浏览器本地完成（split('.') + base64url 解码 + JSON.parse），token 不发出任何网络请求，且明确不做签名校验。

## ADDED Requirements

### Requirement: 三段拆解与展示

系统 SHALL 将输入按 `.` 拆分为 Header、Payload、Signature 三段。Header 与 Payload MUST 经 base64url 解码（`-`→`+`、`_`→`/`、自动补 padding）后按 JSON 解析并以缩进格式化展示（只读 CodeEditor，`language="json"`）；Signature MUST 以原始 base64url 文本展示，并 MUST 在界面上明确标注「不验证签名」。

#### Scenario: 解析合法 JWT

- **WHEN** 用户粘贴三段结构的合法 JWT
- **THEN** Header 与 Payload 各显示为格式化 JSON，Signature 显示原始 base64url 字符串及「不验证签名」标注

#### Scenario: 输入为空

- **WHEN** 输入区为空
- **THEN** 三段展示区域清空，不显示任何错误

### Requirement: 时间戳声明智能展示

系统 SHALL 检测 Payload 中的 `exp`、`iat`、`nbf` 数值声明，将每个存在的声明转为可读时间（本地时区 + UTC 两种表达）。对 `exp` 系统 MUST 额外判定过期状态：已过有效期时以错误色（`--error`）显示「已过期」及已过时长，未过期时以成功色（`--success`）显示剩余时间。

#### Scenario: 未过期 token

- **WHEN** Payload 中 `exp` 晚于当前时间
- **THEN** 显示 `exp` 的本地与 UTC 时间，并以成功色标注剩余有效期

#### Scenario: 已过期 token

- **WHEN** Payload 中 `exp` 早于当前时间
- **THEN** 显示 `exp` 的本地与 UTC 时间，并以错误色标注「已过期」及已过时长

#### Scenario: 无时间戳声明

- **WHEN** Payload 中不存在 exp/iat/nbf
- **THEN** 时间戳区块不显示或显示为空态提示，不影响 Header/Signature 展示

### Requirement: 分类错误提示

系统 MUST 对三类非法输入给出各自说明原因的明确错误提示（不道歉）：段数不等于 3、某段不是合法 base64url、Header 或 Payload 解码后不是合法 JSON。错误时对应展示区域不产生内容，其余已可解析的段落不受牵连的解析规则如下：段数错误时三段均不解析；单段 base64url/JSON 错误时只标记该段。

#### Scenario: 段数错误

- **WHEN** 用户输入只含 1 个或 4 个 `.` 分段
- **THEN** 显示「JWT 应由 3 段组成」类提示，指出实际段数

#### Scenario: base64url 非法

- **WHEN** Header 段含 base64url 非法字符或无法解码
- **THEN** Header 区域显示「不是合法 base64url」类提示，Payload/Signature 展示不受影响

#### Scenario: JSON 非法

- **WHEN** Payload 段 base64url 合法但解码结果不是合法 JSON
- **THEN** Payload 区域显示「不是合法 JSON」类提示，Header/Signature 展示不受影响

### Requirement: 隐私提示

系统 MUST 在页面顶部展示 info 语义提示条，说明「纯本地解析，token 不会离开浏览器」。解析过程 MUST NOT 发起任何携带 token 的网络请求。

#### Scenario: 页面加载

- **WHEN** 用户打开 JWT 解析工具页
- **THEN** 可见 info 色提示条，文案包含「纯本地解析，token 不会离开浏览器」

### Requirement: 一键复制

系统 SHALL 为 Header（格式化 JSON）、Payload（格式化 JSON）、Signature（原始字符串）各提供复制按钮，复制成功 MUST 给出反馈；解析失败或为空时对应按钮不可复制。

#### Scenario: 复制 Payload

- **WHEN** 解析成功后用户点击 Payload 复制按钮
- **THEN** 剪贴板写入格式化后的 Payload JSON，界面提示「已复制」
