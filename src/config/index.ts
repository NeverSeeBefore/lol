const isDev = process.env.NODE_ENV === "development";
console.log('process.env.NODE_ENV', process.env.NODE_ENV);
console.log('process.env.REACT_APP_ENV', process.env.REACT_APP_ENV);

export const REQUEST_BASE_URL = isDev ? "" : "http://localhost:12306";
export const REQUEST_TIMEOUT = 10000;
