# Tasks

## 1. 全局样式接入

- [x] 1.1 `global.less` 顶部 `@import './theme.less'`
- [x] 1.2 旧变量改别名（`--dark-normal: var(--bg-base)` 等），保留一个版本周期
- [x] 1.3 加 `color-scheme: dark`、琥珀 `::selection`、全局 `:focus-visible` 焦点描边规则
- [x] 1.4 body 底色/文字色改用 `--bg-base` / `--text-primary`，清理 `.useless` 的 #ddd

## 2. antd 主题映射

- [x] 2.1 `index.tsx` 最外层挂 ConfigProvider，darkAlgorithm + 完整 token 映射（design D2）

## 3. 组件迁移

- [x] 3.1 `CodeEditor` 转暗：`--bg-raised` 底、`--text-primary` 字、`--border-control` 边
- [x] 3.2 `Tools`：`.active` 的 #fa8c16 → `var(--accent-text)`
- [x] 3.3 `JsonFormatter`：#888/#52c41a/#ff4d4f → `--text-tertiary`/`--success`/`--error`
- [x] 3.4 `Counter`：#000/#eee → 令牌（底 `--bg-overlay`、边 `--border-strong`、阴影去除或改 `--shadow-overlay`）
- [x] 3.5 `TweenDemo`：边框 #eee → `--border`；`index.tsx` 运行时改读 `--text-primary`
- [x] 3.6 `ColorBoard`：仅边框类硬编码（#fff 边框、棋盘格 #c5c5c5）令牌化；色相梯度功能色不动
- [x] 3.7 `Nav`：链接字号 20px → 15px 档，颜色令牌化（hover `--text-primary`、active `--accent-text`）

## 4. 验证

- [x] 4.1 `pnpm build` 通过
- [x] 4.2 `pnpm lint` 无新增 error
- [x] 4.3 `pnpm dev` 起服务，Playwright 逐页截图（home/tools/json/test/404），确认无浅色残留、antd 组件暗色正确
- [x] 4.4 发现的接入偏差回写 `docs/design/ui-spec.md` 或在代码修正

## Workflow follow-up

- 用户确认验收后运行 openspec archive 归档本变更
