import React from 'react';
import { NavLink } from 'react-router-dom';

export default function Nav() {
  return (
    <div>
      <NavLink to="/">home</NavLink> | <NavLink to="/site">site</NavLink> | <NavLink to="/about">about</NavLink> |
      <NavLink to="/test">test</NavLink> |<NavLink to="/aaa">404</NavLink>
    </div>
  );
}
