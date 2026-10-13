# lol-f

个人前端项目：博客 + 前端工具集（JSON 格式化、格式转换器等，持续添加中）。

## 技术栈

- Vite 8 + React 19 + TypeScript 5
- antd 6 + @ant-design/icons
- react-router 7 + Redux Toolkit 2 + react-redux 9
- less（CSS Modules）

## 常用命令

```bash
pnpm install     # 安装依赖
pnpm dev         # 启动开发服务器
pnpm build       # 类型检查 + 生产构建
pnpm preview     # 预览构建产物
pnpm lint        # eslint + stylelint
pnpm changelog   # 生成 CHANGELOG
```

## 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)，由 husky + commitlint 强制校验：

- `feat` 新功能 / `fix` 修复 bug / `docs` 文档 / `style` 代码格式
- `refactor` 重构 / `perf` 性能优化 / `test` 测试 / `build` 构建工具
- `ci` 持续集成 / `chore` 辅助工具变动 / `revert` 撤销 / `anno` 注释

提交前 lint-staged 会自动执行 eslint、stylelint 和 prettier。
