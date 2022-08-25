import { ThunkAction } from '@reduxjs/toolkit';
import { store } from './index';
// TODO: 循环引用了，但是怎么解决呢？

export interface Action<T> {
  type: string;
  payload: T;
}
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// export type AppThunkApi = {
//   /** return type for `thunkApi.getState` */
//   state: RootState;
//   /** type for `thunkApi.dispatch` */
//   dispatch: AppDispatch;
//   /** type of the `extra` argument for the thunk middleware, which will be passed in as `thunkApi.extra` */
//   extra: unknown;
//   /** type to be passed into `rejectWithValue`'s first argument that will end up on `rejectedAction.payload` */
//   rejectValue: unknown;
//   /** return type of the `serializeError` option callback */
//   serializedErrorType: unknown;
//   /** type to be returned from the `getPendingMeta` option callback & merged into `pendingAction.meta` */
//   pendingMeta: unknown;
//   /** type to be passed into the second argument of `fulfillWithValue` to finally be merged into `fulfilledAction.meta` */
//   fulfilledMeta: unknown;
//   /** type to be passed into the second argument of `rejectWithValue` to finally be merged into `rejectedAction.meta` */
//   rejectedMeta: unknown;
// };

// export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, Action<string>>;
