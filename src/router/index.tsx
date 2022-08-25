import React from 'react';
import { RouteObject } from 'react-router-dom';
import About from 'Src/views/About';

import Home from 'Src/views/Home';
import NotFound from 'Src/views/NotFound';
import Site from 'Src/views/Site';
import Test from 'Src/views/Test';

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
  },
  {
    path: '*',
    element: <NotFound />,
  },
];
