import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from './index.module.less';

export default function Nav() {
  return (
    <div className={styles['nav-wrap']}>
      <NavLink to="/">home</NavLink> | <NavLink to="/site">site</NavLink> | <NavLink to="/about">about</NavLink> |
      <NavLink to="/test">test</NavLink> |<NavLink to="/aaa">404</NavLink>
    </div>
  );
}
