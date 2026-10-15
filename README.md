# lol-f

个人前端项目：博客 + 前端工具集（JSON 格式化、格式转换器等，持续添加中）。

## 实验室

`/lab/kaomoji` 展示颜文字滚轮，`/lab/kaomoji-library` 可按心情浏览并复制精选颜文字，`/lab/loading` 展示从 Test 页复用的 Canvas Loading。`/lab` 会重定向到第一个作品。实验室菜单由 `src/views/Lab/experiments.ts` 统一配置。颜文字动画封装在 `src/components/KaomojiSlot`，精选颜文字与组合零件库在同目录的 `library.ts`。

```tsx
import KaomojiSlot from 'Components/KaomojiSlot';

// 作为 loading 动画使用；加载结束时卸载组件即可自动清理计时器
{
  loading && <KaomojiSlot size="small" intervalMs={2400} />;
}
```

Canvas Loading 同样可直接使用 `<Loading />`。动画按实际经过时间计算进度，卸载组件时会取消动画帧。

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
