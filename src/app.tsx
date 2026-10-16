import { useRoutes } from 'react-router-dom';
import { routeConfig } from './router';
import './app.less';

function App() {
  return (
    <div className="app">
      <div className="main">{useRoutes(routeConfig)}</div>
    </div>
  );
}

export default App;
