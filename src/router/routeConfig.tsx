import { Outlet, RouteObject } from "react-router-dom";
import Home from "../page/home";
import Login from "../page/login";


export const routeConfig: RouteObject[] = [
  {
    path: "*",
    element: <h3>404</h3>,
  },
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "login",
    element: <Login />,
  },
  {
    path: "test",
    element: <h3>test<Outlet></Outlet></h3>,
    children: [
      {
        path: 'a',
        element: <div>aaaaa</div>
      },
      {
        path: 'b',
        element: <div>bbbbb</div>
      },
      {
        path: '*',
        element: <div>*****</div>
      }
    ]
  }
];

// export function RootRouter() {
//   return useRoutes(routeConfig);
// }
