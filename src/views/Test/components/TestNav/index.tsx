import React from 'react';
import { NavLink } from 'react-router-dom';

export default function TestNav() {
  return (
    <div>
      <NavLink to="">home</NavLink> | <NavLink to="counter">counter</NavLink> | <NavLink to="tween">tween</NavLink> |
      <NavLink to="loading">loading</NavLink> |<NavLink to="aaa">404</NavLink>
    </div>
  );
}
