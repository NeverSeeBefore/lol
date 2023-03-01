import React from 'react';
import { RouteObject } from 'react-router-dom';
import Counter from 'Src/components/Counter';
import Loading from 'Src/components/Loading';
import About from 'Src/views/About';

import Home from 'Src/views/Home';
import NotFound from 'Src/views/NotFound';
import Site from 'Src/views/Site';
import Test from 'Src/views/Test';
import TweenDemo from 'Src/views/Test/components/TweenDemo';
import ColorTransform from 'Src/views/Test/components/ColorTransform';

export const routeConfig: RouteObject[] = [
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/site',
    element: <Site />,
  },
  {
    path: '/about',
    element: <About />,
  },
  {
    path: '/test',
    element: <Test />,
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
    path: '*',
    element: <NotFound />,
  },
];
