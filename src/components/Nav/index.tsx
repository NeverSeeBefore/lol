import React from 'react';
import { Link } from 'react-router-dom';

export default function Nav() {
  return (
    <div>
      <Link to="/">home</Link> | <Link to="/site">site</Link> | <Link to="/about">about</Link> |
      <Link to="/aaa">404</Link>
    </div>
  );
}
