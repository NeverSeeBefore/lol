import React from 'react';
import { add } from 'Utils/math';
import Nav from 'Components/Nav';
import { useRoutes } from 'react-router-dom';
import { routeConfig } from './router';

interface IProps {}

function App(props: IProps) {
  return (
    <div className="app">
      <Nav />
      {useRoutes(routeConfig)}
    </div>
  );
}

export default App;
