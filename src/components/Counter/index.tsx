import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from 'Src/hooks';
import { incrementByAmount, decrement, increment, fetchSyncNumber } from 'Src/store/feature/counterSlice';
import styles from './index.module.less';

console.log(styles);

export default function Counter() {
  console.log('render');

  const dispatch = useAppDispatch();
  const { value: countValue, loading, title } = useAppSelector((state) => state.counter);
  const [amount, setAmount] = useState(1);

  return (
    <div className={styles['counter-container']}>
      <div>counter: {title}</div>
      <div>{countValue}</div>
      <div>
        <button
          type="button"
          onClick={() => {
            dispatch(increment());
          }}
        >
          increase
        </button>
        <button
          type="button"
          onClick={() => {
            dispatch(decrement());
          }}
        >
          decrease
        </button>
        <button
          type="button"
          onClick={() => {
            dispatch(fetchSyncNumber(20));
          }}
        >
          set-sync-num
        </button>
        {loading ? <span>加载中</span> : null}
      </div>
      <div>
        <input value={amount} type="number" name="" id="" onChange={(e) => setAmount(+e.target.value)} />
        <button type="button" onClick={() => dispatch(incrementByAmount(amount))}>
          add-num
        </button>
      </div>
    </div>
  );
}
