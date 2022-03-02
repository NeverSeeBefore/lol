import * as constants from "../constants";

export const createSetDataAction = (payload: string) => ({
  type: constants.TEST_SET_DATA,
  payload,
});

export const createSetDataAsyncAction = (payload: string) => ({
    type: constants.TEST_SET_DATA_ASYNC,
    payload
});

export const createFetchDataAction = () => ({
  type: constants.TEST_FETCH_DATA,
  payload: null
})
