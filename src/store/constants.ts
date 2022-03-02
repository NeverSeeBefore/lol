export interface IAction<P, T = string> {
  type: T;
  payload: P;
}

// TEST
export const TEST_SET_DATA = "SET_DATA";
export const TEST_SET_DATA_ASYNC = "SET_DATA_ASYNC";
export const TEST_FETCH_DATA = "TEST_FETCH_DATA";