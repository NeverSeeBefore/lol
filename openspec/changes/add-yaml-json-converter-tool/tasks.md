# Tasks

## 1. 令牌登记与转换纯函数

- [x] 1.1 theme.less 工具专属色区块追加 `--tool-yaml: #84ebaa; // YAML/JSON 转换 · 碧绿 142°（亮层）`
- [x] 1.2 docs/design/ui-spec.md §2.4 表格同步加行（保留他人新增行）
- [x] 1.3 `pnpm add yaml`（显式直接依赖）
- [x] 1.4 新建 `src/views/Tools/YamlJsonConverter/utils.ts`：`convertYamlToJson`（parseAllDocuments → toJSON → 2 空格 JSON；多文档合并数组 + docCount）、`convertJsonToYaml`（JSON.parse → yaml.stringify indent 2）
- [x] 1.5 错误格式化：YAML 错误从 linePos 提取行列 →「第 N 行：原因」（剥离代码片段回显）；JSON 错误「at position N」换算行列；循环引用兜底

## 2. 工具页面

- [x] 2.1 新建 `src/views/Tools/YamlJsonConverter/index.tsx` + `index.module.less`：Segmented 方向切换 + 双栏 CodeEditor（`key={mode}` 重挂载换语言）+ 复制/清空 + 状态栏
- [x] 2.2 输入即转换：output/error/docCount 由 useMemo 派生；空输入不报错、输出清空
- [x] 2.3 note 提示按方向切换：YAML→JSON 显示注释丢失与多文档合并提示；多文档时状态栏追加文档数
- [x] 2.4 暗色规范：标题 `--tool-yaml`，错误 `--error`，其余引用令牌，无硬编码色值

## 3. 注册与验证

- [x] 3.1 `tools.tsx` 注册 `{ name: 'YAML/JSON', path: 'yaml' }`
- [x] 3.2 `pnpm build` 通过
- [x] 3.3 `pnpm lint` 无 error、无新增 warning
- [x] 3.4 Playwright 实测：双向往返（对象/数组/嵌套/中文）、YAML 错误行号提示、注释丢失提示、多文档行为、其他工具页抽查回归 1 个
- [x] 3.5 截图 `/tmp/lolf-review/yaml.png`，kill dev server
- [x] 3.6 git 提交 `feat(tools): add yaml-json converter tool`（含 openspec change、package.json、pnpm-lock），提交前 git status 确认只 stage 自己的文件

## Workflow follow-up

- 用户确认验收后运行 openspec archive 归档本变更
