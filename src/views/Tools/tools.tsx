import { ReactNode } from 'react';
import ColorConverter from './ColorConverter';
import JsonFormatter from './JsonFormatter';
import TimestampConverter from './TimestampConverter';

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
];
