import { Reducer } from "react";

import {IAction, TEST_SET_DATA} from "../constants";

// 初始默认的state
const defaultState = {
  myData: "",
};



const testReducer: Reducer<typeof defaultState, IAction<any>>= (
  state = defaultState,
  { type, payload }
) => {
  // 由于state是引用型，不能直接修改，否则是监测不到state发生变化的。因此需要先复制一份进行修改，然后再返回新的state。
  let newState = Object.assign({}, state);
  switch (type) {
    case TEST_SET_DATA:
      newState.myData = payload;
      return newState;
    default:
      return state;
  }
};

export default testReducer;
