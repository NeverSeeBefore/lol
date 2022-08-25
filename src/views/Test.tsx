import React from 'react';
import Counter from 'Src/components/Counter';
import { add } from 'Utils/math';

interface IProps {}

function Test(props: IProps) {
  const a = 111;
  const b = 222;
  return (
    <div className="app">
      <Counter />

      <div>a : {a}</div>
      <div>b : {b}</div>
      <span>add: {add(a, b)}</span>
    </div>
  );
}

export default Test;
