import { combineReducers } from "redux";
import { globalReducer } from "./globalReducer";
import testReducer from "./testReducer";


export const reducer = combineReducers({
    test: testReducer,
    global: globalReducer
})