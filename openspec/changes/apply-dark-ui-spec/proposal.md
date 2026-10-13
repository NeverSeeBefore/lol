# Proposal

## Why

项目已确立暗色 UI 设计规范（`docs/design/ui-spec.md`，经对抗评审修订），但目前仅是设计产物：令牌未被引入、antd 未配置暗色主题、现有组件仍用硬编码颜色（如 `#fa8c16`、`#1c1c1c`）。规范不落地等于没有规范——现在需要把"墨底 + 台灯"暗色体系真正应用到整个站点。

## What Changes

- `global.less` 引入 `src/static/styles/theme.less` 设计令牌，替换旧的 `--dark-*` / `--white-*` / `--page-*` 变量（旧变量保留一个版本周期做兼容别名），并启用 `color-scheme: dark` 与琥珀色 `::selection`
- 应用入口包 `ConfigProvider`：`darkAlgorithm` + 完整 token 映射（含 `colorTextLightSolid: '#1a1206'`、`controlOutlineWidth: 0`、钉死派生灰阶），组件级圆角分级（Button/Input 4、Modal 12）
- 现有组件迁移到新令牌：Nav、Main、Tools（含侧栏与 `.active`）、JsonFormatter、CodeEditor、Loading、ColorBoard、Counter、Test 各页及 NotFound 等视图
- 修复迁移盲点：`TweenDemo` 运行时 `getComputedStyle` 读 `--page-font-color` 改为读 `--text-primary`
- 落地规范裁决：路由级选中用工具专属色 12% 底、数据级选中用 `--accent-bg`；focus 统一 2px `--focus-ring` 描边；禁用态不亮于容器
- 迁移完成后以真实页面截图验收（含 antd 组件与自定义组件的灰阶一致性比对）

## Capabilities

### New Capabilities

- `ui-theme`: 站点级暗色主题能力——设计令牌（CSS 变量）与 antd 主题映射的双轨制，约束所有页面与组件的颜色、对比度、焦点、选中态与禁用态表现

### Modified Capabilities

（无现有 specs，不涉及）

## Impact

- **代码**：`src/static/styles/global.less`、`src/app.tsx`（或入口）、`src/components/*`、`src/views/**` 的 less/tsx
- **依赖**：无新增依赖（antd 6 已内置 darkAlgorithm）
- **兼容性**：旧 CSS 变量保留别名一个版本周期，**不 BREAKING**；`pnpm build` 与 `pnpm lint` 必须通过
- **文档**：`docs/design/ui-spec.md` 为事实来源，接入偏差需回写规范
