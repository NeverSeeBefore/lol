import { ReactNode } from 'react';
import Base64UrlCodec from './Base64UrlCodec';
import ColorConverter from './ColorConverter';
import CronParser from './CronParser';
import EasingVisualizer from './EasingVisualizer';
import JsonFormatter from './JsonFormatter';
import JwtParser from './JwtParser';
import MarkdownPreview from './MarkdownPreview';
import RegexTester from './RegexTester';
import SemanticDiff from './SemanticDiff';
import TimestampConverter from './TimestampConverter';
import YamlJsonConverter from './YamlJsonConverter';

export interface ToolItem {
  /** 导航显示名 */
  name: string;
  /** 子路由路径（相对 /tools） */
  path: string;
  /** 工具专属色令牌（theme.less 登记的 --tool-*），驱动导航选中态 */
  colorVar: string;
  element: ReactNode;
}

/**
 * 工具清单：新增工具时在此数组加一项即可，
 * 子导航（Tools/index.tsx）与路由（router/index.tsx）共用此配置。
 */
export const tools: ToolItem[] = [
  {
    name: 'JSON 格式化',
    path: 'json',
    colorVar: 'var(--tool-json)',
    element: <JsonFormatter />,
  },
  {
    name: '颜色转换',
    path: 'color',
    colorVar: 'var(--tool-color)',
    element: <ColorConverter />,
  },
  {
    name: '时间戳转换',
    path: 'timestamp',
    colorVar: 'var(--tool-time)',
    element: <TimestampConverter />,
  },
  {
    name: 'Base64/URL',
    path: 'codec',
    colorVar: 'var(--tool-base64)',
    element: <Base64UrlCodec />,
  },
  {
    name: '正则测试',
    path: 'regex',
    colorVar: 'var(--tool-regex)',
    element: <RegexTester />,
  },
  {
    name: 'JWT 解析',
    path: 'jwt',
    colorVar: 'var(--tool-jwt)',
    element: <JwtParser />,
  },
  {
    name: '缓动曲线',
    path: 'easing',
    colorVar: 'var(--tool-easing)',
    element: <EasingVisualizer />,
  },
  {
    name: 'YAML/JSON',
    path: 'yaml',
    colorVar: 'var(--tool-yaml)',
    element: <YamlJsonConverter />,
  },
  {
    name: 'Diff 对比',
    path: 'diff',
    colorVar: 'var(--tool-diff)',
    element: <SemanticDiff />,
  },
  {
    name: 'Markdown 预览',
    path: 'markdown',
    colorVar: 'var(--tool-markdown)',
    element: <MarkdownPreview />,
  },
  {
    name: 'Cron 解析',
    path: 'cron',
    colorVar: 'var(--tool-cron)',
    element: <CronParser />,
  },
];
