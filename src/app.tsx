import React from 'react';
import Test from 'Components/Test';
import { add } from 'Utils/math';

interface IProps {
  name: string;
  age: number;
}

function App(props: IProps) {
  const { name, age } = props;
  return (
    <div className="app">
      <span>{`Hello! I'm ${name}, ${age} years old.`}</span>
      <span>{add(111, 222)}</span>
      <Test />
    </div>
  );
}

export default App;
