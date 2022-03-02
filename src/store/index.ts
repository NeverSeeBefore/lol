import { createStore, applyMiddleware, compose } from "redux";
import { TestActionCreator } from "./actions";
import { reducer } from "./reducers";
import { createLogger } from "redux-logger";
import createSagaMiddleware from "redux-saga";
import { sagaTask } from "./saga/task";

const logger = createLogger();
const sagaMiddleware = createSagaMiddleware();

// 这里让项目支持浏览器插件Redux DevTools
const composeEnhancers =
  process.env.NODE_ENV === 'development' && typeof window === "object" && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({})
    : compose;

const enhancer = composeEnhancers(applyMiddleware(logger, sagaMiddleware));

const store = createStore(reducer, undefined, enhancer);
sagaMiddleware.run(sagaTask);

export default store;

window.store = store;

store.dispatch(TestActionCreator.createSetDataAction("hello world"));

store.dispatch(TestActionCreator.createSetDataAsyncAction("hello world sync"));

// setTimeout(() => {
//   store.dispatch(
//     TestActionCreator.createSetDataAsyncAction("hello world sync 5000")
//   );
// }, 5000);

store.dispatch(TestActionCreator.createFetchDataAction());

