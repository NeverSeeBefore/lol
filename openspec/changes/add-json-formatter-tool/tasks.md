# Tasks

## 1. 工具分区骨架

- [x] 1.1 新建 `src/views/Tools/index.tsx`：复用 `/test` 的"子导航 + `<Outlet/>`"模式，工具列表抽成数组配置（name/path），子导航激活态高亮；验证：`pnpm dev` 手动访问 `/tools` 渲染布局
- [x] 1.2 `src/router/index.tsx` 注册 `/tools` 分支：index 重定向到 `/tools/json`，子路由占位，分区外路径仍走 404；验证：访问 `/tools` 自动跳 `/tools/json`，`/tools/not-exist` 进 404
- [x] 1.3 `src/components/Nav/index.tsx` 增加 tools 入口；验证：点击主导航 tools 进入 `/tools/json`

## 2. CodeMirror 封装

- [x] 2.1 安装依赖 `@codemirror/view @codemirror/state @codemirror/language @codemirror/lint @codemirror/lang-json json5` 及对应 `@types/`（如需要）；验证：`pnpm install` 成功，`pnpm peers check` 无新增问题
- [x] 2.2 新建 `src/components/CodeEditor/index.tsx`：受控封装（value/onChange/readOnly），useEffect 管理 EditorView 生命周期，支持外部传入 lint 函数；验证：在任意页面临时挂载可输入、高亮、显示行号

## 3. JSON 解析核心

- [x] 3.1 新建 `src/utils/jsonFormat.ts`：`parse/format/minify` 纯函数，容错模式走 `JSON5.parse`，统一返回 `{ ok, result?, error?: { message, line?, column? } }`；验证：`pnpm exec tsc --noEmit` 通过，关键分支有函数级自测（可在 dev 页面临时调用验证输出）
- [x] 3.2 错误位置转换：从异常提取行列号（json5 直接用 lineNumber/columnNumber；JSON.parse 解析 message 中的 position，解析失败降级为无位置），产出 CM lint Diagnostic；验证：输入 `{"a":}` 时 Diagnostic 行列正确

## 4. JsonFormatter 页面

- [x] 4.1 新建 `src/views/Tools/JsonFormatter/`：左右分栏布局（输入编辑器 / 只读输出编辑器）+ 顶部操作条（格式化、压缩、缩进 Select 2/4/Tab、容错 Switch 默认关）+ 底部状态栏（校验状态、大小、行数）；验证：界面按 design D5 渲染
- [x] 4.2 接管线：输入 → 解析（3.1）→ 成功写输出区 / 失败经 3.2 转为行内 lint 标记 + 状态栏错误文案；验证：spec 中"格式化/校验/容错"全部 scenario 手动通过
- [x] 4.3 导出能力：复制（antd message 反馈）、下载 `.json`、清空输入；验证：三个操作行为符合 spec scenario

## 5. 收尾验证

- [x] 5.1 `pnpm lint` 0 error、`pnpm build` 通过；验证：两条命令退出码为 0
- [x] 5.2 断网（DevTools offline）下全功能手动回归，确认无网络请求；验证：Network 面板无业务请求，功能正常

## Workflow follow-up

- 完成后走 `/opsx:archive` 归档，spec 合入 `openspec/specs/`
