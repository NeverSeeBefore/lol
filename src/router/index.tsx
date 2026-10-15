import { createElement, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
import { tools } from 'Src/views/Tools/tools';
import { experiments } from 'Src/views/Lab/experiments';
import Main from 'Src/components/Main';

const Counter = lazy(() => import('Src/components/Counter'));
const Loading = lazy(() => import('Src/components/Loading'));
const About = lazy(() => import('Src/views/About'));
const Home = lazy(() => import('Src/views/Home'));
const NotFound = lazy(() => import('Src/views/NotFound'));
const Site = lazy(() => import('Src/views/Site'));
const Test = lazy(() => import('Src/views/Test'));
const Tools = lazy(() => import('Src/views/Tools'));
const Lab = lazy(() => import('Src/views/Lab'));
const TweenDemo = lazy(() => import('Src/views/Test/components/TweenDemo'));
const ColorTransform = lazy(() => import('Src/views/Test/components/ColorTransform'));
const Login = lazy(() => import('Src/views/Login'));

function withFallback(element: ReactNode) {
  return <Suspense fallback={<div role="status">加载中…</div>}>{element}</Suspense>;
}

export const routeConfig: RouteObject[] = [
  {
    path: '/',
    element: <Main>{withFallback(<Home />)}</Main>,
  },
  {
    path: 'login',
    element: withFallback(<Login />),
  },
  {
    path: '/site',
    element: <Main>{withFallback(<Site />)}</Main>,
  },
  {
    path: '/about',
    element: <Main>{withFallback(<About />)}</Main>,
  },
  {
    path: '/test',
    element: <Main>{withFallback(<Test />)}</Main>,
    children: [
      {
        path: 'counter',
        index: true,
        element: withFallback(<Counter />),
      },
      {
        path: 'tween',
        element: withFallback(<TweenDemo />),
      },
      {
        path: 'loading',
        element: withFallback(<Loading />),
      },
      {
        path: 'color-transform',
        element: withFallback(<ColorTransform />),
      },
    ],
  },
  {
    path: '/lab',
    element: <Main>{withFallback(<Lab />)}</Main>,
    children: [
      {
        index: true,
        element: <Navigate to="kaomoji" replace />,
      },
      ...experiments.map((experiment) => ({
        path: experiment.path,
        element: withFallback(createElement(experiment.component)),
      })),
      {
        path: '*',
        element: withFallback(<NotFound />),
      },
    ],
  },
  {
    path: '/tools',
    element: <Main>{withFallback(<Tools />)}</Main>,
    children: [
      {
        index: true,
        element: <Navigate to="json" replace />,
      },
      ...tools.map((tool) => ({
        path: tool.path,
        element: withFallback(tool.element),
      })),
      {
        path: '*',
        element: withFallback(<NotFound />),
      },
    ],
  },
  {
    path: '*',
    element: withFallback(<NotFound />),
  },
];
