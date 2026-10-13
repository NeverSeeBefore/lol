# Proposal

## Why

工具集目前只有 JSON 格式化一个工具。项目已有现成资产——HSV 取色板组件 `ColorBoard` 与 15 个颜色转换纯函数 `Utils/colorConvert`——但只散落在 Test 页做演示，没有形成可用工具。颜色格式互转（HEX/RGB/HSL/HSV）是前端日常高频需求，值得升格为正式工具；同时本工具以「相对站点底色 #131417 的 WCAG 对比度实时提示」作为差异化点，与暗色规范主题呼应。

## What Changes

- `ColorBoard` 补对外接口：新增可选 `defaultValue`（HEX，仅挂载时读取，外部改色经 key 重挂载驱动）/`onChange` props，不传时维持现有自治行为（向后兼容，Test 页不受影响）
- 新增工具页 `src/views/Tools/ColorConverter/`：取色板选色 + HEX/RGB/HSL/HSV 四格式互转显示 + 任一格式手动输入反向解析回填写色板 + 各格式一键复制 + 相对 `--bg-base`（#131417）的 WCAG 对比度实时计算与 AA/AAA 判定展示
- 工具内写一层适配模块（解析/格式化），封装 `Utils/colorConvert` 接口风格不统一（数组/字符串混杂）、无 alpha 的问题，**不改动公共 utils 的签名**
- `src/views/Tools/tools.tsx` 注册新工具（路径 `color`，路由与子导航自动生效）
- 页面标题/选中态使用工具专属色 `--tool-color`（#A78BFA 紫，已登记于 theme.less）；交互元素仍用琥珀系令牌

## Capabilities

### New Capabilities

- `color-convert`: 颜色转换工具能力——取色板选色、HEX/RGB/HSL/HSV 四格式双向互转、一键复制、以及相对站点暗色底色的 WCAG 对比度（AA/AAA）实时评估

### Modified Capabilities

（无现有 specs，不涉及）

## Impact

- **代码**：`src/components/ColorBoard/`（index.tsx、useThumb.tsx，向后兼容扩展）、新增 `src/views/Tools/ColorConverter/`、`src/views/Tools/tools.tsx`
- **依赖**：无新增依赖（转换复用 `Utils/colorConvert`，对比度公式自实现）
- **兼容性**：ColorBoard 改动向后兼容，Test 页 `ColorTransform` 行为不变；`pnpm build` 与 `pnpm lint` 必须通过
- **规范**：遵守 docs/design/ui-spec.md，颜色一律用 theme.less 令牌，不新增硬编码色值
