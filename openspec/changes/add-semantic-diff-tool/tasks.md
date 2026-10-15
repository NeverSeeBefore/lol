# Tasks

## 1. 令牌登记与依赖

- [x] 1.1 theme.less 工具专属色区块追加 `--tool-diff: #84ebd0; // Diff 对比 · 青碧 164°（亮层）`
- [x] 1.2 docs/design/ui-spec.md §2.4 表格同步加行（保留他人新增行）
- [x] 1.3 `pnpm add diff`（显式直接依赖；diff@9 自带类型，无需 @types/diff）

## 2. 对比纯函数（utils.ts）

- [x] 2.1 `computeTextDiff(oldText, newText)`：diffLines（timeout 1000 兜底）→ 展开行数组 → 相邻删+增块按行配对为 mod → 返回行序列与统计（+N/-N/M）
- [x] 2.2 `computeJsonDiff(oldText, newText)`：双侧 JSON.parse（错误带左/右侧 + 行列换算）→ 键序无关递归比对 → 路径化变更列表（新增/删除/修改 + typeChanged 标注）→ 值摘要折叠 + 条数截断 → 统计
- [x] 2.3 阈值常量与判定：实时阈值（2000 行 / 200K 字符）、硬上限（30K 行 / 3MB）、渲染截断（5000 行）、JSON 变更截断（2000 条）

## 3. 工具页面

- [x] 3.1 新建 `src/views/Tools/SemanticDiff/index.tsx` + `index.module.less`：Segmented 模式切换 + 双栏 CodeEditor（左旧右新，`key={mode}` 重挂载换语言）+ 对比按钮（手动模式）+ 交换左右 + 清空 + Diff 结果视图 + 状态栏统计
- [x] 3.2 文本结果渲染：行号 + +/-//~ 标记 + 新增绿/删除红/修改琥珀（语义令牌），超 5000 行截断提示
- [x] 3.3 JSON 结果渲染：变更列表（badge + 路径 + old → new + 类型变化标注），非法 JSON 报错指明左/右侧与行列
- [x] 3.4 性能降级：超实时阈值停实时计算显示「对比」按钮；超硬上限拒绝并提示；diff 超时按整体替换展示并提示
- [x] 3.5 暗色规范：标题 `--tool-diff`，增删改用 --success/--error/--accent-text 系，无硬编码色值

## 4. 注册与验证

- [x] 4.1 `tools.tsx` 注册 `{ name: 'Diff 对比', path: 'diff' }`
- [x] 4.2 `pnpm build` 通过
- [x] 4.3 `pnpm lint` 无 error、无新增 warning
- [x] 4.4 Playwright 实测：行 diff（增/删/改/混合）、JSON 键序无关、类型变化、嵌套路径、非法 JSON 报错、空输入、1 万行性能计时、其他工具页抽查回归 1 个
- [x] 4.5 截图 `/tmp/lolf-review/diff.png`，kill dev server
- [x] 4.6 git 提交 `feat(tools): add semantic diff tool`（含 openspec change、package.json、pnpm-lock），提交前 git status 确认只 stage 自己的文件

## Workflow follow-up

- 用户确认验收后运行 openspec archive 归档本变更
