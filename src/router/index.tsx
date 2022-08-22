import React from 'react';
import { RouteObject, useRoutes } from 'react-router-dom';
import About from 'Src/views/About';

import Home from 'Src/views/Home';
import NotFound from 'Src/views/NotFound';
import Site from 'Src/views/Site';

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
    path: '*',
    element: <NotFound />,
  },
];
