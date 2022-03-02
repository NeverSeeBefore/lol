import Axios, { AxiosResponse } from "axios";
import { REQUEST_BASE_URL, REQUEST_TIMEOUT } from "../config";

import { clearToken, getToken } from "./commonFuns";

export interface ResponseData<T> {
  code: number;
  msg: string;
  data: T;
}


// TODO:
// 返回结果处理
// 自定义约定接口返回{code: xxx, data: xxx, msg:'err message'}
// type ResponseHandle ='200' | '401' | 'default';

const responseHandle = {
  200: (response: AxiosResponse) => {
    // TODO:
    // 应该是这里加判断，如果是0，返回数据，否则就是请求错误，走reject？
    // if (res.code === 0) {
    //   resolve(res.data);
    // } else {
    //   // 通过配置可关闭错误提示
    //   if (options.error) Message.error(res.message);
    //   reject(res);
    // }
    return response.data;
  },
  401: (response: AxiosResponse) => {
    // TODO:
    // 创建全局提示
    // Notification({
    //   title: "认证异常",
    //   message: "登录状态已过期，请重新登录！",
    //   type: "error",
    // });
    clearToken();
    window.location.href = window.location.origin;
  },
  default: (response: AxiosResponse) => {
    // TODO:
    // 创建全局提示
    // Notification({
    //   title: "操作失败",
    //   message: response.data.msg,
    //   type: "error",
    // });
    return Promise.reject(response);
  },
};

const axios = Axios.create({
  baseURL: REQUEST_BASE_URL,
  timeout: REQUEST_TIMEOUT,
});

// 添加请求拦截器
axios.interceptors.request.use(
  function (config) {
    if (!config.method) {
      throw new Error("请求没有设置method？");
    }

    if (!config.headers) {
      config.headers = {};
    }
    // 请求头用于接口token 认证
    getToken() && (config.headers["Authorization"] = getToken());
    // config.headers["Access-Control-Allow-Origin"] = REQUEST_BASE_URL;

    if (
      config.method.toLocaleLowerCase() === "post" ||
      config.method.toLocaleLowerCase() === "put"
    ) {
      // 参数统一处理，请求都使用data传参
      config.data = config.data.data;
    } else if (
      config.method.toLocaleLowerCase() === "get" ||
      config.method.toLocaleLowerCase() === "delete"
    ) {
      // 参数统一处理
      config.params = config.data;
    } else {
      alert("不允许的请求方法：" + config.method);
    }

    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// 添加响应拦截器
axios.interceptors.response.use(
  (response) => {
    // TODO: 返回状态码是不是 response.status;
    // response.data.code 是后端返回的状态吗？
    return responseHandle[200](response);
    // return responseHandle[response.data.code || "default"](response);
  },
  (error) => {
    // // TODO:
    // // 后续完善错误状态码的判断
    // if (error.response.status) {
    //   switch (error.response.status) {
    //     // 401: 未登录
    //     // 未登录则跳转登录页面，并携带当前页面的路径
    //     // 在登录成功后返回当前页面，这一步需要在登录页操作。
    //     case 401:
    //       router.replace({
    //         path: "/login",
    //         query: {
    //           redirect: router.currentRoute.fullPath,
    //         },
    //       });
    //       break;

    //     // 403 token过期
    //     // 登录过期对用户进行提示
    //     // 清除本地token和清空vuex中token对象
    //     // 跳转登录页面
    //     case 403:
    //       Toast({
    //         message: "登录过期，请重新登录",
    //         duration: 1000,
    //         forbidClick: true,
    //       });
    //       // 清除token
    //       localStorage.removeItem("token");
    //       store.commit("loginSuccess", null);
    //       // 跳转登录页面，并将要浏览的页面fullPath传过去，登录成功后跳转需要访问的页面
    //       setTimeout(() => {
    //         router.replace({
    //           path: "/login",
    //           query: {
    //             redirect: router.currentRoute.fullPath,
    //           },
    //         });
    //       }, 1000);
    //       break;

    //     // 404请求不存在
    //     case 404:
    //       Toast({
    //         message: "网络请求不存在",
    //         duration: 1500,
    //         forbidClick: true,
    //       });
    //       break;
    //     // 其他错误，直接抛出错误提示
    //     default:
    //       Toast({
    //         message: error.response.data.message,
    //         duration: 1500,
    //         forbidClick: true,
    //       });
    //   }
    //   return Promise.reject(error);
    // }
    return Promise.reject(error);
  }
);
export default axios;
