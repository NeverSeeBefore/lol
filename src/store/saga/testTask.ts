import { Axios, AxiosResponse } from "axios";
import { delay, put, takeEvery } from "redux-saga/effects";
import { API } from "../../api/api";
import { TestActionCreator } from "../actions";
import { IAction, TEST_FETCH_DATA, TEST_SET_DATA_ASYNC } from "../constants";

function* setDataAsync(action: IAction<string>) {
  try {
    yield delay(3000);
    yield put(TestActionCreator.createSetDataAction(action.payload));
  } catch (error) {
    // set gloabl message, type warn;
    // put()
  }
}

function* fetchData() {
  try {
    const responseData: AxiosResponse = yield API.getTestData();
    yield put(TestActionCreator.createSetDataAction(responseData.data));
  } catch (error) {
    // set gloabl message, type warn;
    // put()
  }
}

export function* testTask() {
  yield takeEvery(TEST_SET_DATA_ASYNC, setDataAsync);
  yield takeEvery(TEST_FETCH_DATA, fetchData);
}
