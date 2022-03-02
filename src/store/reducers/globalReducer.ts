import { Reducer } from "react";
import { IAction } from "../constants";

// 全局通用状态
const defaultState = {
  // 提示文案
  // message: ''
};

export const globalReducer: Reducer<typeof defaultState, IAction<any>> = (
  state = defaultState,
  { type, payload }
) => {
  switch (type) {
    default:
      return state;
  }
};
