import React from 'react';
import { add } from 'Utils/math';
import Nav from 'Components/Nav';
import { useRoutes } from 'react-router-dom';
import { routeConfig } from './router';

interface IProps {
  name: string;
  age: number;
}

function App(props: IProps) {
  const { name, age } = props;
  return (
    <div className="app">
      <Nav />
      <span>{`Hello! I'm ${name}, ${age} years old.`}</span>
      <span>{add(111, 222)}</span>
      {useRoutes(routeConfig)}
    </div>
  );
}

export default App;
