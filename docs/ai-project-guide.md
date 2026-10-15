# AI 辅助开发指南

本文件是 Claude Code 与 Codex 共用的项目说明。帮助 AI 快速识别、分析并正确修改本项目。

## 项目定位

**lol-f**（个人前端项目）：博客 + 前端工具集（JSON 格式化、格式转换器等，持续添加）。博客只是其中一部分，工具页会陆续增加。

## 技术栈

| 领域   | 选型                                                                                          |
| ------ | --------------------------------------------------------------------------------------------- |
| 构建   | Vite 8（`vite.config.ts`）                                                                    |
| 框架   | React 19 + TypeScript 5.9（`jsx: react-jsx`，**无需 import React**）                          |
| UI     | antd 6 + @ant-design/icons（**不要引用 `antd/dist/reset.css`，v6 已内置 reset**）             |
| 路由   | react-router-dom 7（`useRoutes` + `RouteObject`，配置在 `src/router/index.tsx`）              |
| 状态   | Redux Toolkit 2 + react-redux 9（`configureStore`，见 `src/store/`）                          |
| 样式   | less + CSS Modules（仅 `*.module.less` 启用模块，全局样式在 `src/static/styles/global.less`） |
| 包管理 | **pnpm**（registry 用 npmmirror，勿混用 npm/yarn 安装）                                       |

## 常用命令

```bash
pnpm dev       # 开发服务器（/api 代理到 localhost:12306）
pnpm build     # tsc --noEmit + vite build（提交前必跑）
pnpm lint      # eslint + stylelint（允许 warning，不允许 error）
pnpm changelog # 生成 CHANGELOG（conventional commits）
```

## 目录结构与路径别名

```
src/
  app.tsx            # 根组件，useRoutes 挂载路由
  index.tsx          # 入口，挂载 #root（在 index.html 中）
  router/            # 路由配置
  views/             # 页面（Home/About/Site/Login/Test/NotFound）
  components/        # 公共组件（Main 布局、Nav、Loading、Counter、ColorBoard）
  store/             # Redux：index.ts + feature/*Slice.ts
  hooks/  utils/     # 自定义 hooks / 工具函数（colorConvert、math、tween）
  static/styles/     # 全局样式
```

tsconfig paths 与 vite alias 一一对应，新增别名必须**两处同改**：

```ts
import X from 'Src/...'; // src/
import X from 'Components/...'; // src/components/
import X from 'Utils/...'; // src/utils/
import X from 'Static/...'; // src/static/
```

## 代码约定

- **组件**：目录式组织（`ComponentName/index.tsx` + `index.module.less`），样式用 `import styles from './index.module.less'`
- **路由**：新页面在 `src/router/index.tsx` 的 `routeConfig` 中登记；需要布局的页面包一层 `<Main>`
- **Redux**：新状态在 `src/store/feature/` 建 slice，并注册到 `src/store/index.ts`
- **导入扩展名**：导入 ts/tsx 模块不写扩展名
- **样式**：单引号、属性按字母序（stylelint `order/properties-alphabetical-order`，保存时 `--fix` 可自动整理）

## Lint 体系（ESLint 9 flat config）

- `eslint.config.js`：js/ts/react/jsx-a11y/import 推荐集 + `eslint-config-prettier` 收尾
- **有意关闭**：`import/named`、`import/no-unresolved`（对 ESM 包误报，交给 TS/Vite 校验）、`no-empty-object-type`、jsx-a11y 三条交互规则
- **react-hooks 只用经典两条**（rules-of-hooks / exhaustive-deps）：v7 的 React Compiler 规则集对存量代码噪音大，未启用
- stylelint 17：`stylelint-config-standard` + `postcss-less` 解析 less

## 版本锁定（不要随手升级）

- `typescript` 锁 **~5.9**：typescript-eslint 尚不支持 TS 7（原生移植版）
- `eslint` 锁 **^9**：eslint-plugin-import/react 未声明支持 ESLint 10

## Git 规范

- commit 信息遵循 Conventional Commits（commitlint 强制），允许的 type：`build/ci/chore/docs/feat/fix/perf/refactor/revert/style/test/anno`
- **commit 正文用中文书写**（type/scope 保持英文，如 `feat: 新增 JSON 格式化工具`）
- pre-commit 由 husky 9 + lint-staged 跑 eslint/stylelint/prettier

## 环境备注

- Node 20.19+；pnpm 为 npm 全局安装（corepack 走官方源在本机网络下不可用，故 package.json 未声明 `packageManager` 字段）
- 存量代码有 ~30 个 lint warning（未使用的 React import / props / 死赋值），属历史遗留，清理时顺手做即可，不算回归
