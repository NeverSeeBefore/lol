import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'Static/styles/global.less';
import App from './app';

const root = createRoot(document.getElementById('root')!);
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
