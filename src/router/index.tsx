import React from 'react';
import { Navigate, RouteObject } from 'react-router-dom';
import Counter from 'Src/components/Counter';
import Loading from 'Src/components/Loading';
import About from 'Src/views/About';

import Home from 'Src/views/Home';
import NotFound from 'Src/views/NotFound';
import Site from 'Src/views/Site';
import Test from 'Src/views/Test';
import Tools from 'Src/views/Tools';
import { tools } from 'Src/views/Tools/tools';
import TweenDemo from 'Src/views/Test/components/TweenDemo';
import ColorTransform from 'Src/views/Test/components/ColorTransform';
import Login from 'Src/views/Login';
import Main from 'Src/components/Main';

export const routeConfig: RouteObject[] = [
  {
    path: '/',
    element: (
      <Main>
        <Home />
      </Main>
    ),
  },
  {
    path: 'login',
    element: <Login />,
  },
  {
    path: '/site',
    element: (
      <Main>
        <Site />
      </Main>
    ),
  },
  {
    path: '/about',
    element: (
      <Main>
        <About />
      </Main>
    ),
  },
  {
    path: '/test',
    element: (
      <Main>
        <Test />
      </Main>
    ),
    children: [
      {
        path: 'counter',
        index: true,
        element: <Counter />,
      },
      {
        path: 'tween',
        element: <TweenDemo />,
      },
      {
        path: 'loading',
        element: <Loading />,
      },
      {
        path: 'color-transform',
        element: <ColorTransform />,
      },
    ],
  },
  {
    path: '/tools',
    element: (
      <Main>
        <Tools />
      </Main>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="json" replace />,
      },
      ...tools.map((tool) => ({
        path: tool.path,
        element: tool.element,
      })),
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
];
