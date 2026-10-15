import { useMemo, useRef, useState } from 'react';
import { App, Button, Space, Tooltip } from 'antd';
import { ClearOutlined, CopyOutlined, DownloadOutlined } from '@ant-design/icons';
import type { EditorView } from '@codemirror/view';
import CodeEditor from 'Components/CodeEditor';
import { downloadMarkdown, insertSnippet, renderMarkdown, SNIPPETS, statsOf } from './utils';
import styles from './index.module.less';

const DEFAULT_DOC = `# Markdown 预览

左侧输入 **Markdown**，右侧*实时*渲染。~~支持 GFM 删除线~~。

## 列表示例

- 无序列表项一
- 无序列表项二
  - 嵌套子项

1. 有序列表项一
2. 有序列表项二

## 表格

| 名称 | 类型 | 说明 |
| --- | --- | --- |
| 表格 | GFM | 支持对齐 |
| 删除线 | GFM | ~~已废弃~~ |

## 代码

行内代码 \`const a = 1\`，代码块：

\`\`\`js
function hello() {
  console.log('你好，世界');
}
\`\`\`

## 引用与链接

> 工欲善其事，必先利其器。

访问 [Anthropic 官网](https://www.anthropic.com) 了解更多。

---

图片：![占位图](https://placehold.co/320x120?text=markdown)
`;

function MarkdownPreviewInner() {
  const { message } = App.useApp();
  const [source, setSource] = useState(DEFAULT_DOC);
  const editorRef = useRef<EditorView | null>(null);

  // 输入即渲染：marked 解析 + DOMPurify 消毒（唯一注入入口）
  const html = useMemo(() => renderMarkdown(source), [source]);
  const stats = statsOf(source);

  const copyHtml = async () => {
    try {
      await navigator.clipboard.writeText(html);
      message.success('已复制消毒后的 HTML');
    } catch {
      message.error('复制失败：剪贴板不可用');
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.title}>Markdown 预览</div>

      <Space className={styles.toolbar} wrap>
        {SNIPPETS.map((s) => (
          <Button
            key={s.label}
            size="small"
            onClick={() => {
              const view = editorRef.current;
              if (view) insertSnippet(view, s);
            }}
          >
            {s.label}
          </Button>
        ))}
        <Button size="small" icon={<CopyOutlined />} onClick={copyHtml}>
          复制 HTML
        </Button>
        <Button size="small" icon={<DownloadOutlined />} onClick={() => downloadMarkdown(source)}>
          下载 .md
        </Button>
        <Button
          size="small"
          danger
          icon={<ClearOutlined />}
          onClick={() => {
            setSource('');
            editorRef.current?.focus();
          }}
        >
          清空
        </Button>
        <Tooltip title="所有渲染输出经 DOMPurify 默认白名单消毒，复制 HTML 亦为消毒后版本">
          <span className={styles.note}>输出已消毒（DOMPurify）</span>
        </Tooltip>
      </Space>

      <div className={styles.panes}>
        <div className={styles.pane}>
          <div className={styles['pane-title']}>编辑</div>
          <div className={styles['pane-editor']}>
            <CodeEditor
              language="text"
              value={source}
              onChange={setSource}
              placeholder="在此输入 Markdown…"
              editorRef={editorRef}
            />
          </div>
        </div>
        <div className={styles.pane}>
          <div className={styles['pane-title']}>预览</div>
          <div className={styles['pane-preview']}>
            {html ? (
              <div className={styles.preview} dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <div className={styles.empty}>在左侧输入 Markdown，渲染结果将显示在这里</div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.statusbar}>
        <span>{stats.chars} 字符</span>
        {' | '}
        <span>{stats.lines} 行</span>
      </div>
    </div>
  );
}

export default function MarkdownPreview() {
  return (
    <App>
      <MarkdownPreviewInner />
    </App>
  );
}
