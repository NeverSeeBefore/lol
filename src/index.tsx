import React from 'react';
import { createRoot } from 'react-dom/client';
import './app.less';
import App from './app';

const container = document.createElement('div');
document.body.append(container);
container.id = 'root';
const root = createRoot(container); // createRoot(container!) if you use TypeScript
root.render(<App name="aaa" age={222} />);
