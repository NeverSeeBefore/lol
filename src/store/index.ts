import { Action, configureStore, ThunkAction } from '@reduxjs/toolkit';
import { counterSlice } from './feature/counterSlice';

export const store = configureStore({
  reducer: {
    counter: counterSlice.reducer,
  },
});
