# Proposal

## Why

/tools 下的二级导航目前是顶部一排纯文本 NavLink（用 " | " 分隔），既不符合暗色规范（docs/design/ui-spec.md §5「路由级选中 → 工具专属色 12% 底」的裁决未落地），也随工具数量增长（已 9 个）变得拥挤难读。需要改为左侧竖向侧边栏导航，并落实工具专属色选中态。

## What Changes

- 重构 `src/views/Tools/` 布局：顶部横排文本导航改为左侧竖向侧边栏（宽 220px，`--bg-raised` 底 + 右侧 `--border` 发丝分隔线），右侧为工具内容区（Outlet）
- 菜单按钮高对比化：未选中 `--text-secondary`，hover 升 `--text-primary` + `--bg-hover` 底；选中项用该工具专属色——12% 透明度底 + 专属色文字 + 左侧 3px 指示条
- 每个菜单项前置该工具专属色小圆点（身份提示，未选中时降透明度）
- `tools.tsx` 数据数组复用，每项补充专属色令牌引用（`colorVar`），路由与导航继续共用同一份配置
- 窄屏（<768px）降级为顶部横向滚动条，指示条由左侧改为底部
- 键盘可达：NavLink 原生 `<a>` 可聚焦，沿用全局 `:focus-visible` 焦点环

## Capabilities

### New Capabilities

- `tools-nav`: 工具集二级导航能力——竖向侧边栏布局、工具专属色选中态、响应式降级与键盘可达性约束

### Modified Capabilities

（无现有 specs，不涉及）

## Impact

- **代码**：`src/views/Tools/index.tsx`、`src/views/Tools/index.module.less`、`src/views/Tools/tools.tsx`（仅加 `colorVar` 字段）
- **不动**：各工具内部实现（SemanticDiff/YamlJsonConverter/JwtParser 等）、路由配置 `src/router/index.tsx`（自动跟随 tools 数组）
- **依赖**：无新增依赖
- **验证**：`pnpm build` + `pnpm lint` 通过；Playwright 逐一点击 9 个工具验证路由与选中态、375px 降级、Tab 焦点可见
