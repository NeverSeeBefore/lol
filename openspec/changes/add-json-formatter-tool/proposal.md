# Proposal

## Why

lol-f 定位为"博客 + 前端工具集"，但目前还没有一个正式的工具页面（仅有的 color-transform 雏形混在 `/test` demo 区里）。JSON 格式化是开发中最高频的在线工具需求之一，作为工具集的第一个正式成员，可以一并把"工具分区"的骨架（路由、子导航、编辑器基础设施）立起来，后续工具直接复用。

## What Changes

- 新建 `/tools` 路由分区，自带子导航（复用 `/test` 的 `TestNav + Outlet` 模式），JSON 格式化作为第一个工具挂载在 `/tools/json`
- 实现 JSON 工具核心功能（MVP）：
  - 格式化（缩进可选：2 / 4 / Tab）
  - 压缩（minify）
  - 校验 + 错误定位（行列号 + 行内标记 + 原因说明）
  - 复制 / 清空 / 下载
  - 容错解析模式（JSON5：注释、尾逗号、单引号），可开关
- 引入 CodeMirror 6 作为编辑器基础设施（高亮、行号、lint 行内错误标记），供后续工具复用
- 顶部主导航增加 `tools` 入口

## Capabilities

### New Capabilities

- `json-tool`: JSON 格式化工具的全部行为——解析校验（含 JSON5 容错模式）、格式化/压缩输出、错误定位展示、结果导出（复制/下载）
- `tools-navigation`: 工具分区的导航结构——`/tools` 路由、工具子导航、工具页布局骨架

### Modified Capabilities

（无——项目尚无任何已固化的 spec）

## Impact

- **新增依赖**：`@codemirror/view`、`@codemirror/state`、`@codemirror/language`、`@codemirror/lint`、`codemirror`（或 @codemirror/basic-setup 等价聚合包）、`json5`
- **路由**：`src/router/index.tsx` 新增 `/tools` 分支
- **导航**：`src/components/Nav` 增加 tools 入口
- **新目录**：`src/views/Tools/`（分区布局 + JsonFormatter 子页）；编辑器封装放 `src/components/CodeEditor/`
- **纯前端**：所有解析在浏览器内完成，无网络请求，数据不出本地
