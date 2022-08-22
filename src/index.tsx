import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'Static/styles/global.less';
import App from './app';

const container = document.createElement('div');
document.body.append(container);
container.id = 'root';
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(
  <BrowserRouter>
    <App name="cxx" age={26} />
  </BrowserRouter>,
);
