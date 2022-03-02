import { fork } from "redux-saga/effects";
import { testTask } from "./testTask";

export const sagaTask = function* () {

  yield fork(testTask);

};
