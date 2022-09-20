import React from 'react';
import Nav from 'Components/Nav';
import { useRoutes } from 'react-router-dom';
import { routeConfig } from './router';
import './app.less';

function App() {
  return (
    <div className="app">
      <Nav />
      <div className="main">{useRoutes(routeConfig)}</div>
    </div>
  );
}

export default App;
