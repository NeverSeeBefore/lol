// counterSlice.ts 文件

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Action, AppDispatch, RootState } from '../type';

export interface CounterState {
  value: number;
  title: string;
  loading: boolean;
}

const initialState: CounterState = {
  value: 0,
  title: 'redux toolkit pre',
  loading: false,
};

export const fetchSyncNumber = createAsyncThunk<number, number, { dispatch: AppDispatch; state: RootState }>(
  'counter/getSyncNumber',
  async (max, api) => {
    const data = await new Promise<number>((resolve, reject) => {
      setTimeout(() => {
        resolve(Math.floor(Math.random() * max));
      }, 3000);
    });
    return data;
  },
  {
    condition(arg, api) {
      console.log('condition', arg, api);
      return !api.getState().counter.loading;
    },
  },
);

// 创建一个 Slice
export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  // 定义 reducers 并生成关联的操作
  reducers: {
    // 定义一个加的方法
    increment: (state) => {
      state.value += 1;
    },
    // 定义一个减的方法
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action: Action<number>) => {
      state.value += action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchSyncNumber.pending, (state, action) => {
        console.log('pending', action);
        state.loading = true;
      })
      .addCase(fetchSyncNumber.fulfilled, (state, action) => {
        console.log('fulfilled', action);
        state.loading = false;
        state.value = action.payload;
      })
      .addCase(fetchSyncNumber.rejected, (state, action) => {
        console.log('rejected', action);
        state.loading = false;
      });
  },
});

// 导出 actionCreator
export const { increment, decrement, incrementByAmount } = counterSlice.actions;
