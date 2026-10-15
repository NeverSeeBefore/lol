# Tasks

## 1. 数据与布局

- [x] 1.1 `tools.tsx`：`ToolItem` 增加 `colorVar` 字段，9 个工具逐项填 `var(--tool-*)`
- [x] 1.2 `Tools/index.tsx`：改为「侧边栏 nav + 内容 Outlet」结构，NavLink 用 className 回调 + 内联 `--item-accent`

## 2. 样式

- [x] 2.1 `index.module.less`：桌面竖向侧边栏（220px、`--bg-raised`、右发丝线）、菜单按钮三态（默认/hover/active）、3px 左指示条、专属色圆点
- [x] 2.2 <768px 降级：顶部横向滚动条、指示条改底部、分隔线改底边

## 3. 验证

- [x] 3.1 `pnpm build` 通过
- [x] 3.2 `pnpm lint` 0 error 无新增 warning
- [x] 3.3 Playwright 逐一点击 9 个工具：路由正确、选中态专属色正确
- [x] 3.4 375px 窄屏降级正确；Tab 键盘焦点环可见
- [x] 3.5 截图 `/tmp/lolf-review/tools-nav.png`（桌面）+ `tools-nav-mobile.png`（移动）
