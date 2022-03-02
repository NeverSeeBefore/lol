import React from "react";
import {
  Location,
  NavigateFunction,
  Params,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

// 5 版本 的 类型定义，太高深看不懂
// interface StaticContext {
//   statusCode?: number | undefined;
// }

type Omit<T, K extends keyof T> = T extends any
  ? Pick<T, Exclude<keyof T, K>>
  : never;

export interface RouteComponentProps<
  RParams extends { [K in keyof RParams]?: string } = {}
> {
  location: Location;
  navigate: NavigateFunction;
  params: Params<string>;
}

type WithRouterProps<C extends React.ComponentType<any>> =
  C extends React.ComponentClass
    ? { wrappedComponentRef?: React.Ref<InstanceType<C>> | undefined }
    : {};

// export interface WithRouterStatics<C extends React.ComponentType<any>> {
//   WrappedComponent: C;
// }

// export function withRouter<
//   P extends RouteComponentProps<any>,
//   C extends React.ComponentType<P>
// >(
//   component: C & React.ComponentType<P>
// ): React.ComponentClass<
//   Omit<P, keyof RouteComponentProps<any>> & WithRouterProps<C>
// > &
//   WithRouterStatics<C>;

export function withRouter<
  P extends RouteComponentProps<any>,
  C extends React.ComponentType<P>
>(Component: React.ComponentClass<any>) {
  return function ComponentWithRouterProp(
    props: Omit<P, keyof RouteComponentProps<any>> & WithRouterProps<C>
  ) {
    const router = {
      location: useLocation(),
      navigate: useNavigate(),
      params: useParams(),
    };
    return <Component {...props} {...router} />;
  };
}
