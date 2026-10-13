# Spec Delta

## Purpose

定义 Base64/URL 编解码工具能力：以左右双栏编辑器为入口，提供 Unicode 安全的 Base64 编码/解码与 encodeURIComponent 语义的 URL 编码/解码四种模式，帮助前端开发在本地安全地处理含中文、emoji 的文本与 URL 参数，避免原生 `btoa`/`atob` 的非 Latin1 崩溃与在线工具的隐私风险。

## ADDED Requirements

### Requirement: 模式切换

系统 SHALL 提供四种模式——Base64 编码、Base64 解码、URL 编码、URL 解码——通过 Segmented 控件切换，切换后 MUST 清空输出与错误状态，输入保留。

#### Scenario: 切换模式

- **WHEN** 用户从「Base64 编码」切换到「URL 解码」
- **THEN** 输入区内容保留，输出区与错误提示清空，输入框 placeholder 与输出语义随模式更新

### Requirement: Unicode 安全的 Base64 编码

系统 SHALL 将任意 Unicode 文本（含中文、emoji、多字节字符）编码为 Base64：编码 MUST 经 UTF-8 字节序列转换（TextEncoder → 字节 → binary string → btoa），不得直接对字符串调用 btoa 导致 `InvalidCharacterError`。

#### Scenario: 编码中文

- **WHEN** 用户在 Base64 编码模式输入 `你好，世界`
- **THEN** 输出为标准 Base64 `5L2g5aW977yM5LiW55WM`，无任何报错

#### Scenario: 编码 emoji

- **WHEN** 用户输入含 emoji 的文本 `hi 👋`
- **THEN** 输出为合法 Base64，且复制后经本工具解码能还原原文

### Requirement: 容错的 Base64 解码

系统 SHALL 解码 Base64 文本为 UTF-8 字符串（atob → 字节 → TextDecoder），并 MUST 容忍：URL-safe 变体（`-` 映射回 `+`、`_` 映射回 `/`）、缺失的 padding（`=` 自动补齐）、输入中的空白字符（空格/换行忽略）。非法输入 MUST 给出说明原因的明确错误提示（不含道歉措辞），输出区不产生内容。

#### Scenario: 解码中文 Base64 往返

- **WHEN** 用户在 Base64 解码模式输入 `5L2g5aW977yM5LiW55WM`
- **THEN** 输出 `你好，世界`，与编码原文一致

#### Scenario: URL-safe 变体与缺失 padding

- **WHEN** 用户输入含 `-`/`_` 且无 `=` 结尾的 URL-safe Base64（如 `aGk-8J-Liw` 形式的字符串）
- **THEN** 正常解码出原文，不报 padding 错误

#### Scenario: 非法 Base64

- **WHEN** 用户输入含非法字符或字节序列无法构成合法 UTF-8 的文本
- **THEN** 界面给出明确错误（说明「不是合法 Base64」或「字节序列不是合法 UTF-8」），输出区为空

### Requirement: URL 编码与解码

系统 SHALL 以 `encodeURIComponent` 语义编码 URL 组件（保留未保留字符，空格编码为 `%20`），以 `decodeURIComponent` 语义解码；解码时 MUST 先把 `+` 还原为空格以兼容 application/x-www-form-urlencoded 约定。界面 MUST 提供说明文案写清 `+` 与 `%20` 的差异。

#### Scenario: 编码中文参数

- **WHEN** 用户在 URL 编码模式输入 `关键词=搜索 词`
- **THEN** 输出 `%E5%85%B3%E9%94%AE%E8%AF%8D%3D%E6%90%9C%E7%B4%A2%20%E8%AF%8D`（空格为 `%20`，`=` 被编码）

#### Scenario: 解码含加号的 form 编码

- **WHEN** 用户在 URL 解码模式输入 `q=%E4%BD%A0%E5%A5%BD+%E4%B8%96%E7%95%8C`
- **THEN** 输出 `q=你好 世界`（`+` 还原为空格）

#### Scenario: 非法百分号序列

- **WHEN** 用户输入 `%zz` 或残缺的 `%E4%BD`
- **THEN** 界面给出明确错误（说明百分号序列非法或字节序列不是合法 UTF-8），输出区为空

### Requirement: 复制与统计

系统 SHALL 提供一键复制输出按钮（clipboard + 成功反馈），并在状态栏显示输入与输出的 UTF-8 字节数与字符数。

#### Scenario: 复制输出

- **WHEN** 输出区有内容时用户点击复制按钮
- **THEN** 输出文本写入剪贴板，界面提示已复制

#### Scenario: 状态栏统计

- **WHEN** 用户输入中文文本并获得输出
- **THEN** 状态栏分别显示输入与输出的字节数（UTF-8）与字符数，中文按字节数 ≠ 字符数正确区分

### Requirement: 暗色规范与工具专属色

工具页面 MUST 遵守暗色规范：颜色一律引用 theme.less 令牌，不新增硬编码色值；theme.less 工具专属色区块 MUST 登记 `--tool-base64: #49df5d`（松绿 128°，暗层）；页面标题与内容级选中态使用 `--tool-base64`，按钮、focus 等交互元素仍用琥珀系令牌。

#### Scenario: 页面渲染

- **WHEN** 打开 `/tools/codec`
- **THEN** 页面为暗色底，标题为松绿 `--tool-base64`，Segmented 选中态与交互元素继承暗色令牌，无新增硬编码色值
