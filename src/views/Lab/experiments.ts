import { lazy } from 'react';
import type { ComponentType } from 'react';

const KaomojiPage = lazy(() => import('./KaomojiPage'));
const KaomojiLibraryPage = lazy(() => import('./KaomojiLibraryPage'));
const LoadingPage = lazy(() => import('./LoadingPage'));

export interface ExperimentItem {
  path: string;
  name: string;
  number: string;
  component: ComponentType;
}

/** 实验室侧栏与子路由共用的项目清单。 */
export const experiments: ExperimentItem[] = [
  {
    path: 'kaomoji',
    name: '颜文字发生器',
    number: '01',
    component: KaomojiPage,
  },
  {
    path: 'kaomoji-library',
    name: '颜文字图鉴',
    number: '02',
    component: KaomojiLibraryPage,
  },
  {
    path: 'loading',
    name: '轨道 Loading',
    number: '03',
    component: LoadingPage,
  },
];
