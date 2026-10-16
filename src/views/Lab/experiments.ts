import { lazy } from 'react';
import type { ComponentType } from 'react';

const KaomojiPage = lazy(() => import('./KaomojiPage'));
const KaomojiLibraryPage = lazy(() => import('./KaomojiLibraryPage'));
const LoadingPage = lazy(() => import('./LoadingPage'));
const PixelStudioPage = lazy(() => import('./PixelStudioPage'));
const CellularLabPage = lazy(() => import('./CellularLabPage'));
const PixelWallPage = lazy(() => import('./PixelWallPage'));

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
  {
    path: 'pixel-studio',
    name: '像素工坊',
    number: '04',
    component: PixelStudioPage,
  },
  {
    path: 'cellular',
    name: '生命沙盘',
    number: '05',
    component: CellularLabPage,
  },
  {
    path: 'pixel-wall',
    name: '像素背景墙',
    number: '06',
    component: PixelWallPage,
  },
];
