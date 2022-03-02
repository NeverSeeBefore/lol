import { Route } from "react-router-dom";


export function getRoute(routes: any) {
  if (!Array.isArray(routes)) {
    return [];
  }
  return routes.map((it, index) => {
    const { children, element, ...res } = it;
    return (
      <Route {...res} key={index}>
        <Route path="" element={element}></Route>
        {getRoute(children)}
      </Route>
    );
  });
}
