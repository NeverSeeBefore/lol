# Spec Delta

## Purpose

定义工具集二级导航能力：/tools 下以左侧竖向侧边栏承载工具菜单，落实设计规范（docs/design/ui-spec.md §5）中「路由级选中 → 工具专属色 12% 底」的裁决，并在窄屏下降级为顶部横向滚动条。

## ADDED Requirements

### Requirement: 竖向侧边栏布局

系统 SHALL 在 /tools 页面以左侧竖向侧边栏呈现工具菜单，宽度 200–240px，背景为 `--bg-raised`，与右侧内容区之间以 1px `--border` 发丝线分隔。工具内容区 MUST 位于侧边栏右侧并占满剩余宽度。菜单顺序 MUST 与 `tools.tsx` 数组一致。

#### Scenario: 打开 /tools

- **WHEN** 用户访问 /tools 下任意工具页
- **THEN** 左侧显示竖向工具菜单，右侧显示对应工具内容，菜单顺序与 tools 数组一致

### Requirement: 高对比菜单按钮三态

菜单按钮 SHALL 呈现三态：默认态文字为 `--text-secondary`；hover 态文字升为 `--text-primary` 且背景为 `--bg-hover`；选中态 MUST 使用该工具专属色——12% 透明度底（`color-mix(in srgb, <专属色> 12%, transparent)`）+ 专属色文字 + 左侧 3px 专属色指示条。任一时刻 MUST 仅有一个选中项。

#### Scenario: 路由级选中态

- **WHEN** 用户点击「正则测试」
- **THEN** 路由切换至 /tools/regex，该菜单项显示 `--tool-regex` 12% 底、草绿文字与左侧 3px 草绿指示条，其余项保持未选中态

#### Scenario: hover 未选中项

- **WHEN** 用户悬停在未选中的菜单项上
- **THEN** 文字变为 `--text-primary`，背景变为 `--bg-hover`，不出现任何工具专属色

### Requirement: 窄屏降级

视口宽度小于 768px 时，系统 SHALL 将侧边栏降级为顶部横向滚动条：菜单项横向排列、可横向滚动，选中项指示条由左侧 3px 改为底部 3px，分隔线由右边改为底边。

#### Scenario: 375px 视口

- **WHEN** 用户在 375px 宽视口打开 /tools/json
- **THEN** 工具菜单呈顶部横向滚动条，「JSON 格式化」项带底部指示条与专属色选中样式

### Requirement: 键盘可达与焦点可见

所有菜单项 MUST 可通过 Tab 键依次聚焦，聚焦时 MUST 显示全局统一焦点环（2px `--focus-ring` 描边 + 2px 偏移），横向滚动模式下焦点环 MUST NOT 被滚动容器裁切。

#### Scenario: Tab 导航

- **WHEN** 用户从页面顶部用 Tab 键移动焦点至工具菜单
- **THEN** 每个菜单项聚焦时显示完整可见的 2px 琥珀描边
