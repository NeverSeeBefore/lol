import { ReactNode } from 'react';
import Base64UrlCodec from './Base64UrlCodec';
import ColorConverter from './ColorConverter';
import EasingVisualizer from './EasingVisualizer';
import JsonFormatter from './JsonFormatter';
import JwtParser from './JwtParser';
import RegexTester from './RegexTester';
import TimestampConverter from './TimestampConverter';
import YamlJsonConverter from './YamlJsonConverter';

export interface ToolItem {
  /** 导航显示名 */
  name: string;
  /** 子路由路径（相对 /tools） */
  path: string;
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
    element: <JsonFormatter />,
  },
  {
    name: '颜色转换',
    path: 'color',
    element: <ColorConverter />,
  },
  {
    name: '时间戳转换',
    path: 'timestamp',
    element: <TimestampConverter />,
  },
  {
    name: 'Base64/URL',
    path: 'codec',
    element: <Base64UrlCodec />,
  },
  {
    name: '正则测试',
    path: 'regex',
    element: <RegexTester />,
  },
  {
    name: 'JWT 解析',
    path: 'jwt',
    element: <JwtParser />,
  },
  {
    name: '缓动曲线',
    path: 'easing',
    element: <EasingVisualizer />,
  },
  {
    name: 'YAML/JSON',
    path: 'yaml',
    element: <YamlJsonConverter />,
  },
];
