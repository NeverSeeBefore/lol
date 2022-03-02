import React from "react";
import { BrowserRouter, useRoutes } from "react-router-dom";
import { routeConfig } from "./router/routeConfig";

function App() {
  return (
    <BrowserRouter>
      <RootRouter></RootRouter>
    </BrowserRouter>
  );
}

function RootRouter() {
  return useRoutes(routeConfig);
}

export default App;
