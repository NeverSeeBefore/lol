import { AxiosResponse } from "axios";
import request from "./index";

const PATH = {
  testData: "/api/testData",
};

export const API = {
  getTestData: () => request.get<any, AxiosResponse<string, string>, any>(PATH.testData),
};

// export const API = {
//   middleViewData: (data: any) =>
//     request.get("/jscApi/middleViewData", { data }), // 正常请求
//   cancelReq: (data: any) =>
//     request.get("http://localhost:3003/jscApi/middleViewData", {
//       data,
//       cancelRequest: true,
//     } as AxiosRequestConfig), // 测试取消请求
//   reqAgainSend: (data: any) =>
//     request.get("/equ/equTypeList11", { data, retry: 3, retryDelay: 1000 } as AxiosRequestConfig), // 测试请求重发，除了原请求外还会重发3次
//   cacheEquList: (data: any) =>
//     request.get("/equ/equList", { data, cache: true, setExpireTime: 30000 } as AxiosRequestConfig), // 测试缓存请求带参数：setExpireTime 为缓存有效时间ms
//   cacheEquListParams: (data: any) =>
//     request.get("/equ/equList", { data, cache: true } as AxiosRequestConfig), // 测试缓存请求参数值不一样
// };

// cancelRequest: true       // 接口中定义该项则开启取消重复请求功能
// retry: 3, retryDelay: 1000  // retry 请求重试次数，retryDelay 两次重试之间的时间间隔
// cache: true, setExpireTime: 30000  // cache： true 开启当前接口缓存，setExpireTime 当前接口缓存时限
